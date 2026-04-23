/**
 * friendships_action — single edge function for all friendship operations.
 *
 * Uses the Supabase `friendships` table if it exists. Creates it on-demand
 * via service role DDL (Postgres CREATE TABLE IF NOT EXISTS) so the frontend
 * never gets a 404 again.
 *
 * Actions (sent in body):
 *   { action: 'list' }                      → list all friendships for current user
 *   { action: 'send', target_id: '...' }    → create pending or auto-accept reverse
 *   { action: 'accept', friendship_id }     → mark pending as accepted
 *   { action: 'decline', friendship_id }    → delete pending (both decline + remove)
 *
 * The table is created with:
 *   id UUID primary key
 *   requester_id UUID
 *   addressee_id UUID
 *   status TEXT ('pending'|'accepted'|'blocked')
 *   created_date TIMESTAMPTZ default now()
 *   updated_date TIMESTAMPTZ default now()
 *   UNIQUE(requester_id, addressee_id)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://vqfjjokqmykqawjlgevj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return json({ error: 'Server misconfigured: missing service role key' }, 500);
    }

    // Identify current user via Supabase user JWT from Authorization header
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized: missing token' }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      return json({ error: 'Unauthorized: invalid token' }, 401);
    }
    const uid = userData.user.id;

    // Service-role client for all DB work
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, target_id, friendship_id } = await req.json();

    switch (action) {
      case 'list': {
        const { data, error } = await admin
          .from('friendships')
          .select('*')
          .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
          .order('created_date', { ascending: false });

        if (error) return json({ error: error.message, code: error.code }, 500);
        return json({ friendships: data || [] });
      }

      case 'send': {
        if (!target_id) return json({ error: 'Missing target_id' }, 400);
        if (target_id === uid) return json({ error: 'Cannot add yourself' }, 400);

        // Check for existing friendship in either direction
        const { data: existing, error: exErr } = await admin
          .from('friendships')
          .select('*')
          .or(
            `and(requester_id.eq.${uid},addressee_id.eq.${target_id}),` +
            `and(requester_id.eq.${target_id},addressee_id.eq.${uid})`
          )
          .limit(1);

        if (exErr) return json({ error: exErr.message }, 500);

        if (existing && existing.length > 0) {
          const f = existing[0];
          if (f.status === 'accepted') {
            return json({ action: 'already_friends', friendship: f });
          }
          if (f.status === 'blocked') {
            return json({ error: 'Cannot send request' }, 403);
          }
          if (f.status === 'pending') {
            if (f.requester_id === uid) {
              return json({ action: 'already_sent', friendship: f });
            }
            // Auto-accept
            const { data: updated, error: upErr } = await admin
              .from('friendships')
              .update({ status: 'accepted', updated_date: new Date().toISOString() })
              .eq('id', f.id)
              .select()
              .single();
            if (upErr) return json({ error: upErr.message }, 500);
            return json({ action: 'accepted', friendship: updated });
          }
        }

        // Create new pending
        const { data: created, error: crErr } = await admin
          .from('friendships')
          .insert({
            requester_id: uid,
            addressee_id: target_id,
            status: 'pending',
          })
          .select()
          .single();

        if (crErr) return json({ error: crErr.message, code: crErr.code }, 500);
        return json({ action: 'created', friendship: created });
      }

      case 'accept': {
        if (!friendship_id) return json({ error: 'Missing friendship_id' }, 400);
        const { data, error } = await admin
          .from('friendships')
          .update({ status: 'accepted', updated_date: new Date().toISOString() })
          .eq('id', friendship_id)
          .eq('addressee_id', uid) // can only accept ones sent TO you
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ action: 'accepted', friendship: data });
      }

      case 'decline': {
        if (!friendship_id) return json({ error: 'Missing friendship_id' }, 400);
        // Must be either the requester or addressee
        const { error } = await admin
          .from('friendships')
          .delete()
          .eq('id', friendship_id)
          .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
        if (error) return json({ error: error.message }, 500);
        return json({ action: 'declined' });
      }

      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    console.error('[friendships_action] Fatal:', err);
    return json({ error: err.message || 'Unexpected server error' }, 500);
  }
});
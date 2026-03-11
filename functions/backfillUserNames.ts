/**
 * Backfill full_name from auth.users metadata to public.users
 * 
 * This fixes users who registered but whose full_name never made it
 * to the public.users table.
 * 
 * Admin-only function.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get('https://vqfjjokqmykqawjlgevj.supabase.co') || 'https://vqfjjokqmykqawjlgevj.supabase.co';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (!SERVICE_ROLE_KEY) {
      return Response.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY not set. Add it in dashboard settings.' 
      }, { status: 500 });
    }

    // Step 1: Get all public.users where full_name is null or 'Ny spelare'
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    };

    const usersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?or=(full_name.is.null,full_name.eq.Ny spelare)&select=id,full_name,email,username`,
      { headers }
    );
    
    if (!usersRes.ok) {
      const body = await usersRes.text();
      return Response.json({ error: `Failed to fetch public users: ${usersRes.status}`, detail: body }, { status: 500 });
    }

    const publicUsers = await usersRes.json();
    console.log(`[backfillUserNames] Found ${publicUsers.length} users with missing full_name`);

    if (publicUsers.length === 0) {
      return Response.json({ ok: true, message: 'No users need backfilling', updated: 0 });
    }

    // Step 2: For each user, fetch from auth.users via admin API
    let updated = 0;
    const errors = [];

    for (const pu of publicUsers) {
      try {
        // Get auth user by ID
        const authRes = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users/${pu.id}`,
          { headers }
        );

        if (!authRes.ok) {
          errors.push({ id: pu.id, error: `auth fetch failed: ${authRes.status}` });
          continue;
        }

        const authUser = await authRes.json();
        const fullName = authUser.user_metadata?.full_name 
                      || authUser.raw_user_meta_data?.full_name
                      || null;
        const email = authUser.email || null;

        if (!fullName && !email) {
          errors.push({ id: pu.id, error: 'No full_name or email in auth metadata' });
          continue;
        }

        // Build update payload
        const updateBody = {};
        if (fullName) {
          updateBody.full_name = fullName;
          updateBody.display_name = fullName;
        }
        if (email && !pu.email) {
          updateBody.email = email;
        }
        // Also set username from email if missing
        if (!pu.username && email) {
          updateBody.username = email.split('@')[0];
        }

        if (Object.keys(updateBody).length === 0) {
          continue;
        }

        // PATCH public.users
        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/users?id=eq.${pu.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updateBody)
          }
        );

        if (patchRes.ok || patchRes.status === 204) {
          updated++;
          console.log(`[backfillUserNames] Updated ${pu.id}: ${JSON.stringify(updateBody)}`);
        } else {
          const body = await patchRes.text();
          errors.push({ id: pu.id, error: `PATCH failed: ${patchRes.status} - ${body}` });
        }
      } catch (e) {
        errors.push({ id: pu.id, error: e.message });
      }
    }

    return Response.json({
      ok: true,
      total_checked: publicUsers.length,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[backfillUserNames] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
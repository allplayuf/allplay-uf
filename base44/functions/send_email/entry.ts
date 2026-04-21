/**
 * send_email edge function
 *
 * Replaces base44.integrations.Core.SendEmail.
 *
 * Accepts: { to, subject, body, from_name? }
 * Uses Resend API. Requires RESEND_API_KEY + RESEND_FROM_EMAIL secrets.
 *
 * Example RESEND_FROM_EMAIL: "AllPlay <noreply@allplay.app>"
 */

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'AllPlay <onboarding@resend.dev>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500);

    // Auth
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userRes, error: userErr } = await sb.auth.getUser(jwt);
    if (userErr || !userRes?.user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const { to, subject, body: emailBody, from_name } = body;

    if (!to || !subject || !emailBody) {
      return json({ error: 'to, subject and body are required' }, 400);
    }

    // Override from-name if provided (and it's safe — no email injection)
    let from = RESEND_FROM_EMAIL;
    if (from_name && /^[\w\s.-]{1,60}$/.test(from_name)) {
      const email = RESEND_FROM_EMAIL.match(/<([^>]+)>/)?.[1] || RESEND_FROM_EMAIL;
      from = `${from_name} <${email}>`;
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: emailBody.includes('<') ? emailBody : `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
        text: emailBody.replace(/<[^>]+>/g, ''),
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('[send_email] Resend error:', data);
      return json({ error: data?.message || 'Email send failed' }, resp.status);
    }

    return json({ ok: true, id: data.id });
  } catch (err) {
    console.error('[send_email] fatal:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});
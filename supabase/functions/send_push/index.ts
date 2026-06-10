// Manual / programmatic push endpoint. Accepts a single user_id or a
// user_ids array and delivers via the shared sendPushNotification helper
// (Expo Push API for ExponentPushToken[...], direct APNs for raw tokens).
//
// Auth: service-role key OR any authenticated user JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushNotification } from '../_shared/push.ts';

const ALLOWED_ORIGINS = [
  'https://allplayuf.se',
  'https://www.allplayuf.se',
  'http://localhost:5173',
  'http://localhost:3000',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin === null || // native app (Capacitor / WKWebView)
    ALLOWED_ORIGINS.includes(origin) ||
    (origin !== null && /^https:\/\/.*\.allplayuf\.se$/.test(origin)) ||
    (origin !== null && /^https:\/\/.*\.base44\.app$/.test(origin));

  return {
    'Access-Control-Allow-Origin': allowed ? (origin ?? '*') : 'https://allplayuf.se',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors });
  }

  try {
    // ── Auth: accept service-role key OR authenticated user ──
    const authHeader = req.headers.get('authorization') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;

    if (!isServiceRole) {
      const anonClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { authorization: authHeader } } },
      );
      const { error } = await anonClient.auth.getUser();
      if (error) {
        return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
      }
    }

    // ── Parse body ──
    const { user_id, user_ids, title, title_en, body: msgBody, body_en, data } = await req.json();
    const ids: string[] = Array.isArray(user_ids) ? user_ids : (user_id ? [user_id] : []);

    if (ids.length === 0 || !title || !msgBody) {
      return Response.json(
        { error: 'user_id (or user_ids), title, body required' },
        { status: 400, headers: cors },
      );
    }

    const result = await sendPushNotification(
      ids,
      { sv: title, en: title_en ?? title },
      { sv: msgBody, en: body_en ?? msgBody },
      data ?? {},
    );

    if (result.error) {
      return Response.json({ sent: false, error: result.error }, { status: 500, headers: cors });
    }
    if (result.total === 0) {
      return Response.json({ sent: false, reason: 'no_device_token' }, { headers: cors });
    }

    return Response.json(
      { sent: result.sent > 0, delivered: result.sent, total: result.total, cleaned: result.cleaned },
      { headers: cors },
    );
  } catch (err) {
    console.error('[send_push] error:', err);
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});

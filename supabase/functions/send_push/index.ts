import { createClient } from 'jsr:@supabase/supabase-js@2';

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

// ── APNs JWT — generated per-call (valid 1h, but we keep it simple) ──────────

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function encodeJson(obj: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(obj)).buffer as ArrayBuffer);
}

async function buildApnsJwt(keyId: string, teamId: string, p8Pem: string): Promise<string> {
  // Strip PEM header/footer and whitespace, decode to DER
  const b64 = p8Pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    der.buffer as ArrayBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const header = encodeJson({ alg: 'ES256', kid: keyId });
  const payload = encodeJson({ iss: teamId, iat: Math.floor(Date.now() / 1000) });
  const signingInput = `${header}.${payload}`;

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(sig)}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey,
    );

    if (!isServiceRole) {
      // Verify JWT is a valid user token
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
    const { user_id, title, body: msgBody, data } = await req.json();
    if (!user_id || !title || !msgBody) {
      return Response.json({ error: 'user_id, title, body required' }, { status: 400, headers: cors });
    }

    // ── Look up device token ──
    const { data: devices, error: dbErr } = await supabase
      .from('user_devices')
      .select('id, expo_push_token')
      .eq('user_id', user_id)
      .eq('platform', 'ios')
      .limit(1);

    if (dbErr) throw dbErr;
    if (!devices || devices.length === 0) {
      return Response.json({ sent: false, reason: 'no_device_token' }, { headers: cors });
    }

    const { id: deviceRowId, expo_push_token: deviceToken } = devices[0];

    // ── APNs config ──
    const keyId    = Deno.env.get('APNS_KEY_ID')!;
    const teamId   = Deno.env.get('APNS_TEAM_ID')!;
    const bundleId = Deno.env.get('APNS_BUNDLE_ID')!;
    const p8Pem    = Deno.env.get('APNS_PRIVATE_KEY')!;

    if (!keyId || !teamId || !bundleId || !p8Pem) {
      return Response.json({ error: 'APNs env vars not configured' }, { status: 500, headers: cors });
    }

    const jwt = await buildApnsJwt(keyId, teamId, p8Pem);

    const apnsPayload = {
      aps: { alert: { title, body: msgBody }, sound: 'default', badge: 1 },
      ...(data ?? {}),
    };

    const apnsRes = await fetch(
      `https://api.push.apple.com/3/device/${deviceToken}`,
      {
        method: 'POST',
        headers: {
          'authorization': `bearer ${jwt}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'content-type': 'application/json',
        },
        body: JSON.stringify(apnsPayload),
      },
    );

    // 410 = token permanently invalid — clean up
    if (apnsRes.status === 410) {
      await supabase.from('user_devices').delete().eq('id', deviceRowId);
      return Response.json({ sent: false, reason: 'token_expired_deleted' }, { headers: cors });
    }

    // 400 with BadDeviceToken — also clean up
    if (apnsRes.status === 400) {
      const apnsBody = await apnsRes.json().catch(() => ({}));
      if (apnsBody?.reason === 'BadDeviceToken') {
        await supabase.from('user_devices').delete().eq('id', deviceRowId);
        return Response.json({ sent: false, reason: 'bad_device_token_deleted' }, { headers: cors });
      }
      return Response.json({ sent: false, error: apnsBody }, { status: 400, headers: cors });
    }

    if (apnsRes.status !== 200) {
      const errBody = await apnsRes.text().catch(() => '');
      return Response.json({ sent: false, error: errBody, apns_status: apnsRes.status }, { headers: cors });
    }

    return Response.json({ sent: true }, { headers: cors });

  } catch (err) {
    console.error('[send_push] error:', err);
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});

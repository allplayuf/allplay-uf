/**
 * Generic Push Notification Sender
 * 
 * Sends FCM push notifications to specific users.
 * Expects payload: { user_ids: string[], title: string, body: string, data?: object }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Firebase Admin SDK - uses service account from environment
async function getAccessToken() {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret not set');
  }

  const sa = JSON.parse(serviceAccountJson);
  
  // Create JWT for Google OAuth2
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const signInput = `${header}.${claimSet}`;
  
  // Import the private key
  const pemContent = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signInput)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${header}.${claimSet}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Failed to get Firebase access token: ' + JSON.stringify(tokenData));
  }
  
  return { accessToken: tokenData.access_token, projectId: sa.project_id };
}

async function sendFCM(accessToken, projectId, fcmToken, title, body, data = {}) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title, body },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ),
          webpush: {
            notification: {
              icon: '/icons/allplay-icon-192.png',
              badge: '/icons/allplay-badge-72.png'
            }
          }
        }
      })
    }
  );

  const result = await res.json();
  if (!res.ok) {
    console.error('FCM send failed:', result);
  }
  return { ok: res.ok, result };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_ids, title, body, data } = await req.json();

    if (!user_ids?.length || !title || !body) {
      return Response.json({ error: 'Missing required fields: user_ids, title, body' }, { status: 400 });
    }

    // Get FCM tokens for target users from Supabase
    const supabaseUrl = Deno.env.get('https://vqfjjokqmykqawjlgevj.supabase.co') || 'https://vqfjjokqmykqawjlgevj.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    // Fetch tokens in batches
    const tokenRes = await fetch(
      `${supabaseUrl}/rest/v1/push_tokens?user_id=in.(${user_ids.join(',')})&select=fcm_token,user_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const tokens = await tokenRes.json();
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return Response.json({ sent: 0, message: 'No push tokens found for users' });
    }

    // Get Firebase access token
    const { accessToken, projectId } = await getAccessToken();

    // Send to all tokens
    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const { fcm_token } of tokens) {
      const result = await sendFCM(accessToken, projectId, fcm_token, title, body, data || {});
      if (result.ok) {
        sent++;
      } else {
        failed++;
        errors.push(result.result);
      }
    }

    return Response.json({ sent, failed, total_tokens: tokens.length });
  } catch (error) {
    console.error('sendPushNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
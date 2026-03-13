/**
 * Match Notification Triggers
 * 
 * Supports two call modes:
 * 1. Frontend: { type: string, match_id: string, user_ids?: string[] }
 * 2. Entity automation: { event: { type, entity_name, entity_id }, data: {...}, old_data: {...} }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';

const EVENT_CONFIG = {
  new_match:       { emoji: '⚽', title: 'Ny match!',           template: (m, v) => `"${m.title}" på ${v}, ${m.date} kl ${m.time}` },
  match_updated:   { emoji: '📝', title: 'Match uppdaterad',    template: (m, v) => `"${m.title}" på ${v} har uppdaterats` },
  player_joined:   { emoji: '👋', title: 'Ny spelare!',         template: (m, v) => `En spelare har gått med i "${m.title}"` },
  player_left:     { emoji: '🚶', title: 'Spelare lämnade',     template: (m, v) => `En spelare har lämnat "${m.title}"` },
  match_cancelled: { emoji: '❌', title: 'Match inställd',      template: (m, v) => `"${m.title}" på ${v} har ställts in` },
  match_reminder:  { emoji: '⏰', title: 'Matchpåminnelse',     template: (m, v) => `"${m.title}" börjar snart! ${m.date} kl ${m.time} på ${v}` },
  match_full:      { emoji: '🎉', title: 'Matchen full!',       template: (m, v) => `"${m.title}" på ${v} är nu full` },
  invitation:      { emoji: '⚽', title: 'Matchinbjudan!',      template: (m, v) => `Du har blivit inbjuden till "${m.title}" på ${v}, ${m.date} kl ${m.time}` },
  nearby:          { emoji: '📍', title: 'Match nära dig!',     template: (m, v) => `"${m.title}" spelas på ${v}, ${m.date} kl ${m.time}. Häng med!` },
};

// === Inline FCM sending (no cross-function calls needed) ===

function toBase64Url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getFirebaseAccessToken() {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT secret not set');

  const sa = JSON.parse(serviceAccountJson);
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = toBase64Url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const signInput = `${header}.${claimSet}`;
  const pemContent = sa.private_key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signInput));
  const sig = toBase64Url(String.fromCharCode(...new Uint8Array(signature)));

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${claimSet}.${sig}`
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Failed to get Firebase access token');
  return { accessToken: tokenData.access_token, projectId: sa.project_id };
}

async function sendPushToUsers(userIds, title, body, data) {
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  const dbHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  // Fetch tokens
  const tokenRes = await fetch(
    `${SUPABASE_URL}/rest/v1/push_tokens?user_id=in.(${userIds.join(',')})&select=fcm_token,user_id`,
    { headers: dbHeaders }
  );

  if (!tokenRes.ok) {
    console.error('Failed to fetch push tokens:', tokenRes.status);
    return { sent: 0, error: 'Failed to fetch tokens' };
  }

  const tokens = await tokenRes.json();
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.log(`[sendPush] No tokens for ${userIds.length} users`);
    return { sent: 0, message: 'No push tokens found' };
  }

  const { accessToken, projectId } = await getFirebaseAccessToken();
  let sent = 0;
  let failed = 0;
  const staleTokens = [];

  for (const { fcm_token } of tokens) {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: fcm_token,
          notification: { title, body },
          data: Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)])),
          webpush: { notification: { icon: '/icons/allplay-icon-192.png' } }
        }
      })
    });

    if (res.ok) {
      sent++;
    } else {
      failed++;
      const err = await res.json().catch(() => ({}));
      if (err?.error?.code === 404 || err?.error?.details?.[0]?.errorCode === 'UNREGISTERED') {
        staleTokens.push(fcm_token);
      }
    }
  }

  // Cleanup stale tokens
  for (const token of staleTokens) {
    await fetch(`${SUPABASE_URL}/rest/v1/push_tokens?fcm_token=eq.${encodeURIComponent(token)}`, {
      method: 'DELETE', headers: dbHeaders
    }).catch(() => {});
  }

  console.log(`[sendPush] Sent: ${sent}, Failed: ${failed}, Stale: ${staleTokens.length}`);
  return { sent, failed, stale_cleaned: staleTokens.length };
}

// === Main handler ===

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    let eventType, matchId, providedUserIds, triggerUserId;

    if (payload.event?.entity_name) {
      const { event, data, old_data } = payload;
      matchId = event.entity_id || data?.id;
      triggerUserId = data?.organizer_id || data?.created_by;

      if (event.type === 'create') {
        eventType = 'new_match';
      } else if (event.type === 'update') {
        if (data?.status === 'cancelled' && old_data?.status !== 'cancelled') {
          eventType = 'match_cancelled';
        } else if (data?.current_players > (old_data?.current_players || 0)) {
          eventType = 'player_joined';
        } else if (data?.current_players < (old_data?.current_players || 0)) {
          eventType = 'player_left';
        } else if (data?.max_players && data?.current_players >= data?.max_players) {
          eventType = 'match_full';
        } else {
          eventType = 'match_updated';
        }
      } else {
        return Response.json({ ok: true, skipped: true, reason: 'delete event' });
      }
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      triggerUserId = user.id;
      eventType = payload.type || payload.event_type;
      matchId = payload.match_id;
      providedUserIds = payload.user_ids;
    }

    if (!eventType || !matchId) {
      return Response.json({ error: 'Missing required: type/event_type, match_id' }, { status: 400 });
    }

    const config = EVENT_CONFIG[eventType];
    if (!config) {
      return Response.json({ error: `Unknown event type: ${eventType}` }, { status: 400 });
    }

    // Fetch match — try SDK first, fall back to automation payload
    let match;
    try {
      match = await base44.asServiceRole.entities.Match.get(matchId);
    } catch (e) {
      console.warn('SDK match fetch failed, using payload data:', e.message);
      if (payload.data?.title) match = payload.data;
    }
    if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });

    // Fetch venue name
    let venueName = 'Okänd plats';
    if (match.venue_id) {
      try {
        const venue = await base44.asServiceRole.entities.Venue.get(match.venue_id);
        if (venue?.name) venueName = venue.name;
      } catch (e) { /* ok */ }
    }

    // Determine target users
    let targetUserIds = providedUserIds || [];
    if (targetUserIds.length === 0) {
      try {
        const participants = await base44.asServiceRole.entities.MatchParticipant.filter({ match_id: matchId });
        targetUserIds = (participants || [])
          .filter(p => p.status === 'registered' || p.status === 'confirmed')
          .map(p => p.user_id)
          .filter(id => id && id !== triggerUserId);
      } catch (e) {
        console.warn('Failed to fetch participants:', e.message);
      }
    }

    if (targetUserIds.length === 0) {
      return Response.json({ ok: true, sent: 0, message: 'No target users' });
    }

    const title = `${config.emoji} ${config.title}`;
    const body = config.template(match, venueName);
    const notifData = { match_id: matchId, click_action: `/MatchDetail?id=${matchId}` };

    // Send push notifications directly (no cross-function invoke needed)
    const pushResult = await sendPushToUsers(targetUserIds, title, body, notifData);

    console.log(`[notifyMatchUpdate] ${eventType} for match ${matchId} → ${targetUserIds.length} users, push:`, JSON.stringify(pushResult));

    return Response.json({
      ok: true,
      event_type: eventType,
      match_id: matchId,
      target_users: targetUserIds.length,
      push_result: pushResult
    });
  } catch (error) {
    console.error('notifyMatchUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
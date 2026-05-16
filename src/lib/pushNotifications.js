/**
 * Push Notifications — iOS via Capacitor (native APNs).
 *
 * Web has NO push (we shipped the Firebase web path and removed it; the app
 * targets iOS as primary native client). All web users just see in-app toasts
 * from the existing sonner system.
 *
 * Flow on iOS:
 *   1. Check / request permission
 *   2. Register with APNs — receives a device token
 *   3. Upsert token to `user_devices` (Supabase REST, RLS protected)
 *   4. Listen for foreground notifications → show in-app toast
 *   5. Listen for notification taps → deep-link via window.location
 *
 * Notification `data` payload contract (set on the server):
 *   { type: 'match_soon' | 'match_invite' | 'match_nearby' | 'friend_request'
 *          | 'team_invite' | 'match_update' | 'generic',
 *     match_id?, team_id?, user_id?, url? }
 *
 * If `url` is set it wins. Otherwise we derive the route from `type` + id.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';
import { sessionStore, waitForAuth } from '@/components/supabase/client';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

export function isPushSupported() {
  return Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android';
}

export async function getPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  try {
    const { receive } = await PushNotifications.checkPermissions();
    return receive; // 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
  } catch {
    return 'unsupported';
  }
}

/**
 * Resolve a deep-link route from a notification's data payload.
 * Pure function — exported so foreground handlers can use it for the
 * toast's "Open" action without duplicating the routing logic.
 */
export function resolveNotificationRoute(data = {}) {
  if (typeof data.url === 'string' && data.url.startsWith('/')) return data.url;

  const t = data.type;
  if (isUuid(data.match_id) && (t === 'match_soon' || t === 'match_invite' || t === 'match_nearby' || t === 'match_update' || !t)) {
    return `/matchdetail?id=${data.match_id}`;
  }
  if (isUuid(data.team_id) && (t === 'team_invite' || t === 'team_update')) {
    return `/teamoverview?id=${data.team_id}`;
  }
  if (t === 'friend_request' || (isUuid(data.user_id) && t === 'profile')) {
    return `/community?tab=friends`;
  }
  return null;
}

async function upsertDeviceToken(userId, token) {
  await waitForAuth();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${sessionStore.accessToken}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: userId,
      device_token: token,
      platform: Capacitor.getPlatform(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    console.error('[Push] Token upsert failed:', res.status, await res.text().catch(() => ''));
  }
}

let _listenersAttached = false;
let _foregroundHandler = null;

/**
 * Attach push listeners exactly once. Re-runs of initPushNotifications
 * just reuse them (idempotent).
 */
function attachListeners(userId, options) {
  const onForegroundReceived = options && options.onForegroundReceived;
  if (_listenersAttached) {
    _foregroundHandler = onForegroundReceived || _foregroundHandler;
    return;
  }
  _listenersAttached = true;
  _foregroundHandler = onForegroundReceived;

  PushNotifications.addListener('registration', (token) => {
    upsertDeviceToken(userId, token.value).catch((err) =>
      console.error('[Push] upsert error:', err)
    );
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('[Push] APNs registration error:', err);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // App is in foreground — iOS won't show a system banner automatically.
    // Surface it in-app via the provided handler (typically a sonner toast).
    if (_foregroundHandler) {
      try {
        _foregroundHandler(notification);
      } catch (err) {
        console.error('[Push] foreground handler threw:', err);
      }
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const data = event.notification?.data || {};
    const route = resolveNotificationRoute(data);
    if (route) {
      // Use location.assign so it works no matter where in the SPA we are.
      window.location.assign(route);
    }
  });
}

export async function initPushNotifications(userId, options = {}) {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  try {
    let { receive } = await PushNotifications.checkPermissions();
    if (receive === 'prompt' || receive === 'prompt-with-rationale') {
      const requested = await PushNotifications.requestPermissions();
      receive = requested.receive;
    }
    if (receive !== 'granted') return { ok: false, reason: receive };

    attachListeners(userId, options);
    await PushNotifications.register();
    return { ok: true };
  } catch (err) {
    console.error('[Push] init failed:', err);
    return { ok: false, reason: 'error', error: err };
  }
}

/** Force the OS permission prompt, returning the resulting status. */
export async function requestPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  const { receive } = await PushNotifications.requestPermissions();
  return receive;
}

/**
 * Best-effort "disable". iOS has no programmatic revoke — we just stop
 * upserting the token. The actual on/off lives in iOS Settings → AllPlay.
 * We also delete the token row server-side so we don't keep sending.
 */
export async function disablePush(userId) {
  try {
    await waitForAuth();
    await fetch(
      `${SUPABASE_URL}/rest/v1/user_devices?user_id=eq.${encodeURIComponent(userId)}&platform=eq.${Capacitor.getPlatform()}`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${sessionStore.accessToken}`,
        },
      }
    );
  } catch (err) {
    console.error('[Push] disable failed:', err);
  }
}

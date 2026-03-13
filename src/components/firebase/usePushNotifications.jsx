import { useState, useEffect, useCallback } from 'react';
import { getFirebaseMessaging, VAPID_KEY } from './firebaseConfig';
import { useSupabaseAuth } from '@/components/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';
import { sessionStore, waitForAuth } from '@/components/supabase/client';

const PUSH_PERMISSION_KEY = 'allplay_push_enabled';

function getPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'web';
}

async function upsertToken(userId, fcmToken) {
  console.log('[Push] Upserting FCM token to Supabase for user:', userId);
  await waitForAuth();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/push_tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${sessionStore.accessToken}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      user_id: userId,
      fcm_token: fcmToken,
      platform: getPlatform(),
      updated_at: new Date().toISOString()
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[Push] Upsert failed:', res.status, text);
  } else {
    console.log('[Push] Token upserted successfully');
  }
}

export function usePushNotifications() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isEnabled, setIsEnabled] = useState(() => {
    try { return localStorage.getItem(PUSH_PERMISSION_KEY) === 'true'; } catch { return false; }
  });

  const requestPermissionAndToken = useCallback(async () => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('[Push] Firebase Messaging not available');
      return null;
    }

    console.log('[Push] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    setPermissionState(permission);

    if (permission !== 'granted') {
      console.log('[Push] Permission denied, aborting token fetch');
      return null;
    }

    console.log('[Push] Getting FCM token with VAPID key...');
    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('[Push] FCM token received:', token ? `${token.slice(0, 20)}...` : 'null');

    if (token && user?.id) {
      await upsertToken(user.id, token);
    }

    localStorage.setItem(PUSH_PERMISSION_KEY, 'true');
    setIsEnabled(true);
    return token;
  }, [user?.id]);

  const disable = useCallback(() => {
    localStorage.setItem(PUSH_PERMISSION_KEY, 'false');
    setIsEnabled(false);
    console.log('[Push] Notifications disabled by user');
  }, []);

  // Auto-register on mount if already enabled + authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isEnabled) return;
    if (permissionState !== 'granted') return;

    console.log('[Push] Auto-refreshing FCM token for authenticated user');
    (async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      const { getToken } = await import('firebase/messaging');
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) upsertToken(user.id, token);
    })().catch(err => console.error('[Push] Auto-refresh failed:', err));
  }, [isAuthenticated, user?.id, isEnabled, permissionState]);

  return {
    isEnabled,
    permissionState,
    requestPermissionAndToken,
    disable,
    isSupported: typeof Notification !== 'undefined'
  };
}
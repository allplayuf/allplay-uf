import { useEffect, useCallback, useRef } from 'react';
import { messaging, getToken, onMessage } from './config';
import { sessionStore } from '@/components/supabase/client';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';
import { toast } from 'sonner';

const VAPID_KEY = 'BEhDB-55Fu25URHYBsldVjalW_7lPb-8s5fhQstpiLzojjnOI2t_Jp_kPVIskNz_IdvNBVf5HkNNX8P2BNF8iGQ';

export function usePushNotifications() {
  const unsubscribeRef = useRef(null);

  const registerPush = useCallback(async () => {
    console.log('[Push] registerPush called, messaging:', !!messaging);

    if (!messaging) {
      console.warn('[Push] Firebase Messaging not supported in this browser');
      return null;
    }

    console.log('[Push] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);

    if (permission !== 'granted') {
      console.log('[Push] User denied notifications');
      return null;
    }

    console.log('[Push] Calling getToken with VAPID key...');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) {
      console.warn('[Push] getToken returned null/empty');
      return null;
    }

    console.log('[Push] FCM token received:', token.substring(0, 20) + '...');

    // Save token to Supabase push_tokens table
    const user = sessionStore.user;
    console.log('[Push] Current user:', user?.id);

    if (user) {
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${sessionStore.accessToken}`,
        'Prefer': 'resolution=merge-duplicates'
      };

      console.log('[Push] Saving token to Supabase push_tokens...');
      const res = await fetch(`${SUPABASE_URL}/rest/v1/push_tokens`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: user.id,
          fcm_token: token,
          platform: 'web',
          updated_at: new Date().toISOString(),
        })
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[Push] Failed to save token:', res.status, body);
      } else {
        console.log('[Push] Token saved to Supabase successfully');
      }
    } else {
      console.warn('[Push] No user in sessionStore, skipping token save');
    }

    return token;
  }, []);

  useEffect(() => {
    if (!messaging) return;

    unsubscribeRef.current = onMessage(messaging, (payload) => {
      console.log('[Push] Foreground notification received:', payload);

      const { title, body } = payload.notification || {};
      const data = payload.data || {};

      toast(title || 'Allplay', {
        description: body || '',
        action: data.match_id
          ? {
              label: 'Visa match',
              onClick: () => {
                window.location.href = `/MatchDetail?id=${data.match_id}`;
              },
            }
          : undefined,
        duration: 8000,
      });
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const unregisterPush = useCallback(async () => {
    try {
      const user = sessionStore.user;
      if (user) {
        const headers = {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${sessionStore.accessToken}`,
        };

        await fetch(
          `${SUPABASE_URL}/rest/v1/push_tokens?user_id=eq.${user.id}&platform=eq.web`,
          { method: 'DELETE', headers }
        );
      }
    } catch (error) {
      console.error('[Push] Error unregistering:', error);
    }
  }, []);

  return { registerPush, unregisterPush };
}
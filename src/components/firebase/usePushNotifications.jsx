import { useEffect, useCallback, useRef } from 'react';
import { messaging, getToken, onMessage } from './config';
import { sessionStore } from '@/components/supabase/client';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';
import { toast } from 'sonner';

// IMPORTANT: Replace with your real VAPID key from Firebase Console → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BEhDB-55Fu25URHYBsldVjalW_7lPb-8s5fhQstpiLzojjnOI2t_Jp_kPVIskNz_IdvNBVf5HkNNX8P2BNF8iGQ';

export function usePushNotifications() {
  const unsubscribeRef = useRef(null);

  const registerPush = useCallback(async () => {
    if (!messaging) {
      console.warn('Push notifications stöds inte i denna webbläsare');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Användaren nekade notiser');
        return null;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        console.warn('Kunde inte hämta FCM-token');
        return null;
      }

      console.log('FCM Token mottagen:', token.substring(0, 20) + '...');

      // Save token to Supabase push_tokens table
      const user = sessionStore.user;
      if (user) {
        const headers = {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${sessionStore.accessToken}`,
          'Prefer': 'resolution=merge-duplicates'
        };

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
          console.error('Kunde inte spara push token:', res.status);
        } else {
          console.log('Push token sparad i Supabase');
        }
      }

      return token;
    } catch (error) {
      console.error('Fel vid push-registrering:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!messaging) return;

    unsubscribeRef.current = onMessage(messaging, (payload) => {
      console.log('Förgrunds-notis mottagen:', payload);

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
      console.error('Fel vid avregistrering av push:', error);
    }
  }, []);

  return { registerPush, unregisterPush };
}
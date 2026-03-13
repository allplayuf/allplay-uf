import { useEffect, useCallback, useRef } from 'react';
import { messaging, getToken, onMessage } from '@/components/firebase/config';
import { sessionStore } from '@/components/supabase/client';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';
import { toast } from 'sonner';

const VAPID_KEY = 'BEhDB-55Fu25URHYBsldVjalW_7lPb-8s5fhQstpiLzojjnOI2t_Jp_kPVIskNz_IdvNBVf5HkNNX8P2BNF8iGQ';

export function usePushNotifications() {
  const unsubscribeRef = useRef(null);

  const registerPush = useCallback(async () => {
    console.log('[PUSH] registerPush() anropad');

    if (!messaging) {
      console.warn('[PUSH] messaging är null — Firebase Messaging stöds inte i denna webbläsare');
      return null;
    }

    try {
      console.log('[PUSH] Begär notification permission...');
      const permission = await Notification.requestPermission();
      console.log('[PUSH] Permission resultat:', permission);

      if (permission !== 'granted') {
        console.log('[PUSH] Användaren nekade notiser');
        return null;
      }

      // Hämta FCM token — INGEN manuell service worker registration
      // Firebase SDK hanterar sin egen service worker automatiskt
      console.log('[PUSH] Hämtar FCM token...');
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (!token) {
        console.warn('[PUSH] getToken returnerade null/undefined');
        return null;
      }

      console.log('[PUSH] FCM Token mottagen:', token.substring(0, 30) + '...');

      // Spara token i Supabase via REST
      const user = sessionStore.user;
      if (!user) {
        console.warn('[PUSH] Ingen inloggad användare — kan inte spara token');
        return token;
      }

      console.log('[PUSH] Sparar token för user:', user.id);

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
        console.error('[PUSH] Kunde inte spara token i Supabase:', res.status, await res.text().catch(() => ''));
      } else {
        console.log('[PUSH] Token sparad i push_tokens!');
      }

      return token;
    } catch (error) {
      console.error('[PUSH] Fel vid registrering:', error);
      return null;
    }
  }, []);

  // Lyssna på förgrunds-notiser
  useEffect(() => {
    if (!messaging) return;

    console.log('[PUSH] Sätter upp onMessage listener...');

    unsubscribeRef.current = onMessage(messaging, (payload) => {
      console.log('[PUSH] Förgrunds-notis mottagen:', payload);

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
        console.log('[PUSH] Token borttagen');
      }
    } catch (error) {
      console.error('[PUSH] Fel vid avregistrering:', error);
    }
  }, []);

  return { registerPush, unregisterPush };
}
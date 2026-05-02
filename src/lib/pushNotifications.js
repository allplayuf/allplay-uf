import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';
import { sessionStore, waitForAuth } from '@/components/supabase/client';

export async function initPushNotifications(userId) {
  if (Capacitor.getPlatform() !== 'ios') return;

  try {
    const { receive } = await PushNotifications.checkPermissions();

    let finalStatus = receive;
    if (receive === 'prompt') {
      const result = await PushNotifications.requestPermissions();
      finalStatus = result.receive;
    }

    if (finalStatus !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      try {
        await waitForAuth();
        await fetch(`${SUPABASE_URL}/rest/v1/user_devices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${sessionStore.accessToken}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: userId,
            expo_push_token: token.value,
            platform: 'ios',
            updated_at: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error('[Push] Token upsert failed:', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Foreground notification:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const data = event.notification?.data;
      if (data?.match_id) {
        window.location.href = `/matchdetail?id=${data.match_id}`;
      }
    });
  } catch (err) {
    console.error('[Push] initPushNotifications failed:', err);
  }
}

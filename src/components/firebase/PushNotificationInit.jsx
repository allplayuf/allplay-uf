import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useSupabaseAuth } from '@/components/supabase';
import { initPushNotifications } from '@/lib/pushNotifications';
import { usePushNotifications } from './usePushNotifications';

/**
 * Silent component that initializes push notifications for authenticated users.
 *
 * iOS (Capacitor): calls initPushNotifications() — this requests permission,
 * registers with APNs, and upserts the device token to user_devices.
 *
 * Web (FCM): auto-refreshes FCM token if already granted (via usePushNotifications).
 * To prompt the user for permission, call requestPermissionAndToken() from a UI action
 * (e.g. a push-enable toggle in Profile/Settings).
 */
export default function PushNotificationInit() {
  const { user, isAuthenticated, isLoading } = useSupabaseAuth();
  const { isEnabled } = usePushNotifications();
  const iosInitDone = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) return;

    if (Capacitor.getPlatform() === 'ios') {
      if (iosInitDone.current) return;
      iosInitDone.current = true;
      initPushNotifications(user.id).catch(err =>
        console.error('[PushInit] iOS init failed:', err)
      );
    } else {
      if (isEnabled) {
        console.log('[PushInit] Web push active for authenticated user');
      }
    }
  }, [isAuthenticated, isLoading, user?.id, isEnabled]);

  return null;
}

import { useEffect, useRef } from 'react';
import { useSupabaseAuth } from '@/components/supabase';
import {
  initPushNotifications,
  isPushSupported,
  resolveNotificationRoute,
} from '@/lib/pushNotifications';
import { feedback } from '@/components/ui/feedback-toast';

/**
 * Silent component — initializes Capacitor push notifications for the
 * authenticated user. Web has no push (we ship iOS native only). On web
 * this component renders nothing and skips the init.
 *
 * Foreground notifications are surfaced as in-app toasts because iOS does
 * NOT show a system banner while the app is in the foreground.
 */
export default function PushNotificationInit() {
  const { user, isAuthenticated, isLoading } = useSupabaseAuth();
  const initDone = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) return;
    if (!isPushSupported()) return;
    if (initDone.current) return;
    initDone.current = true;

    initPushNotifications(user.id, {
      onForegroundReceived: (notification) => {
        const title = notification?.title || notification?.notification?.title || 'AllPlay';
        const body = notification?.body || notification?.notification?.body || '';
        const data = notification?.data || notification?.notification?.data || {};
        const route = resolveNotificationRoute(data);

        feedback.info(title, {
          description: body || undefined,
          duration: 5000,
          action: route
            ? {
                label: 'Öppna',
                onClick: () => window.location.assign(route),
              }
            : undefined,
        });
      },
    }).catch((err) => console.error('[PushInit] failed:', err));
  }, [isAuthenticated, isLoading, user?.id]);

  return null;
}

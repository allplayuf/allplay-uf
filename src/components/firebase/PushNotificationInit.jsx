import { useEffect } from 'react';
import { useSupabaseAuth } from '@/components/supabase';
import { usePushNotifications } from './usePushNotifications';

/**
 * Silent component that auto-initializes push notifications for authenticated users.
 * Drop this into the layout — it renders nothing.
 */
export default function PushNotificationInit() {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const { isEnabled, isSupported } = usePushNotifications();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!isSupported) {
      console.log('[PushInit] Push messaging not supported in this browser');
      return;
    }
    if (isEnabled) {
      console.log('[PushInit] Push notifications active for authenticated user');
    } else {
      console.log('[PushInit] Push notifications not enabled yet — user can enable in settings');
    }
  }, [isAuthenticated, isLoading, isEnabled, isSupported]);

  return null;
}
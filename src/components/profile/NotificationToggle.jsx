import { useEffect, useState, useCallback } from 'react';
import { Bell, BellOff, AlertCircle, Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '@/components/supabase';
import {
  isPushSupported,
  getPushPermission,
  initPushNotifications,
  disablePush,
  requestPushPermission,
} from '@/lib/pushNotifications';
import { feedback } from '@/components/ui/feedback-toast';

/**
 * Push-notification toggle. Renders only on native (iOS/Android).
 * On web it returns null — no web push.
 */
export default function NotificationToggle() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [permission, setPermission] = useState('unsupported');
  const [loading, setLoading] = useState(false);

  const refreshPermission = useCallback(async () => {
    const p = await getPushPermission();
    setPermission(p);
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  if (!isPushSupported()) return null;

  const enabled = permission === 'granted';
  const blocked = permission === 'denied';

  const handleToggle = async () => {
    if (!isAuthenticated || !user?.id) {
      feedback.error('Logga in för att aktivera notiser.');
      return;
    }

    setLoading(true);
    try {
      if (enabled) {
        await disablePush(user.id);
        feedback.success('Notiser inaktiverade på enheten.');
      } else if (blocked) {
        feedback.error('Notiser är blockerade — aktivera dem i iOS Inställningar → AllPlay.');
      } else {
        const status = await requestPushPermission();
        if (status === 'granted') {
          const res = await initPushNotifications(user.id);
          if (res.ok) {
            feedback.success('Notiser aktiverade!');
          } else {
            feedback.error('Kunde inte aktivera notiser. Försök igen.');
          }
        } else {
          feedback.error('Du nekade notiser.');
        }
      }
    } finally {
      await refreshPermission();
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`w-full flex items-start gap-3 p-3 rounded-xl bg-[#0F1513] ring-1 text-left transition-colors ${
        loading ? 'ring-[#1E2724] opacity-70' : 'ring-[#1E2724] hover:bg-[#121715] hover:ring-[#243029]'
      }`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: enabled ? 'rgba(43,168,74,0.16)' : 'rgba(255,255,255,0.04)',
          boxShadow: enabled ? 'inset 0 0 0 1px rgba(43,168,74,0.36)' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-[#9EAAA4] animate-spin" />
        ) : enabled ? (
          <Bell className="w-[17px] h-[17px] text-[#2BA84A]" strokeWidth={2.4} />
        ) : (
          <BellOff className="w-[17px] h-[17px] text-[#9EAAA4]" strokeWidth={2.4} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold text-[#F4F7F5] leading-tight">Push-notiser</div>
        <div className="text-[11.5px] text-[#9EAAA4] leading-snug mt-0.5">
          {enabled
            ? 'Matchpåminnelser, inbjudningar och uppdateringar'
            : blocked
            ? 'Aktivera i iOS Inställningar för att få notiser'
            : 'Slå på för att aldrig missa en match'}
        </div>
        {blocked && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-[#FDBA74]">
            <AlertCircle className="w-3 h-3" strokeWidth={2.6} />
            Blockerat i systeminställningar
          </div>
        )}
      </div>

      <div
        className={`w-11 h-6 rounded-full p-0.5 transition-colors flex-shrink-0 ${
          enabled ? 'bg-[#2BA84A]' : 'bg-[#1E2724]'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}

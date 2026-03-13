import React, { useState } from 'react';
import { usePushNotifications } from './usePushNotifications';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';

export default function NotificationToggle() {
  const { registerPush, unregisterPush } = usePushNotifications();
  const [enabled, setEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (enabled) {
        await unregisterPush();
        setEnabled(false);
        toast.info('Notiser avaktiverade');
      } else {
        const token = await registerPush();
        if (token) {
          setEnabled(true);
          toast.success('Notiser aktiverade!');
        } else {
          toast.error('Kunde inte aktivera notiser. Kontrollera webbläsarinställningar.');
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Något gick fel');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-full h-14 px-4 flex items-center justify-between text-[#F4F7F5] bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A] transition-all duration-150"
      style={{ opacity: loading ? 0.6 : 1 }}
    >
      <span className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${enabled ? 'bg-[#2BA84A]/20' : 'bg-[#2BA84A]/10'}`}>
          {enabled ? (
            <Bell className="w-4 h-4 text-[#2BA84A]" />
          ) : (
            <BellOff className="w-4 h-4 text-[#9EAAA4]" />
          )}
        </div>
        <span className="font-semibold text-sm">
          {loading ? 'Laddar...' : enabled ? 'Notiser aktiverade' : 'Aktivera notiser'}
        </span>
      </span>
      <div className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-[#2BA84A]' : 'bg-[#223029]'}`}>
        <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${enabled ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}
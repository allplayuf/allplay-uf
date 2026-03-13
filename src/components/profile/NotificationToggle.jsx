import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/components/firebase/usePushNotifications';

export default function NotificationToggle() {
  const { isEnabled, permissionState, requestPermissionAndToken, disable, isSupported } = usePushNotifications();
  const [loading, setLoading] = React.useState(false);

  if (!isSupported) return null;

  const handleToggle = async () => {
    if (isEnabled) {
      disable();
    } else {
      setLoading(true);
      await requestPermissionAndToken();
      setLoading(false);
    }
  };

  const blocked = permissionState === 'denied';

  return (
    <button
      onClick={handleToggle}
      disabled={loading || blocked}
      className="w-full h-14 px-4 flex items-center justify-between text-[#F4F7F5] bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A] transition-all duration-150 disabled:opacity-50"
    >
      <span className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-[#2BA84A]/10' : 'bg-[#223029]'}`}>
          {isEnabled ? (
            <Bell className="w-4 h-4 text-[#2BA84A]" />
          ) : (
            <BellOff className="w-4 h-4 text-[#9EAAA4]" />
          )}
        </div>
        <div className="text-left">
          <span className="font-semibold text-sm block">
            {loading ? 'Aktiverar...' : 'Push-notiser'}
          </span>
          {blocked && (
            <span className="text-[10px] text-[#F4743B]">Blockerad i webbläsaren</span>
          )}
        </div>
      </span>
      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isEnabled ? 'bg-[#2BA84A]' : 'bg-[#223029]'}`}>
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}
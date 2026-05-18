import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Loader2, Check, AlertCircle, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { checkInMatch } from "@/components/supabase/services/matchesService";
import { getCurrentPosition } from "@/lib/geolocation";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { triggerHaptic } from "@/components/utils/motionTokens";
import { useT } from "@/i18n/LanguageProvider";

/**
 * Smart check-in button.
 * - Opens 1h before match, closes 3h after start.
 * - Verifies geolocation (500m radius enforced by backend).
 * - Shows countdown, retry UI, and clear success state.
 * - Haptic feedback on state transitions.
 */
export default function CheckInButton({ match, isParticipant, onCheckInSuccess }) {
  const { t } = useT();
  const { isGuest } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // Re-render every 30s for countdown
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Reflect pre-existing server check-in on first mount
  useEffect(() => {
    if (match?.my_participation?.checked_in || match?.is_checked_in) {
      setIsCheckedIn(true);
    }
  }, [match?.my_participation?.checked_in, match?.is_checked_in]);

  const timing = useMemo(() => {
    if (!match?.date || !match?.time) return { canCheckIn: false, label: t('common.loading') };
    try {
      const [y, m, d] = match.date.split('-').map(Number);
      const [hh, mm] = match.time.split(':').map(Number);
      const start = new Date(y, m - 1, d, hh, mm);
      const now = new Date();
      const diffMs = start.getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60_000);

      const open = new Date(start.getTime() - 60 * 60 * 1000);
      const close = new Date(start.getTime() + 3 * 60 * 60 * 1000);

      if (now < open) {
        // Before window
        if (diffMin > 60 * 24) {
          const days = Math.floor(diffMin / (60 * 24));
          return { canCheckIn: false, label: t('checkin.opens_days', { n: days }) };
        }
        if (diffMin > 60) {
          const hrs = Math.floor((diffMin - 60) / 60);
          const mins = (diffMin - 60) % 60;
          return { canCheckIn: false, label: t('checkin.opens_hours', { h: hrs, m: mins }) };
        }
        return { canCheckIn: false, label: t('checkin.opens_soon') };
      }
      if (now > close) {
        return { canCheckIn: false, label: t('checkin.closed') };
      }
      // Inside window
      if (diffMin > 0) {
        return { canCheckIn: true, label: t('checkin.starts_in', { n: diffMin }) };
      }
      if (diffMin > -10) {
        return { canCheckIn: true, label: t('checkin.started') };
      }
      return { canCheckIn: true, label: t('checkin.in_progress', { n: Math.abs(diffMin) }) };
    } catch {
      return { canCheckIn: false, label: t('checkin.invalid_date') };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.date, match?.time, tick, t]);

  const handleCheckIn = async () => {
    if (isGuest) {
      setError(t('checkin.error_login'));
      return;
    }
    triggerHaptic('light');
    setIsLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      });

      await checkInMatch(match.id, position.coords.latitude, position.coords.longitude);

      triggerHaptic('success');
      setIsCheckedIn(true);
      onCheckInSuccess?.();
    } catch (err) {
      triggerHaptic('error');
      console.error('Check-in error:', err);

      // err.code follows Web Geolocation API; Capacitor also surfaces 'location unavailable'
      const msg = err.message || '';
      const isPermissionDenied = err.code === 1 || /denied|permission|nekad/i.test(msg);
      const isUnavailable = err.code === 2 || /unavailable|position|position unavailable/i.test(msg);
      const isTimeout = err.code === 3 || /timeout/i.test(msg);
      if (isPermissionDenied) {
        setError(t('checkin.error_permission'));
      } else if (isUnavailable) {
        setError(t('checkin.error_position'));
      } else if (isTimeout) {
        setError(t('checkin.error_timeout'));
      } else if (err.status === 403 || /not.*within|500m|för långt|utanför/i.test(msg)) {
        setError(t('checkin.error_distance'));
      } else {
        setError(err.message || t('checkin.error_generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isParticipant) return null;
  if (match?.status !== 'upcoming' && match?.status !== 'ongoing') return null;

  // ─── Checked-in state ───
  if (isCheckedIn) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 18 }}
        className="relative overflow-hidden flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border w-full"
        style={{
          background: 'linear-gradient(135deg, rgba(43,168,74,0.18) 0%, rgba(43,168,74,0.08) 100%)',
          borderColor: 'rgba(43,168,74,0.4)',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2BA84A] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(43,168,74,0.5)]"
        >
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] sm:text-sm font-bold text-[#86EFAC] truncate">{t('checkin.checked_in_title')}</div>
          <div className="text-[11px] sm:text-xs text-[#B6C2BC] truncate">{t('checkin.checked_in_sub')}</div>
        </div>
      </motion.div>
    );
  }

  // ─── Pre-window state ───
  if (!timing.canCheckIn) {
    return (
      <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#18221E] border border-[#223029] rounded-xl w-full">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0F1513] flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#7B8A83]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] sm:text-sm font-semibold text-[#B6C2BC] truncate">{timing.label}</div>
          <div className="text-[11px] sm:text-xs text-[#7B8A83] truncate">{t('checkin.hint')}</div>
        </div>
      </div>
    );
  }

  // ─── Active check-in ───
  return (
    <div className="space-y-2 w-full">
      <Button
        onClick={handleCheckIn}
        disabled={isLoading}
        className="w-full h-11 sm:h-12 rounded-xl gap-2 text-white font-bold text-[14px] sm:text-[15px]"
        style={{
          background: isLoading
            ? '#248232'
            : 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)',
          boxShadow: '0 6px 18px rgba(43,168,74,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            <span className="truncate">{t('checkin.verifying')}</span>
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{t('checkin.btn_label')}</span>
          </>
        )}
      </Button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-red-200 leading-relaxed">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-[#7B8A83] text-center px-2">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{t('checkin.distance_hint', { label: timing.label })}</span>
      </div>
    </div>
  );
}
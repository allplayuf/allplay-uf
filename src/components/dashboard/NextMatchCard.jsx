import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Share2, ArrowRight, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { getUsersByIds } from "@/components/supabase/services";
import ShareMatchModal from "./ShareMatchModal";
import AvatarImage from "@/components/ui/avatar-image";
import { useT } from "@/i18n/LanguageProvider";

/**
 * Next-match card for the dashboard sidebar.
 * 
 * Design: matches "Lär känna AllPlay" — horizontal stage image + content panel on sm+,
 * stacked on mobile. Uses robust date parsing so time always renders correctly
 * regardless of whether the match row has `date + time`, `starts_at`, or both.
 */
export default function NextMatchCard({ match, venue, participants = [] }) {
  const { t } = useT();
  const [showShareModal, setShowShareModal] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // ── Robust datetime parsing ───────────────────────────────────
  const startDate = useMemo(() => {
    if (!match) return null;
    // Prefer starts_at (ISO, timezone-safe)
    if (match.starts_at) {
      const d = new Date(match.starts_at);
      if (!isNaN(d.getTime())) return d;
    }
    if (match.date && match.time) {
      // Parse as local time (user's timezone)
      const d = new Date(`${match.date}T${match.time}`);
      if (!isNaN(d.getTime())) return d;
    }
    if (match.date) {
      const d = new Date(match.date);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }, [match]);

  // Tick every 30s so the countdown stays fresh without wasting renders
  useEffect(() => {
    if (!startDate) return;
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, [startDate]);

  const timeLeft = useMemo(() => {
    if (!startDate) return { days: 0, hours: 0, minutes: 0, started: true };
    const diff = startDate.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, started: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      started: false,
    };
  }, [startDate, now]);

  const participantIds = participants.slice(0, 5).map(p => p.user_id).filter(Boolean);
  const { data: participantUsers = [] } = useQuery({
    queryKey: ['nextMatchParticipants', ...participantIds.sort()],
    queryFn: () => getUsersByIds(participantIds),
    enabled: participantIds.length > 0,
    staleTime: 60_000,
  });

  // Empty state
  if (!match) {
    return (
      <div className="relative overflow-hidden rounded-[22px] border border-[#223029] bg-[#121715] p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#2BA84A]/10 ring-1 ring-[#2BA84A]/20 flex items-center justify-center">
          <Calendar className="w-7 h-7 text-[#2BA84A]" strokeWidth={2.2} />
        </div>
        <p className="text-sm font-semibold text-[#B6C2BC] mb-3">{t('next_match.empty')}</p>
        <Link to={createPageUrl("Matches")}>
          <button className="h-10 px-5 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl text-sm font-semibold transition-colors">
            {t('next_match.find')}
          </button>
        </Link>
      </div>
    );
  }

  // ── Formatters ─────────────────────────────────────────────────
  const formatRelativeDay = () => {
    if (!startDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const matchDay = new Date(startDate);
    matchDay.setHours(0, 0, 0, 0);
    if (matchDay.getTime() === today.getTime()) return t('common.today');
    if (matchDay.getTime() === tomorrow.getTime()) return t('common.tomorrow');
    return startDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const formatTime = () => {
    if (!startDate) return '';
    return startDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const progressPct = match.is_spontaneous
    ? 0
    : Math.min(100, (participants.length / (match.max_players || 1)) * 100);
  const spotsLeft = match.is_spontaneous ? null : (match.max_players - participants.length);

  // Countdown display: "3d 5h", "4h 20m", "45m", or starting now
  const countdownLabel = (() => {
    if (timeLeft.started) return t('next_match.starting_now');
    if (timeLeft.days > 0) return `${timeLeft.days}d ${timeLeft.hours}h`;
    if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    return `${timeLeft.minutes}m`;
  })();

  const isUrgent = timeLeft.started || (timeLeft.days === 0 && timeLeft.hours < 2);

  return (
    <>
      <AnimatePresence>
        {showShareModal && (
          <ShareMatchModal match={match} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
      <div
        className="relative overflow-hidden rounded-[22px] border border-white/[0.07]"
        style={{
          background: 'linear-gradient(135deg, #151B18 0%, #111613 55%, #0C100E 100%)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full blur-3xl"
          style={{ background: isUrgent ? 'rgba(244,116,59,0.22)' : 'rgba(43,168,74,0.18)' }} />

        {/* Top hairline */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }}
        />

        <div className="relative z-10 p-4 sm:p-5 lg:p-5">
          {/* Eyebrow + share */}
          <div className="flex items-center justify-between mb-3 sm:mb-3.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] ring-1 ring-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-[#F4743B]' : 'bg-[#34C257]'} animate-pulse`} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/85">
                {t('next_match.eyebrow')}
              </span>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] ring-1 ring-white/10 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label={t('next_match.share')}
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C2CEC8]" strokeWidth={2.2} />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-[16px] sm:text-[18px] lg:text-[19px] font-black text-white tracking-tight leading-tight mb-1 line-clamp-2">
            {match.title}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-[12px] text-[#B6C2BC] mb-3.5 sm:mb-4">
            <MapPin className="w-3.5 h-3.5 text-[#34C257] flex-shrink-0" />
            <span className="truncate">{venue?.name || t('match.unknown_venue')}</span>
          </div>

          {/* Countdown pill + time — always 2 cols, scales with container */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3.5 sm:mb-4">
            <div
              className="rounded-xl p-2.5 sm:p-3 text-left min-w-0"
              style={{
                background: isUrgent
                  ? 'linear-gradient(135deg, rgba(244,116,59,0.14), rgba(244,116,59,0.06))'
                  : 'linear-gradient(135deg, rgba(43,168,74,0.14), rgba(43,168,74,0.05))',
                boxShadow: `inset 0 0 0 1px ${isUrgent ? 'rgba(244,116,59,0.28)' : 'rgba(43,168,74,0.25)'}`,
              }}
            >
              <div className="flex items-center gap-1 mb-1 min-w-0">
                <Zap className={`w-3 h-3 flex-shrink-0 ${isUrgent ? 'text-[#F4743B]' : 'text-[#34C257]'}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8FA097] truncate">
                  {timeLeft.started ? t('next_match.status_label') : t('next_match.starts_in')}
                </span>
              </div>
              <div className={`text-[16px] sm:text-[18px] font-black tabular-nums leading-none truncate ${isUrgent ? 'text-[#FDBA74]' : 'text-[#86EFAC]'}`}>
                {countdownLabel}
              </div>
            </div>

            <div className="rounded-xl p-2.5 sm:p-3 ring-1 ring-white/[0.06] bg-white/[0.02] text-left min-w-0">
              <div className="flex items-center gap-1 mb-1 min-w-0">
                <Clock className="w-3 h-3 text-[#C2CEC8] flex-shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8FA097] truncate">{t('next_match.time_label')}</span>
              </div>
              <div className="text-[12px] sm:text-[13px] font-bold text-white leading-tight capitalize truncate">
                {formatRelativeDay()}
              </div>
              <div className="text-[11px] sm:text-[12px] text-[#B6C2BC] tabular-nums truncate">{formatTime()}</div>
            </div>
          </div>

          {/* Players / progress */}
          {!match.is_spontaneous && match.max_players && (
            <div className="mb-3.5">
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <span className="text-[#9EAAA4] font-medium">{t('next_match.players')}</span>
                <span className="text-[#F4F7F5] font-bold tabular-nums">
                  {participants.length}/{match.max_players}
                </span>
              </div>
              <div className="h-1.5 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${progressPct >= 90 ? 'bg-[#F4743B]' : 'bg-[#2BA84A]'}`}
                />
              </div>
              {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3 && (
                <p className="text-[10px] font-semibold text-[#F4743B] mt-1.5">
                  {t('next_match.spots_left', { n: spotsLeft })}
                </p>
              )}
            </div>
          )}

          {match.is_spontaneous && (
            <div className="flex items-center gap-2 mb-3.5 text-[11px] text-[#FDE3D2]">
              <Users className="w-3.5 h-3.5 text-[#F4743B]" />
              <span className="font-semibold">{t('next_match.registered_spontaneous', { n: participants.length })}</span>
            </div>
          )}

          {/* Avatars */}
          {participants.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-1.5">
                {participants.slice(0, 5).map((p, i) => {
                  const pUser = participantUsers.find(u => u.id === p.user_id);
                  return (
                    <div key={p.id || i} className="ring-2 ring-[#111613] rounded-full">
                      <AvatarImage
                        src={pUser?.avatar_url}
                        name={pUser?.display_name || pUser?.full_name || 'S'}
                        className="w-7 h-7"
                        textClassName="text-[9px]"
                      />
                    </div>
                  );
                })}
              </div>
              {participants.length > 5 && (
                <span className="text-[10px] font-semibold text-[#9EAAA4]">
                  +{participants.length - 5}
                </span>
              )}
            </div>
          )}

          {/* CTA row */}
          <div className="flex gap-2">
            <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-1">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[13px] transition-colors"
                style={{
                  background: 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)',
                  boxShadow: '0 6px 18px rgba(43,168,74,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                {t('next_match.view')}
                <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
              </motion.button>
            </Link>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowShareModal(true)}
              className="h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 text-[#F4F7F5] font-semibold text-[12px] bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.09] transition-colors"
              aria-label={t('next_match.share')}
            >
              <Share2 className="w-4 h-4" strokeWidth={2.3} />
              <span className="hidden sm:inline">{t('next_match.share')}</span>
            </motion.button>
          </div>
        </div>
      </div>
      </motion.div>
    </>
  );
}
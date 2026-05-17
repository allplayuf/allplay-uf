import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Users, ArrowLeft, Share2, Flag, Trophy, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/i18n/LanguageProvider";

const LEVEL_DOT = {
  beginner: "#86EFAC",
  intermediate: "#34C257",
  advanced: "#A78BFA",
  elite: "#FBBF24",
  pro: "#FBBF24",
  mixed: "#C2CEC8",
};

const STATUS_STYLE = {
  upcoming:  { color: "#4169E1", glow: "rgba(65,105,225,0.4)" },
  ongoing:   { color: "#F59E0B", glow: "rgba(245,158,11,0.45)", pulse: true },
  completed: { color: "#6B7280", glow: "rgba(107,114,128,0.3)" },
  cancelled: { color: "#DC2626", glow: "rgba(220,38,38,0.4)" },
};

function useCountdown(targetIso) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return { type: "now", urgent: true };

  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return { type: "mins", n: mins, urgent: mins <= 30 };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { type: "hours", h: hours, m: mins % 60, urgent: false };
  return { type: "days", n: Math.floor(hours / 24), urgent: false };
}

function formatDateNice(date) {
  if (!date) return "";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return date;
  }
}

export default function MatchHeroBanner({ match, venue, participantCount, isOrganizer }) {
  const navigate = useNavigate();
  const { t } = useT();

  const statusStyle = STATUS_STYLE[match.status] || STATUS_STYLE.upcoming;
  const statusLabel = t(`match.status.${match.status}`) || t('match.status.upcoming');
  const levelDot = LEVEL_DOT[match.skill_bracket];
  const levelLabel = match.skill_bracket === 'mixed'
    ? t('match_hero.level_mixed')
    : match.skill_bracket
      ? t(`profile.skill.${match.skill_bracket}`)
      : null;

  const startsAt = match.starts_at || (match.date && match.time ? `${match.date}T${match.time}:00` : null);
  const countdown = useCountdown(startsAt);

  const countdownText = countdown
    ? countdown.type === "now"   ? t('match_hero.starts_now')
    : countdown.type === "mins"  ? t('match_hero.in_mins', { n: countdown.n })
    : countdown.type === "hours" ? t('match_hero.in_hours', { h: countdown.h, m: countdown.m })
    : t('match_hero.in_days', { n: countdown.n })
    : null;

  const fillPct = match.is_spontaneous
    ? 100
    : Math.min(100, Math.round((participantCount / (match.max_players || 1)) * 100));

  return (
    <div className="relative rounded-[28px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0F2917 0%, #1E7A36 50%, #0D1F10 100%)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Pitch lines pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="10" y="20" width="380" height="260" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="45" fill="none" stroke="white" strokeWidth="1.5" />
        <line x1="200" y1="20" x2="200" y2="280" stroke="white" strokeWidth="1.5" />
        <rect x="10" y="90" width="80" height="120" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="310" y="90" width="80" height="120" fill="none" stroke="white" strokeWidth="1.5" />
      </svg>

      {/* Ambient glows */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, #34C257 0%, transparent 70%)" }} />
      <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #F4743B 0%, transparent 70%)" }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)" }} />

      <div className="relative p-5 sm:p-7 lg:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {/* Status pill */}
            <motion.div
              animate={statusStyle.pulse ? { scale: [1, 1.05, 1] } : {}}
              transition={statusStyle.pulse ? { duration: 1.8, repeat: Infinity } : {}}
              className="inline-flex h-8 items-center gap-1.5 px-3 rounded-full backdrop-blur-sm"
              style={{
                background: `${statusStyle.color}30`,
                boxShadow: `0 0 0 1px ${statusStyle.color}60, 0 8px 24px ${statusStyle.glow}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.color }} />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                {statusLabel}
              </span>
            </motion.div>

            {isOrganizer && (
              <div className="inline-flex h-8 items-center gap-1 px-3 rounded-full bg-[#F4743B]/25 ring-1 ring-[#F4743B]/50 backdrop-blur-sm">
                <Flag className="w-3 h-3 text-[#FED7AA]" />
                <span className="text-[11px] font-bold text-[#FED7AA] uppercase">{t('match_hero.organizer')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title + countdown */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {levelDot && levelLabel && (
              <span className="inline-flex h-6 items-center gap-1.5 px-2.5 rounded-full bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: levelDot }} />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{levelLabel}</span>
              </span>
            )}
            <span className="inline-flex h-6 items-center px-2.5 rounded-full bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{match.format}</span>
            </span>
            {match.is_spontaneous && (
              <span className="inline-flex h-6 items-center px-2.5 rounded-full bg-[#F4743B]/30 ring-1 ring-[#F4743B]/50 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-[#FED7AA] uppercase tracking-wider">{t('match_hero.spontaneous')}</span>
              </span>
            )}
          </div>

          <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] font-black text-white tracking-tight mb-3 drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            {match.title}
          </h1>

          {countdown && match.status === "upcoming" && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                countdown.urgent
                  ? "bg-[#F4743B]/25 ring-1 ring-[#F4743B]/50"
                  : "bg-white/10 ring-1 ring-white/20"
              } backdrop-blur-sm`}
            >
              <Clock className={`w-3.5 h-3.5 ${countdown.urgent ? "text-[#FED7AA]" : "text-white"}`} />
              <span className={`text-[12px] font-bold ${countdown.urgent ? "text-[#FED7AA]" : "text-white"}`}>
                {countdownText}
              </span>
            </motion.div>
          )}

          {match.status === "completed" && match.final_score && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm mt-2"
            >
              <Trophy className="w-5 h-5 text-[#FBBF24]" />
              <div>
                <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('match_hero.final_score')}</div>
                <div className="text-2xl font-black text-white tabular-nums">{match.final_score}</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Info chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <InfoChip
            icon={MapPin}
            label={t('match_hero.location')}
            value={venue?.name || t('common.unknown')}
            sub={venue?.city}
          />
          <InfoChip
            icon={Calendar}
            label={t('match_hero.date')}
            value={formatDateNice(match.date)}
          />
          <InfoChip
            icon={Clock}
            label={t('match_hero.time')}
            value={match.time || "—"}
            sub={`${match.duration_minutes || 90} min`}
          />
          <InfoChip
            icon={Users}
            label={match.is_spontaneous ? t('match_hero.registered') : t('match_hero.players')}
            value={match.is_spontaneous ? `${participantCount}` : `${participantCount}/${match.max_players}`}
            progress={match.is_spontaneous ? null : fillPct}
          />
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value, sub, progress }) {
  return (
    <div className="relative p-3 rounded-2xl bg-white/8 ring-1 ring-white/15 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-white/60" />
        <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-[14px] sm:text-[15px] font-bold text-white leading-tight truncate">{value}</div>
      {sub && <div className="text-[11px] text-white/60 truncate mt-0.5">{sub}</div>}
      {progress != null && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 pointer-events-none" />
          <div
            className="absolute left-0 bottom-0 h-1 transition-[width] duration-500 pointer-events-none"
            style={{
              width: `${Math.max(0, Math.min(100, progress))}%`,
              background: progress >= 90 ? "#F4743B" : "#34C257",
            }}
          />
        </>
      )}
    </div>
  );
}

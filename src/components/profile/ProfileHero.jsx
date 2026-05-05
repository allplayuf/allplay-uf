import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Camera,
  MapPin,
  Trophy,
  Award,
  Edit,
  QrCode,
  Settings,
  LogOut,
  MoreVertical,
  Flag,
  Target,
  TrendingUp,
  Shield,
  Crown,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "../utils/motionTokens";
import BlockUserButton from "../user/BlockUserButton";
import RankBadge from "@/components/rank/RankBadge";
import RankProgressBar from "@/components/rank/RankProgressBar";
import { getRankFromMatches } from "@/lib/rankEngine";

/**
 * ProfileHero — mirrors the DashboardHero design language.
 *
 *   Mobile-first spacing (8pt grid):
 *     Outer padding: 20/24 mobile → 28/32 tablet → 40/44 desktop
 *     Vertical rhythm: 20 → 28 → 36 between blocks
 *   Typography: display 26/34/42, meta 12/13
 *   Structure:  [avatar + name/meta] → [stats 3-col] → [actions 2-col]
 *   Background: pitch lines + ambient orb (same signature as Dashboard)
 */

const SKILL_CONFIG = {
  beginner: { label: "Nybörjare", icon: Target, accent: "#6EE7B7" },
  intermediate: { label: "Medel", icon: TrendingUp, accent: "#5EEAD4" },
  advanced: { label: "Avancerad", icon: Shield, accent: "#C4B5FD" },
  elite: { label: "Elit", icon: Crown, accent: "#FDE68A" },
};

export default function ProfileHero({
  user,
  isViewingOtherProfile = false,
  onImageUpload,
  onShowQR,
  onLogout,
  onReport,
  showMoreMenu,
  setShowMoreMenu,
  targetUserId,
}) {
  const skill = SKILL_CONFIG[user?.skill_level] || SKILL_CONFIG.intermediate;
  const SkillIcon = skill.icon;
  const displayName = user?.display_name || user?.full_name || "Spelare";
  const city = user?.city || "Stockholm";
  const matchesPlayed = user?.matches_played || 0;
  const currentStreak = user?.current_streak || 0;
  const rank = getRankFromMatches(matchesPlayed, currentStreak);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[22px] sm:rounded-[28px] lg:rounded-[32px] border border-white/[0.07]"
      style={{
        background:
          "radial-gradient(140% 110% at 50% 0%, #0F2A18 0%, #0A1C10 45%, #05100A 100%)",
        boxShadow:
          "0 28px 70px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Pitch lines — signature */}
      <PitchPattern />

      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-28 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full blur-[110px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(52,194,87,0.35) 0%, rgba(52,194,87,0.08) 40%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-24 w-[320px] h-[320px] rounded-full blur-[100px] pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(244,116,59,0.18) 0%, transparent 65%)",
        }}
      />

      {/* Noise */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
        }}
      />

      {/* Top-right actions */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 flex items-center gap-2">
        {!isViewingOtherProfile ? (
          <>
            <Link to={createPageUrl("AccountSettings")}>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all ring-1 ring-white/12"
                title="Kontoinställningar"
              >
                <Settings className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.3} />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={onLogout}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all ring-1 ring-white/12"
              title="Logga ut"
            >
              <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.3} />
            </motion.button>
          </>
        ) : (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all ring-1 ring-white/12"
            >
              <MoreVertical className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.3} />
            </motion.button>

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-[#121715] border border-[#223029] rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onReport?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#F4F7F5] hover:bg-[#18221E] transition-colors"
                  >
                    <Flag className="w-4 h-4 text-red-400" />
                    Rapportera
                  </button>
                  <div className="px-4 py-2">
                    <BlockUserButton
                      targetUserId={targetUserId}
                      variant="ghost"
                      className="w-full justify-start px-0"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7 lg:px-11 lg:pt-10 lg:pb-9">
        {/* Eyebrow — small & restrained */}
        <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 mb-4 sm:mb-5">
          {isViewingOtherProfile ? "Spelarprofil" : "Min profil"}
        </div>

        {/* Identity row — avatar + name + meta */}
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              aria-hidden
              className="absolute -inset-1.5 rounded-[22px] opacity-70 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(52,194,87,0.5), transparent 50%, rgba(244,116,59,0.25))",
                filter: "blur(10px)",
              }}
            />
            <div className="relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] lg:w-[96px] lg:h-[96px] rounded-[18px] sm:rounded-[20px] overflow-hidden ring-1 ring-white/15 bg-gradient-to-br from-white/[0.08] to-black/40 flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {displayName[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {!isViewingOtherProfile && (
              <>
                <input
                  type="file"
                  id="profile-image-upload"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                />
                <label htmlFor="profile-image-upload">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="absolute -bottom-1.5 -right-1.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white ring-2 ring-[#0A1C10] transition-all"
                    style={{
                      background:
                        "linear-gradient(180deg, #FF8A4D 0%, #F4743B 55%, #D95D26 100%)",
                      boxShadow: "0 6px 14px rgba(244,116,59,0.42)",
                    }}
                    onClick={() =>
                      document.getElementById("profile-image-upload").click()
                    }
                    aria-label="Ändra profilbild"
                  >
                    <Camera className="w-4 h-4" strokeWidth={2.4} />
                  </motion.button>
                </label>
              </>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <motion.h1
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-[22px] sm:text-[30px] lg:text-[38px] font-black text-white tracking-[-0.03em] leading-[1.05] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              >
                {displayName}
              </motion.h1>
              <RankBadge matchesPlayed={matchesPlayed} currentStreak={currentStreak} size="sm" showLabel={false} />
            </div>

            {/* Meta chips — wrapped so they always fit */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 sm:mt-3">
              <Chip>
                <MapPin className="w-3 h-3" strokeWidth={2.5} />
                <span className="truncate max-w-[12ch]">{city}</span>
              </Chip>
              <Chip accent={skill.accent}>
                <SkillIcon className="w-3 h-3" strokeWidth={2.5} />
                {skill.label}
              </Chip>
            </div>

            {/* Bio — only if it exists and not too long on mobile */}
            {user?.bio && (
              <p className="mt-2.5 sm:mt-3 text-[12px] sm:text-[13px] text-white/65 leading-[1.5] line-clamp-2 max-w-[42ch]">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats — Matcher | Rank | MVPs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-6 sm:mt-7 lg:mt-8">
          <StatCell
            icon={Trophy}
            value={user?.matches_played || 0}
            label="Matcher"
            accent="#86EFAC"
          />
          {/* Rank — center cell, badge + name */}
          <div
            className="relative rounded-2xl px-2 py-3 sm:py-4 bg-white/[0.035] ring-1 ring-white/[0.07] backdrop-blur-sm overflow-hidden flex flex-col items-center justify-center gap-2"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 30%, ${rank.accent}22 0%, transparent 70%)` }}
            />
            <div className="relative">
              <RankBadge matchesPlayed={matchesPlayed} currentStreak={currentStreak} size="md" showLabel={false} showDivChip={false} />
            </div>
            <div
              className="relative text-[10px] sm:text-[11px] font-bold text-center leading-none tracking-wide uppercase"
              style={{ color: rank.accent }}
            >
              {rank.name}
            </div>
          </div>
          <StatCell
            icon={Award}
            value={user?.mvp_count || 0}
            label="MVPs"
            accent="#FDE3D2"
          />
        </div>

        {/* Progress bar */}
        <div
          className="mt-3 sm:mt-4 rounded-2xl px-4 py-3"
          style={{ background: `${rank.accent}0D`, border: `1px solid ${rank.accent}1A` }}
        >
          {rank.streakBonus && (
            <p className="text-[11px] text-amber-400 font-semibold mb-2 text-center">🔥 Streakbonus aktiv</p>
          )}
          <RankProgressBar matchesPlayed={matchesPlayed} currentStreak={currentStreak} />
        </div>

        {/* Actions — only for own profile */}
        {!isViewingOtherProfile && (
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-4 sm:mt-5">
            <Link to={createPageUrl("EditProfile")} className="block">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[13px] sm:text-[14px] transition-colors"
                style={{
                  background:
                    "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)",
                  boxShadow:
                    "0 8px 20px rgba(43,168,74,0.32), inset 0 1px 0 rgba(255,255,255,0.22)",
                }}
              >
                <Edit className="w-4 h-4" strokeWidth={2.5} />
                Redigera
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                triggerHaptic("light");
                onShowQR?.();
              }}
              className="w-full h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[13px] sm:text-[14px] bg-white/[0.06] hover:bg-white/[0.12] ring-1 ring-white/15 hover:ring-white/25 backdrop-blur-sm transition-colors"
            >
              <QrCode className="w-4 h-4" strokeWidth={2.5} />
              Bjud in
            </motion.button>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// ─── Meta chip ────────────────────────────────────────────
function Chip({ children, accent }) {
  return (
    <span
      className="inline-flex items-center gap-1 h-6 sm:h-[26px] px-2 rounded-full text-[10.5px] sm:text-[11px] font-bold text-white/90 bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-sm"
      style={accent ? { color: accent } : undefined}
    >
      {children}
    </span>
  );
}

// ─── Stat cell ────────────────────────────────────────────
function StatCell({ icon: Icon, value, label, accent }) {
  return (
    <div className="relative rounded-2xl px-3 py-3 sm:py-4 bg-white/[0.035] ring-1 ring-white/[0.07] backdrop-blur-sm overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: `linear-gradient(140deg, ${accent}0D 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex flex-col items-center">
        <Icon
          className="w-4 h-4 sm:w-[18px] sm:h-[18px] mb-1.5"
          style={{ color: accent }}
          strokeWidth={2.4}
        />
        <div className="text-[20px] sm:text-[24px] lg:text-[28px] font-black text-white tabular-nums leading-none tracking-[-0.02em]">
          {value}
        </div>
        <div className="text-[10px] sm:text-[11px] font-semibold text-white/55 mt-1 leading-none">
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Pitch pattern (shared signature) ─────────────────────
function PitchPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="profilePitchFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="profilePitchGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34C257" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#34C257" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#34C257" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer boundary */}
      <rect x="8" y="14" width="384" height="272" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" rx="4" />
      {/* Center line + circle */}
      <line x1="200" y1="14" x2="200" y2="286" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <circle cx="200" cy="150" r="44" fill="url(#profilePitchGlow)" />
      <circle cx="200" cy="150" r="44" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <circle cx="200" cy="150" r="2" fill="#ffffff" fillOpacity="0.18" />
      {/* Left penalty + goal box */}
      <rect x="8" y="70" width="66" height="160" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <rect x="8" y="112" width="24" height="76" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <path d="M 74 130 A 22 22 0 0 1 74 170" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <circle cx="54" cy="150" r="1.6" fill="#ffffff" fillOpacity="0.18" />
      <rect x="2" y="134" width="6" height="32" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      {/* Right penalty + goal box */}
      <rect x="326" y="70" width="66" height="160" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <rect x="368" y="112" width="24" height="76" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <path d="M 326 130 A 22 22 0 0 0 326 170" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
      <circle cx="346" cy="150" r="1.6" fill="#ffffff" fillOpacity="0.18" />
      <rect x="392" y="134" width="6" height="32" fill="none" stroke="url(#profilePitchFade)" strokeWidth="1.5" />
    </svg>
  );
}
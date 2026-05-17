import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Target, Users, ArrowRight } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";

/**
 * CommunityHero — same signature language as DashboardHero / ProfileHero.
 * Pitch lines + ambient orbs + strict 8pt spacing grid. Mobile-first.
 */
export default function CommunityHero({
  user,
  friendsCount = 0,
  teamsCount = 0,
  onFindPlayers,
  onViewTeams,
}) {
  const { t } = useT();
  const firstName = getFirstName(user, t);

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
      {/* Pitch signature */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="communityPitchFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id="communityPitchGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34C257" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#34C257" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Outer */}
        <rect x="8" y="14" width="384" height="272" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" rx="4" />
        {/* Center line + circle */}
        <line x1="200" y1="14" x2="200" y2="286" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="44" fill="url(#communityPitchGlow)" />
        <circle cx="200" cy="150" r="44" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="2" fill="#ffffff" fillOpacity="0.18" />
        {/* Left penalty + goal box */}
        <rect x="8" y="70" width="66" height="160" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <rect x="8" y="112" width="24" height="76" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <path d="M 74 130 A 22 22 0 0 1 74 170" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <circle cx="54" cy="150" r="1.6" fill="#ffffff" fillOpacity="0.18" />
        <rect x="2" y="134" width="6" height="32" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        {/* Right penalty + goal box */}
        <rect x="326" y="70" width="66" height="160" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <rect x="368" y="112" width="24" height="76" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <path d="M 326 130 A 22 22 0 0 0 326 170" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
        <circle cx="346" cy="150" r="1.6" fill="#ffffff" fillOpacity="0.18" />
        <rect x="392" y="134" width="6" height="32" fill="none" stroke="url(#communityPitchFade)" strokeWidth="1.5" />
      </svg>

      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-28 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full blur-[110px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(147,112,219,0.32) 0%, rgba(52,194,87,0.08) 40%, transparent 70%)",
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
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7 lg:px-11 lg:pt-10 lg:pb-9">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-5 sm:mb-7">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#86EFAC]" strokeWidth={2.4} />
          </div>
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Community
          </div>
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="text-[26px] sm:text-[34px] lg:text-[42px] leading-[1.03] font-black text-white tracking-[-0.03em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
        >
          {t('community.hero.headline_a')}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(95deg, #86EFAC 0%, #34C257 45%, #22C55E 100%)",
            }}
          >
            {t('community.hero.headline_b')}
          </span>
          .
        </motion.h1>

        {/* Stats row — compact chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 sm:mt-4">
          <StatChip label={t('community.hero.friends_label')} value={friendsCount} accent="#86EFAC" />
          <StatChip label={t('community.hero.teams_label')} value={teamsCount} accent="#C4B5FD" />
        </div>

        {/* CTAs — stacked on tiny, 2-col from xs up */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-5 sm:mt-7 grid grid-cols-2 gap-2 sm:gap-2.5"
        >
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onFindPlayers}
            className="relative overflow-hidden h-12 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-[13px] sm:text-[14px] transition-colors"
            style={{
              background: "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)",
              boxShadow: "0 10px 24px rgba(43,168,74,0.4), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            <UserPlus className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
            <span>{t('community.hero.find_players')}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80" strokeWidth={2.6} />
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewTeams}
            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-[13px] sm:text-[14px] bg-white/[0.06] hover:bg-white/[0.12] ring-1 ring-white/15 hover:ring-white/25 backdrop-blur-sm transition-colors"
          >
            <Target className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#C4B5FD]" strokeWidth={2.5} />
            <span>{t('community.hero.my_teams')}</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
}

function StatChip({ label, value, accent }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/[0.055] ring-1 ring-white/10 backdrop-blur-sm"
    >
      <span
        className="text-[11px] sm:text-[12px] font-black tabular-nums leading-none"
        style={{ color: accent }}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium text-white/65 leading-none">{label}</span>
    </span>
  );
}

function getFirstName(user, t) {
  const name = user?.display_name || user?.full_name || "";
  return name.split(" ")[0] || t('profile.hero.default_name');
}
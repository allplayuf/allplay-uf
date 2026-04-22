import React from "react";
import { motion } from "framer-motion";

/**
 * PremiumHero — shared hero card used across Dashboard, Profile, Matches, Community etc.
 * Based on the Profile page hero style the user liked, standardized and polished.
 *
 * Props:
 *  - icon: ReactNode (rendered inside the colored badge)
 *  - eyebrow: small uppercase label above title (optional)
 *  - title: main heading
 *  - subtitle: secondary line under title (optional)
 *  - actions: ReactNode — buttons/CTAs rendered bottom-right (optional)
 *  - accent: 'green' | 'orange' | 'mixed' (default: 'green')
 *  - children: extra content (stats, progress, etc.) rendered below header (optional)
 */
const ACCENT_CONFIG = {
  green: {
    gradient: "from-[#2BA84A] via-[#1E7A36] to-[#0F2917]",
    glow1: "bg-[#2BA84A]/40",
    glow2: "bg-[#34C257]/30",
    badgeBg: "bg-white/10",
    ring: "ring-white/20",
  },
  orange: {
    gradient: "from-[#F4743B] via-[#D95D26] to-[#4A1F0D]",
    glow1: "bg-[#F4743B]/40",
    glow2: "bg-[#FF8A4D]/30",
    badgeBg: "bg-white/10",
    ring: "ring-white/20",
  },
  mixed: {
    gradient: "from-[#2BA84A] via-[#1A5E3C] to-[#F4743B]",
    glow1: "bg-[#2BA84A]/35",
    glow2: "bg-[#F4743B]/30",
    badgeBg: "bg-white/10",
    ring: "ring-white/20",
  },
};

export default function PremiumHero({
  icon,
  eyebrow,
  title,
  subtitle,
  actions,
  accent = "green",
  children,
  className = "",
}) {
  const cfg = ACCENT_CONFIG[accent] || ACCENT_CONFIG.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[24px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${className}`}
    >
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient}`} />

      {/* Ambient glows */}
      <div
        className={`absolute -top-24 -right-16 w-72 h-72 ${cfg.glow1} rounded-full blur-3xl pointer-events-none`}
      />
      <div
        className={`absolute -bottom-24 -left-16 w-64 h-64 ${cfg.glow2} rounded-full blur-3xl pointer-events-none`}
      />

      {/* Noise / hairline highlight for premium feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-6 lg:p-8">
        <div className="flex items-start gap-4 sm:gap-5">
          {icon && (
            <div
              className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${cfg.badgeBg} backdrop-blur-md ring-1 ${cfg.ring} flex items-center justify-center shadow-lg`}
            >
              {icon}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {eyebrow && (
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] text-white/70 mb-1.5">
                {eyebrow}
              </p>
            )}
            <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] leading-tight font-black text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm sm:text-base text-white/80 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="hidden sm:flex flex-shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Mobile actions — below header */}
        {actions && (
          <div className="flex sm:hidden gap-2 mt-4">{actions}</div>
        )}

        {/* Extra slot (stats, progress, etc.) */}
        {children && <div className="mt-5 sm:mt-6">{children}</div>}
      </div>
    </motion.div>
  );
}
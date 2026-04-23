import React from "react";
import { motion } from "framer-motion";

/**
 * UniversalHero — the premium hero card used across the app.
 *
 * Design principles:
 * - Cinematic depth: layered gradient + animated orbs + pitch pattern
 * - Signature hairline highlight on top edge (premium feel)
 * - Flexible: avatar slot, title, eyebrow pill, meta chips, stats grid, CTAs
 * - Accent themes: green, orange, purple, gold, mixed
 *
 * Composition:
 *   <UniversalHero accent="green" eyebrow="Community">
 *     <UniversalHero.Avatar src={...} name="..." />
 *     <UniversalHero.Title>Hitta din nästa lagkamrat</UniversalHero.Title>
 *     <UniversalHero.Subtitle>Spelare, lag och vänner</UniversalHero.Subtitle>
 *     <UniversalHero.Chips>...</UniversalHero.Chips>
 *     <UniversalHero.Stats items={[...]} />
 *     <UniversalHero.Actions>...</UniversalHero.Actions>
 *   </UniversalHero>
 */

const ACCENTS = {
  green: {
    gradient: "linear-gradient(135deg, #0F2917 0%, #1E7A36 45%, #0D1F10 100%)",
    orb1: "rgba(52, 194, 87, 0.45)",
    orb2: "rgba(244, 116, 59, 0.18)",
    dotColor: "#34C257",
    eyebrowText: "#86EFAC",
    eyebrowBg: "rgba(43,168,74,0.22)",
    eyebrowRing: "rgba(43,168,74,0.45)",
  },
  orange: {
    gradient: "linear-gradient(135deg, #2B1408 0%, #D95D26 45%, #1A0C05 100%)",
    orb1: "rgba(244, 116, 59, 0.5)",
    orb2: "rgba(52, 194, 87, 0.15)",
    dotColor: "#FB923C",
    eyebrowText: "#FED7AA",
    eyebrowBg: "rgba(244,116,59,0.22)",
    eyebrowRing: "rgba(244,116,59,0.45)",
  },
  purple: {
    gradient: "linear-gradient(135deg, #1E1438 0%, #6D28D9 45%, #0E0923 100%)",
    orb1: "rgba(167, 139, 250, 0.45)",
    orb2: "rgba(244, 116, 59, 0.15)",
    dotColor: "#A78BFA",
    eyebrowText: "#DDD6FE",
    eyebrowBg: "rgba(139,92,246,0.22)",
    eyebrowRing: "rgba(139,92,246,0.45)",
  },
  gold: {
    gradient: "linear-gradient(135deg, #2B1F08 0%, #D97706 45%, #1A1305 100%)",
    orb1: "rgba(251, 191, 36, 0.45)",
    orb2: "rgba(244, 116, 59, 0.2)",
    dotColor: "#FBBF24",
    eyebrowText: "#FDE68A",
    eyebrowBg: "rgba(217,119,6,0.22)",
    eyebrowRing: "rgba(217,119,6,0.45)",
  },
  mixed: {
    gradient: "linear-gradient(135deg, #0F2917 0%, #1E7A36 40%, #D95D26 100%)",
    orb1: "rgba(52, 194, 87, 0.4)",
    orb2: "rgba(244, 116, 59, 0.35)",
    dotColor: "#34C257",
    eyebrowText: "#EAF6EE",
    eyebrowBg: "rgba(255,255,255,0.14)",
    eyebrowRing: "rgba(255,255,255,0.25)",
  },
};

export default function UniversalHero({
  accent = "green",
  eyebrow,
  showPitchPattern = true,
  topRight,
  children,
  className = "",
}) {
  const cfg = ACCENTS[accent] || ACCENTS.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[28px] border border-white/10 ${className}`}
      style={{
        background: cfg.gradient,
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Pitch pattern (subtle, cinematic) */}
      {showPitchPattern && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
          viewBox="0 0 400 300"
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect x="10" y="20" width="380" height="260" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="150" r="45" fill="none" stroke="white" strokeWidth="2" />
          <line x1="200" y1="20" x2="200" y2="280" stroke="white" strokeWidth="2" />
          <rect x="10" y="90" width="80" height="120" fill="none" stroke="white" strokeWidth="2" />
          <rect x="310" y="90" width="80" height="120" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      )}

      {/* Ambient animated orbs */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.9, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.orb1} 0%, transparent 70%)` }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.orb2} 0%, transparent 70%)` }}
      />

      {/* Hairline top highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Top-right actions slot */}
      {topRight && (
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
          {topRight}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-7 lg:p-8">
        {eyebrow && (
          <div
            className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{
              background: cfg.eyebrowBg,
              boxShadow: `0 0 0 1px ${cfg.eyebrowRing}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.dotColor }}
            />
            <span
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: cfg.eyebrowText }}
            >
              {eyebrow}
            </span>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}

// ── Sub-components ──────────────────────────────────────────

UniversalHero.Header = function Header({ children, className = "" }) {
  return (
    <div className={`flex items-center gap-4 sm:gap-5 ${className}`}>
      {children}
    </div>
  );
};

UniversalHero.Avatar = function Avatar({ src, name, size = "default", ring = true }) {
  const sizes = {
    sm: "w-12 h-12 sm:w-14 sm:h-14 text-base",
    default: "w-16 h-16 sm:w-20 sm:h-20 text-2xl",
    lg: "w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-3xl",
  };
  return (
    <div className="relative flex-shrink-0">
      {ring && (
        <div className="absolute -inset-1.5 rounded-[22px] bg-white/15 blur-md pointer-events-none" />
      )}
      <div
        className={`relative ${sizes[size]} rounded-2xl overflow-hidden ring-1 ring-white/20 bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-sm flex items-center justify-center shadow-[0_12px_30px_rgba(0,0,0,0.45)]`}
      >
        {src ? (
          <img src={src} alt={name || ""} className="w-full h-full object-cover" loading="eager" />
        ) : (
          <span className="font-black text-white">{(name || "?")[0]?.toUpperCase()}</span>
        )}
      </div>
    </div>
  );
};

UniversalHero.Title = function Title({ children, className = "" }) {
  return (
    <h1
      className={`text-[24px] sm:text-[30px] lg:text-[38px] leading-[1.05] font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] ${className}`}
    >
      {children}
    </h1>
  );
};

UniversalHero.Subtitle = function Subtitle({ children, className = "" }) {
  return (
    <p
      className={`mt-1.5 text-[12px] sm:text-[14px] text-white/80 leading-relaxed ${className}`}
    >
      {children}
    </p>
  );
};

UniversalHero.Chips = function Chips({ children, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 ${className}`}>
      {children}
    </div>
  );
};

UniversalHero.Chip = function Chip({ icon: Icon, children, dot, variant = "default" }) {
  const variants = {
    default: "bg-white/10 ring-1 ring-white/20 text-white",
    accent: "bg-[#F4743B]/22 ring-1 ring-[#F4743B]/45 text-[#FED7AA]",
    success: "bg-[#2BA84A]/22 ring-1 ring-[#2BA84A]/45 text-[#86EFAC]",
  };
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full backdrop-blur-sm text-[11px] font-semibold ${variants[variant]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

UniversalHero.Stats = function Stats({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
            className="relative rounded-2xl p-3 sm:p-3.5 text-center backdrop-blur-sm bg-white/8 ring-1 ring-white/15 overflow-hidden"
          >
            {Icon && (
              <Icon
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] mx-auto mb-1.5"
                style={{ color: item.color || "#86EFAC" }}
                strokeWidth={2.5}
              />
            )}
            <div className="text-[20px] sm:text-[24px] font-black text-white tabular-nums leading-none mb-0.5">
              {item.value}
            </div>
            <div className="text-[10px] font-bold text-white/65 uppercase tracking-wider">
              {item.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

UniversalHero.Actions = function Actions({ children, className = "" }) {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-3 mt-5 ${className}`}>
      {children}
    </div>
  );
};

UniversalHero.ActionButton = function ActionButton({ onClick, icon: Icon, children, variant = "primary" }) {
  const variants = {
    primary:
      "text-white shadow-[0_8px_24px_rgba(43,168,74,0.35)] hover:shadow-[0_10px_28px_rgba(43,168,74,0.45)]",
    accent:
      "text-white shadow-[0_8px_24px_rgba(244,116,59,0.35)] hover:shadow-[0_10px_28px_rgba(244,116,59,0.45)]",
    glass:
      "bg-white/12 ring-1 ring-white/25 text-white backdrop-blur-sm hover:bg-white/18",
  };
  const primaryStyle = {
    primary: {
      background:
        "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)",
    },
    accent: {
      background:
        "linear-gradient(180deg, #FF8A4D 0%, #F4743B 55%, #D95D26 100%)",
    },
  };
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`h-12 sm:h-[52px] rounded-2xl flex items-center justify-center gap-2 font-black text-[13px] sm:text-[14px] transition-all ${variants[variant]}`}
      style={primaryStyle[variant]}
    >
      {Icon && <Icon className="w-4 h-4" strokeWidth={2.6} />}
      <span>{children}</span>
    </motion.button>
  );
};

UniversalHero.IconButton = function IconButton({ onClick, icon: Icon, label }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/12 hover:bg-white/20 ring-1 ring-white/20 text-white/90 hover:text-white backdrop-blur-sm transition-all flex items-center justify-center"
    >
      {Icon && <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
    </motion.button>
  );
};
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
    // Deeper, darker base — night-pitch feel. Accent glows live in orbs only.
    gradient: "linear-gradient(145deg, #070D09 0%, #0C1C12 35%, #103A1E 70%, #081410 100%)",
    orb1: "rgba(52, 194, 87, 0.38)",
    orb2: "rgba(244, 116, 59, 0.14)",
    dotColor: "#34C257",
    eyebrowText: "#86EFAC",
    eyebrowBg: "rgba(43,168,74,0.18)",
    eyebrowRing: "rgba(43,168,74,0.4)",
  },
  orange: {
    gradient: "linear-gradient(145deg, #0B0604 0%, #1A0C07 35%, #4D1F0C 70%, #0C0604 100%)",
    orb1: "rgba(244, 116, 59, 0.42)",
    orb2: "rgba(52, 194, 87, 0.12)",
    dotColor: "#FB923C",
    eyebrowText: "#FED7AA",
    eyebrowBg: "rgba(244,116,59,0.18)",
    eyebrowRing: "rgba(244,116,59,0.4)",
  },
  purple: {
    gradient: "linear-gradient(145deg, #08060F 0%, #120C22 35%, #2F1B60 70%, #0A0714 100%)",
    orb1: "rgba(167, 139, 250, 0.38)",
    orb2: "rgba(244, 116, 59, 0.12)",
    dotColor: "#A78BFA",
    eyebrowText: "#DDD6FE",
    eyebrowBg: "rgba(139,92,246,0.18)",
    eyebrowRing: "rgba(139,92,246,0.4)",
  },
  gold: {
    gradient: "linear-gradient(145deg, #0C0804 0%, #1A1206 35%, #4A2E06 70%, #0C0804 100%)",
    orb1: "rgba(251, 191, 36, 0.38)",
    orb2: "rgba(244, 116, 59, 0.16)",
    dotColor: "#FBBF24",
    eyebrowText: "#FDE68A",
    eyebrowBg: "rgba(217,119,6,0.18)",
    eyebrowRing: "rgba(217,119,6,0.4)",
  },
  mixed: {
    gradient: "linear-gradient(145deg, #070D09 0%, #0C1C12 40%, #3A1E0E 100%)",
    orb1: "rgba(52, 194, 87, 0.34)",
    orb2: "rgba(244, 116, 59, 0.3)",
    dotColor: "#34C257",
    eyebrowText: "#EAF6EE",
    eyebrowBg: "rgba(255,255,255,0.1)",
    eyebrowRing: "rgba(255,255,255,0.2)",
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
      className={`relative overflow-hidden rounded-[22px] sm:rounded-[26px] lg:rounded-[28px] border border-white/[0.08] ${className}`}
      style={{
        background: cfg.gradient,
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {/* Pitch pattern (subtle, cinematic) */}
      {showPitchPattern && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.045] pointer-events-none"
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

      {/* Noise/grain overlay for premium depth */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Ambient animated orbs — responsive sizing */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.75, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-16 -right-14 sm:-top-24 sm:-right-20 w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.orb1} 0%, transparent 70%)` }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.55, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute -bottom-16 -left-10 sm:-bottom-24 sm:-left-16 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.orb2} 0%, transparent 70%)` }}
      />

      {/* Hairline top highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
        }}
      />

      {/* Deep bottom vignette — mörkare botten, premium känsla */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Top-right actions slot */}
      {topRight && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-5 lg:right-5 z-20 flex items-center gap-2">
          {topRight}
        </div>
      )}

      {/* Content — tighter on mobile, breathing room on desktop */}
      <div className="relative z-10 px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
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
    <div className={`flex items-center gap-3 sm:gap-4 lg:gap-5 ${className}`}>
      {children}
    </div>
  );
};

UniversalHero.Avatar = function Avatar({ src, name, size = "default", ring = true }) {
  const sizes = {
    sm: "w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-sm sm:text-base",
    default: "w-14 h-14 sm:w-[68px] sm:h-[68px] lg:w-[76px] lg:h-[76px] text-xl sm:text-2xl",
    lg: "w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-2xl sm:text-3xl",
  };
  return (
    <div className="relative flex-shrink-0">
      {ring && (
        <div className="absolute -inset-1 sm:-inset-1.5 rounded-[20px] bg-white/10 blur-md pointer-events-none" />
      )}
      <div
        className={`relative ${sizes[size]} rounded-2xl overflow-hidden ring-1 ring-white/15 bg-gradient-to-br from-white/8 to-black/30 backdrop-blur-sm flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.5)]`}
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
      className={`text-[20px] sm:text-[26px] lg:text-[34px] leading-[1.1] font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] ${className}`}
    >
      {children}
    </h1>
  );
};

UniversalHero.Subtitle = function Subtitle({ children, className = "" }) {
  return (
    <p
      className={`mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] lg:text-[14px] text-white/75 leading-snug sm:leading-relaxed line-clamp-2 ${className}`}
    >
      {children}
    </p>
  );
};

UniversalHero.Chips = function Chips({ children, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 ${className}`}>
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
    <div className={`grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3 mt-4 sm:mt-5 ${className}`}>
      {children}
    </div>
  );
};

UniversalHero.ActionButton = function ActionButton({ onClick, icon: Icon, children, variant = "primary" }) {
  const variants = {
    primary:
      "text-white shadow-[0_6px_18px_rgba(43,168,74,0.35)] active:shadow-[0_2px_8px_rgba(43,168,74,0.45)]",
    accent:
      "text-white shadow-[0_6px_18px_rgba(244,116,59,0.35)] active:shadow-[0_2px_8px_rgba(244,116,59,0.45)]",
    glass:
      "bg-white/10 ring-1 ring-white/20 text-white backdrop-blur-sm hover:bg-white/15 active:bg-white/20",
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
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`h-11 sm:h-12 lg:h-[52px] px-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 font-black text-[12px] sm:text-[13px] lg:text-[14px] transition-all ${variants[variant]}`}
      style={primaryStyle[variant]}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2.6} />}
      <span className="truncate">{children}</span>
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
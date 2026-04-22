import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * PremiumEmptyState — unified empty state card used across the app.
 * Replaces the various "Du har inga matcher", "Inga deltagare än" etc. cards.
 *
 * Props:
 *  - icon: ReactNode (shown in a floating badge)
 *  - title: main heading
 *  - description: body text
 *  - actionLabel: primary button label (optional)
 *  - onAction: primary button click (optional)
 *  - secondaryLabel / onSecondary: optional secondary button
 *  - accent: 'green' | 'orange' (default: 'green')
 */
const ACCENT_CONFIG = {
  green: {
    glowA: "rgba(43,168,74,0.22)",
    glowB: "rgba(52,194,87,0.15)",
    badgeBg: "bg-[#2BA84A]/15",
    badgeRing: "ring-[#2BA84A]/30",
    badgeIcon: "text-[#34C257]",
    primaryBtn:
      "bg-[#2BA84A] hover:bg-[#248232] text-white shadow-[0_8px_24px_rgba(43,168,74,0.35)]",
  },
  orange: {
    glowA: "rgba(244,116,59,0.22)",
    glowB: "rgba(255,138,77,0.15)",
    badgeBg: "bg-[#F4743B]/15",
    badgeRing: "ring-[#F4743B]/30",
    badgeIcon: "text-[#FF8A4D]",
    primaryBtn:
      "bg-[#F4743B] hover:bg-[#E5683A] text-white shadow-[0_8px_24px_rgba(244,116,59,0.35)]",
  },
};

export default function PremiumEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  accent = "green",
  className = "",
}) {
  const cfg = ACCENT_CONFIG[accent] || ACCENT_CONFIG.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[24px] border border-[#243029] bg-[#121715] ${className}`}
      style={{
        boxShadow:
          "0 16px 40px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Soft ambient glows */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl"
        style={{ background: cfg.glowA }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl"
        style={{ background: cfg.glowB }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-10 sm:py-12">
        {icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center ${cfg.badgeBg} ring-1 ${cfg.badgeRing} ${cfg.badgeIcon} mb-5`}
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {icon}
          </motion.div>
        )}
        <h3 className="text-lg sm:text-xl font-bold text-[#F5F8F6] tracking-tight mb-1.5">
          {title}
        </h3>
        {description && (
          <p className="text-sm sm:text-[15px] text-[#B6C2BC] max-w-sm leading-relaxed mb-6">
            {description}
          </p>
        )}
        {(actionLabel || secondaryLabel) && (
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            {actionLabel && onAction && (
              <button
                onClick={onAction}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold transition-transform active:scale-[0.97] ${cfg.primaryBtn}`}
              >
                {actionLabel}
              </button>
            )}
            {secondaryLabel && onSecondary && (
              <button
                onClick={onSecondary}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#2E3D34] bg-[#18221E] px-5 text-sm font-semibold text-[#F5F8F6] hover:bg-[#1E2724] transition-colors"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
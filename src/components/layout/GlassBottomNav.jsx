import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { triggerHaptic } from "@/components/utils/motionTokens";

/**
 * GlassBottomNav — floating, capsule-shaped bottom tab bar with
 * strong backdrop blur, subtle gradient, and a glowing active pill.
 *
 * Props:
 *   items: [{ title, url, icon }]
 *   onTabClick: (item) => void
 */
export default function GlassBottomNav({ items = [], onTabClick }) {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed left-0 right-0 z-[100] pointer-events-none"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 10px)",
        paddingLeft: "calc(env(safe-area-inset-left) + 12px)",
        paddingRight: "calc(env(safe-area-inset-right) + 12px)",
      }}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative mx-auto max-w-3xl overflow-hidden rounded-[22px] border border-white/[0.08]"
        style={{
          // Matches GlassHeader — same transparency + blur for unified look
          background: "rgba(18,23,20,0.55)",
          backdropFilter: "saturate(180%) blur(26px)",
          WebkitBackdropFilter: "saturate(180%) blur(26px)",
          boxShadow:
            "0 10px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Top hairline highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
          }}
        />

        <div className="flex items-stretch justify-between gap-0.5 sm:gap-1 px-1.5 py-1.5 sm:px-2 sm:py-2">
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.title}
                onClick={() => {
                  triggerHaptic("light");
                  onTabClick?.(item);
                }}
                whileTap={{ scale: 0.94 }}
                className="relative flex-1 flex flex-col items-center justify-center min-h-[48px] sm:min-h-[52px] rounded-[18px] px-1 py-1 sm:px-2 sm:py-1.5"
              >
                {/* Active pill — animates between tabs via layoutId */}
                {isActive && (
                  <motion.div
                    layoutId="glass-nav-active-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-[18px]"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(43,168,74,0.28), rgba(43,168,74,0.12))",
                      boxShadow:
                        "0 0 0 1px rgba(43,168,74,0.35), 0 8px 24px rgba(43,168,74,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                  <Icon
                    className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-colors ${
                      isActive ? "text-[#B8F0C6]" : "text-[#9EAAA4]"
                    }`}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  <span
                    className={`text-[9.5px] sm:text-[10px] font-semibold transition-colors leading-tight ${
                      isActive ? "text-[#EAF6EE]" : "text-[#9EAAA4]"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Soft glow ring under active icon */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.08, duration: 0.3 }}
                    className="absolute -bottom-2 w-8 h-1 rounded-full blur-md pointer-events-none"
                    style={{ background: "rgba(52,194,87,0.55)" }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
}
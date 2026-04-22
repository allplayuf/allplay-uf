import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/components/utils/motionTokens";

/**
 * GlassHeader — thin, floating glass panel for mobile.
 * High transparency + strong blur. Matches GlassBottomNav visually.
 * Content: logo (or back button) + brand name + settings button.
 */
export default function GlassHeader({ showBack, onSettings }) {
  const navigate = useNavigate();

  const handleBack = () => {
    triggerHaptic("light");
    navigate(-1);
  };

  const handleSettings = () => {
    triggerHaptic("light");
    if (onSettings) {
      onSettings();
    } else {
      navigate(createPageUrl("AccountSettings"));
    }
  };

  return (
    <div
      className="lg:hidden fixed left-0 right-0 z-[100] pointer-events-none"
      style={{
        top: "calc(env(safe-area-inset-top) + 8px)",
        paddingLeft: "calc(env(safe-area-inset-left) + 12px)",
        paddingRight: "calc(env(safe-area-inset-right) + 12px)",
      }}
    >
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative mx-auto max-w-3xl overflow-hidden rounded-[22px] border border-white/[0.08]"
        style={{
          // High transparency — no heavy gradient, matches bottom nav
          background: "rgba(18,23,20,0.55)",
          backdropFilter: "saturate(180%) blur(26px)",
          WebkitBackdropFilter: "saturate(180%) blur(26px)",
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Hairline top highlight — identical to bottom nav */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
          }}
        />

        {/* Compact row — reduced vertical padding */}
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2">
          {showBack ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] text-white/90 hover:bg-white/[0.12] hover:text-white transition-colors ring-1 ring-white/[0.07] flex-shrink-0"
              aria-label="Tillbaka"
            >
              <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png"
                alt="AllPlay"
                className="w-8 h-8 object-contain"
                loading="eager"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[15px] sm:text-[16px] leading-[20px] text-[#F5F8F6] truncate tracking-tight">
              AllPlay
            </h1>
          </div>

          <button
            onClick={handleSettings}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] text-white/90 hover:bg-white/[0.12] hover:text-white transition-colors ring-1 ring-white/[0.07] flex-shrink-0"
            aria-label="Inställningar"
          >
            <Settings className="w-[17px] h-[17px]" strokeWidth={2} />
          </button>
        </div>
      </motion.header>
    </div>
  );
}
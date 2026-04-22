import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/components/utils/motionTokens";

/**
 * GlassHeader — floating glassmorphism header for mobile.
 * Sits ~8px from top, has rounded 20px corners, strong blur, subtle gradient.
 * Shows back button on sub-pages + a circular settings icon on the right.
 */
export default function GlassHeader({ showBack, onSettings }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    triggerHaptic("light");
    navigate(-1);
  };

  const handleSettings = () => {
    triggerHaptic("light");
    if (onSettings) {
      onSettings();
    } else {
      // Default: go to account settings
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
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative mx-auto max-w-3xl overflow-hidden rounded-[20px] border border-white/[0.08]"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,28,25,0.78) 0%, rgba(14,19,16,0.72) 100%)",
          backdropFilter: "saturate(180%) blur(22px)",
          WebkitBackdropFilter: "saturate(180%) blur(22px)",
          boxShadow:
            "0 12px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Subtle top highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
          }}
        />

        <div className="flex items-center gap-3 px-3 py-2.5">
          {showBack ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] text-white/90 hover:bg-white/[0.12] hover:text-white transition-colors ring-1 ring-white/[0.08] flex-shrink-0"
              aria-label="Tillbaka"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/[0.04] ring-1 ring-white/[0.06] flex items-center justify-center flex-shrink-0">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png"
                alt="AllPlay"
                className="w-7 h-7 object-contain"
                loading="eager"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h1 className="font-bold text-[17px] leading-[22px] text-[#F5F8F6] truncate tracking-tight">
              AllPlay
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-[#2BA84A]/20 text-[#B8F0C6] ring-1 ring-[#2BA84A]/30">
              UF
            </span>
          </div>

          <button
            onClick={handleSettings}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] text-white/90 hover:bg-white/[0.12] hover:text-white transition-colors ring-1 ring-white/[0.08] flex-shrink-0"
            aria-label="Inställningar"
          >
            <Settings className="w-4.5 h-4.5" strokeWidth={2} />
          </button>
        </div>
      </motion.header>
    </div>
  );
}
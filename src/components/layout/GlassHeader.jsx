import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/components/utils/motionTokens";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import QRModal from "@/components/profile/QRModal";
import { LoginModal } from "@/components/supabase";

/**
 * GlassHeader — thin, floating glass panel for mobile.
 * High transparency + strong blur. Matches GlassBottomNav visually.
 * Content: logo (or back button) + brand name + settings button.
 * When not authenticated: shows a compact "Logga in" button instead of settings.
 */
export default function GlassHeader({ showBack }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSupabaseAuth();
  const [showQR, setShowQR] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleBack = () => {
    triggerHaptic("light");
    navigate(-1);
  };

  const handleSettingsClick = () => {
    triggerHaptic("light");
    navigate(createPageUrl("AccountSettings"));
  };

  const handleLoginClick = () => {
    triggerHaptic("light");
    setShowLogin(true);
  };

  return (
    <>
      <div
        className="lg:hidden fixed left-0 right-0 z-[100] pointer-events-none"
        style={{
          top: 0,
          paddingTop: "calc(env(safe-area-inset-top) + 8px)",
          paddingLeft: "calc(env(safe-area-inset-left) + 12px)",
          paddingRight: "calc(env(safe-area-inset-right) + 12px)",
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
      >
        <motion.header
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto relative mx-auto max-w-3xl overflow-hidden rounded-[22px] border border-white/[0.08]"
          style={{
            background: "rgba(18,23,20,0.55)",
            backdropFilter: "saturate(180%) blur(26px)",
            WebkitBackdropFilter: "saturate(180%) blur(26px)",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Hairline top highlight */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
            }}
          />

          {/* Compact row */}
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

            {/* Right-side action — Logga in for guests, Settings for authenticated */}
            {isAuthenticated ? (
              <button
                onClick={handleSettingsClick}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] text-white/90 hover:bg-white/[0.12] hover:text-white transition-colors ring-1 ring-white/[0.07] flex-shrink-0"
                aria-label="Inställningar"
              >
                <Settings className="w-[17px] h-[17px]" strokeWidth={2} />
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLoginClick}
                className="flex items-center gap-1.5 h-9 px-3 rounded-full text-white text-[13px] font-bold flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)",
                  boxShadow:
                    "0 4px 14px rgba(43,168,74,0.38), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
                aria-label="Logga in"
              >
                <LogIn className="w-[14px] h-[14px]" strokeWidth={2.4} />
                <span>Logga in</span>
              </motion.button>
            )}
          </div>
        </motion.header>
      </div>

      {/* QR modal */}
      {showQR && user && (
        <QRModal user={user} onClose={() => setShowQR(false)} />
      )}

      {/* Login modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
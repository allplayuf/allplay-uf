import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogIn, UserPlus, ArrowRight } from "lucide-react";
import { useSupabaseAuth, LoginModal } from "@/components/supabase";
import { triggerHaptic } from "@/components/utils/motionTokens";

/**
 * GuestBlocker — UI-only auth gate. Backend RLS is the real security boundary.
 *
 * Usage:
 *   <GuestBlocker feature="join_match"><Button>Gå med</Button></GuestBlocker>
 *   <GuestBlocker showInline feature="create_match" />
 */
export function GuestBlocker({
  children,
  feature = "protected_action",
  showInline = false,
  onBlock = null,
  className = "",
}) {
  const { isGuest, isLoading } = useSupabaseAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleBlock = () => {
    triggerHaptic("light");
    if (onBlock) onBlock();
    else setShowLogin(true);
  };

  if (isLoading) return children;
  if (!isGuest) return children;

  if (showInline) {
    return (
      <>
        <div
          className={`rounded-2xl overflow-hidden ${className}`}
          style={{
            background: "rgba(18,23,20,0.8)",
            border: "1px solid rgba(43,168,74,0.2)",
          }}
        >
          {/* Green top bar */}
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg, #2BA84A, #34C257)" }} />
          <div className="flex items-center gap-3 p-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(43,168,74,0.12)", border: "1px solid rgba(43,168,74,0.3)" }}
            >
              <Lock className="w-[18px] h-[18px] text-[#2BA84A]" strokeWidth={2.3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-[#F4F7F5] leading-tight">Logga in krävs</p>
              <p className="text-[12px] text-[#8FA097] mt-0.5">Skapa ett gratis konto för att fortsätta</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBlock}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl font-bold text-[13px] text-white flex-shrink-0"
              style={{
                background: "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)",
                boxShadow: "0 4px 14px rgba(43,168,74,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} />
              Logga in
            </motion.button>
          </div>
        </div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </>
    );
  }

  // Default: intercept child onClick
  return (
    <>
      {children && (
        <span
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBlock(); }}
          className="contents"
        >
          {children}
        </span>
      )}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

// ─── GuestOverlay ─────────────────────────────────────────────────────────────

export function GuestOverlay({
  children,
  message = "Logga in för att använda denna funktion",
  className = "",
}) {
  const { isGuest, isLoading } = useSupabaseAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isLoading || !isGuest) return children;

  return (
    <div className={`relative ${className}`}>
      {children}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#0F1513]/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10 p-4"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(43,168,74,0.12)", border: "1px solid rgba(43,168,74,0.3)" }}
        >
          <Lock className="w-6 h-6 text-[#2BA84A]" strokeWidth={2.2} />
        </div>
        <p className="text-[#F4F7F5] font-semibold text-[14px] text-center mb-4 leading-snug">{message}</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { triggerHaptic("medium"); setShowLogin(true); }}
          className="h-11 px-6 rounded-xl font-bold text-[14px] text-white flex items-center gap-2"
          style={{
            background: "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)",
            boxShadow: "0 4px 16px rgba(43,168,74,0.4)",
          }}
        >
          <LogIn className="w-4 h-4" strokeWidth={2.4} />
          Logga in
        </motion.button>
      </motion.div>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

// ─── GuestModal ───────────────────────────────────────────────────────────────

const FEATURE_LABELS = {
  join_match:    "gå med i matcher",
  create_match:  "skapa matcher",
  add_friend:    "lägga till vänner",
  chat:          "chatta med spelare",
  join_team:     "gå med i lag",
  create_team:   "skapa lag",
  join_cup:      "delta i cuper",
  edit_profile:  "redigera din profil",
  invite:        "bjuda in andra",
};

export function GuestModal({ isOpen, onClose, feature = "denna funktion" }) {
  const [showLogin, setShowLogin] = useState(false);
  const label = FEATURE_LABELS[feature] || feature;

  if (!isOpen && !showLogin) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && !showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: "rgba(0,0,0,0.72)" }}
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 48, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-[400px] overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
              style={{
                background: "radial-gradient(150% 100% at 50% -10%, #0E2718 0%, #090F0C 60%, #060C09 100%)",
                boxShadow: "0 -20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
              }}
            >
              {/* Accent top line */}
              <div
                className="h-[3px] w-full"
                style={{ background: "linear-gradient(90deg, #2BA84A 0%, #34C257 50%, #2BA84A 100%)" }}
              />

              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-7 pb-6 pt-4 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, type: "spring", stiffness: 400, damping: 22 }}
                  className="w-[72px] h-[72px] mx-auto mb-5 rounded-[22px] flex items-center justify-center"
                  style={{
                    background: "rgba(43,168,74,0.12)",
                    border: "1px solid rgba(43,168,74,0.32)",
                    boxShadow: "0 0 32px rgba(43,168,74,0.18)",
                  }}
                >
                  <UserPlus className="w-8 h-8 text-[#2BA84A]" strokeWidth={2.1} />
                </motion.div>

                <h2 className="text-[22px] font-black text-[#F4F7F5] leading-tight mb-2 tracking-[-0.02em]">
                  Logga in för att fortsätta
                </h2>
                <p className="text-[14px] text-[#8FA097] leading-relaxed mb-7">
                  Skapa ett gratis konto för att{" "}
                  <span className="text-[#C8D8C2] font-semibold">{label}</span> och se allt
                  AllPlay har att erbjuda.
                </p>

                <div className="space-y-2.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { triggerHaptic("medium"); setShowLogin(true); }}
                    className="w-full h-[52px] rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)",
                      boxShadow: "0 8px 28px rgba(43,168,74,0.45), inset 0 1px 0 rgba(255,255,255,0.22)",
                    }}
                  >
                    <LogIn className="w-4 h-4" strokeWidth={2.5} />
                    Logga in / Skapa konto
                  </motion.button>

                  <button
                    onClick={() => { triggerHaptic("light"); onClose(); }}
                    className="w-full h-11 rounded-xl text-[#6B7A73] text-[13px] font-semibold hover:text-[#9EAAA4] hover:bg-white/[0.04] transition-colors"
                  >
                    Inte nu
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={showLogin}
        onClose={() => { setShowLogin(false); onClose(); }}
        onSuccess={() => { setShowLogin(false); onClose(); }}
      />
    </>
  );
}

// ─── useGuestBlock hook ───────────────────────────────────────────────────────

export function useGuestBlock() {
  const { isGuest, isLoading } = useSupabaseAuth();
  const [showModal, setShowModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState(null);
  const [pendingCallback, setPendingCallback] = useState(null);

  const checkAuth = (feature, callback) => {
    if (isGuest) {
      setBlockedFeature(feature);
      setPendingCallback(() => callback);
      triggerHaptic("light");
      setShowModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  const handleLoginSuccess = () => {
    setShowModal(false);
    if (pendingCallback) { pendingCallback(); setPendingCallback(null); }
  };

  const GuestBlockModal = () => (
    <LoginModal
      isOpen={showModal}
      onClose={() => { setShowModal(false); setPendingCallback(null); }}
      onSuccess={handleLoginSuccess}
    />
  );

  return { isGuest, isLoading, checkAuth, GuestBlockModal, showModal, setShowModal };
}

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Zap, MapPin, Users } from 'lucide-react';
import LoginModal from '@/components/supabase/LoginModal';
import { useSupabaseAuth } from '@/components/supabase/AuthProvider';
import { base44 } from '@/api/base44Client';
import { triggerHaptic } from '@/components/utils/motionTokens';

export const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';
export const ONBOARDING_EVENT = 'allplay:show-onboarding';

const SLIDES = [
  { id: 'hero' },
  { id: 'how' },
  { id: 'auth' },
];

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -56 : 56, opacity: 0 }),
};

function GreenButton({ children, onClick, disabled = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[54px] rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        boxShadow: '0 8px 28px rgba(34,197,94,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Screen 1: Hook ───────────────────────────────────────────────────────────

const STATS = [
  { value: '47+', label: 'matcher idag' },
  { value: 'Gratis', label: 'att komma igång' },
  { value: 'Alla', label: 'nivåer välkomna' },
];

function HeroSlide() {
  return (
    <div className="flex flex-col flex-1 px-6 pt-10 pb-6">
      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2.5 mb-10"
      >
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: '#22C55E', boxShadow: '0 4px 18px rgba(34,197,94,0.55)' }}
        >
          <Zap size={19} className="text-black" strokeWidth={3} />
        </div>
        <span className="text-[22px] font-black text-white tracking-[-0.025em]">AllPlay</span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-[1.0] tracking-[-0.035em] mb-4"
        style={{ fontSize: 'clamp(36px, 10vw, 46px)' }}
      >
        Fotboll med<br />
        <span style={{ color: '#22C55E' }}>vem som helst.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.26, duration: 0.5 }}
        className="text-[15px] leading-relaxed font-medium mb-8"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        Hitta öppna matcher nära dig. Gå med direkt. Inga lag, ingen bokning — bara spel.
      </motion.p>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mt-auto">
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl px-2 py-4 flex flex-col items-center text-center gap-1"
            style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.16)' }}
          >
            <span className="text-[18px] font-black leading-none" style={{ color: '#22C55E' }}>{s.value}</span>
            <span className="text-[10px] font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.36)' }}>{s.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen 2: How it works ───────────────────────────────────────────────────

const HOW_STEPS = [
  {
    Icon: MapPin,
    title: 'Hitta en match',
    desc: 'Se alla öppna matcher nära dig på kartan eller i listan — filtrerat efter stad och tid.',
  },
  {
    Icon: Zap,
    title: 'Gå med direkt',
    desc: 'Tryck "Gå med" — inga formulär, inga väntetider. Du syns direkt på matchens deltagarlista.',
  },
  {
    Icon: Users,
    title: 'Möt nya spelare',
    desc: 'Spela, chatta och bygg ditt nätverk. Alla nivåer är välkomna.',
  },
];

function HowSlide() {
  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-6">
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-tight tracking-[-0.028em] mb-1.5"
        style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}
      >
        Så här fungerar<br />AllPlay.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-[14px] mb-7 font-medium"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        Tre steg till ditt nästa spel.
      </motion.p>

      <div className="flex flex-col gap-3.5">
        {HOW_STEPS.map(({ Icon, title, desc }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-4 rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.22)' }}
            >
              <Icon size={18} style={{ color: '#22C55E' }} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-[15px] mb-0.5">{title}</p>
              <p className="text-[12px] leading-snug font-medium" style={{ color: 'rgba(255,255,255,0.36)' }}>{desc}</p>
            </div>
            <span
              className="text-[28px] font-black flex-shrink-0 self-center tabular-nums"
              style={{ color: 'rgba(34,197,94,0.16)', lineHeight: 1 }}
            >
              {i + 1}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen 3: Auth ───────────────────────────────────────────────────────────

function AuthSlide({ isAuthenticated, isAuthLoading, onSuccess, onGuest }) {
  if (!isAuthLoading && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 gap-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(34,197,94,0.15)',
            border: '2px solid rgba(34,197,94,0.5)',
            boxShadow: '0 0 40px rgba(34,197,94,0.2)',
          }}
        >
          <Check className="w-9 h-9" style={{ color: '#22C55E' }} strokeWidth={2.8} />
        </motion.div>
        <div className="text-center">
          <p className="text-[22px] font-black text-white mb-1.5 tracking-[-0.02em]">Du är inloggad!</p>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.42)' }}>Välkommen till AllPlay.</p>
        </div>
        <GreenButton onClick={onSuccess}>
          Kom igång <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
        </GreenButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-5 pt-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="flex items-center gap-2 mb-3"
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22C55E' }} />
        <span
          className="text-[11px] font-black tracking-[0.15em] uppercase"
          style={{ color: 'rgba(34,197,94,0.8)' }}
        >
          Sista steget
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-tight tracking-[-0.028em] mb-1.5"
        style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}
      >
        Skapa ditt konto.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="text-[13.5px] leading-relaxed mb-6 font-medium"
        style={{ color: 'rgba(255,255,255,0.42)' }}
      >
        Gratis att komma igång
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
      >
        <LoginModal
          isOpen
          inline
          initialMode="register"
          onSuccess={onSuccess}
          onClose={() => {}}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        onClick={onGuest}
        className="w-full mt-5 py-3 text-[13px] font-semibold rounded-xl transition-colors"
        style={{ color: 'rgba(255,255,255,0.3)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
      >
        Fortsätt som gäst
      </motion.button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function OnboardingModal() {
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth();
  const [open, setOpen]   = useState(false);
  const [slide, setSlide] = useState(0);
  const [dir, setDir]     = useState(1);
  const [ref_] = useState(() => new URLSearchParams(window.location.search).get('ref'));

  // Initial show — needs_location is legacy, auto-complete it
  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored === 'true') return;
    if (stored === 'needs_location') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      return;
    }
    const t = setTimeout(() => setOpen(true), 450);
    return () => clearTimeout(t);
  }, []);

  // Replay from Settings
  useEffect(() => {
    const handler = () => {
      setSlide(0); setDir(1);
      setOpen(true);
    };
    window.addEventListener(ONBOARDING_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_EVENT, handler);
  }, []);

  // Referral code capture
  useEffect(() => {
    if (!ref_) return;
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (!user.referred_by) {
            await base44.functions.invoke('auth/handleReferralSignup', { userId: user.id, referralCode: ref_ }).catch(() => {});
          }
        } else {
          sessionStorage.setItem('pending_referral_code', ref_);
        }
      } catch { /**/ }
    })();
  }, [ref_]);

  const complete = useCallback(async () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        await base44.auth.updateMe({ onboarding_completed: true });
        const pending = sessionStorage.getItem('pending_referral_code');
        if (pending) {
          const u = await base44.auth.me();
          await base44.functions.invoke('auth/handleReferralSignup', { userId: u.id, referralCode: pending }).catch(() => {});
          sessionStorage.removeItem('pending_referral_code');
        }
      }
    } catch { /**/ }
    setOpen(false);
  }, []);

  // Handle OAuth return — complete immediately
  useEffect(() => {
    if (!open || isAuthLoading) return;
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored && isAuthenticated && slide < 2) {
      complete();
    }
  }, [open, isAuthenticated, isAuthLoading, slide, complete]);

  const handleAuthSuccess = useCallback(() => {
    triggerHaptic('success');
    complete();
  }, [complete]);

  const goTo = useCallback((n) => { setDir(1); setSlide(n); }, []);

  if (!open) return null;

  const cur = SLIDES[slide];
  const showFooter = cur.id !== 'auth';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
        >
          <div className="hidden sm:block absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <motion.div
            initial={{ y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative z-10 flex flex-col w-full h-[100dvh] sm:w-[420px] sm:h-auto sm:max-h-[90vh] sm:rounded-[28px] overflow-hidden"
            style={{
              background: '#070D09',
              boxShadow: '0 -24px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.07)',
            }}
          >
            {/* Top green accent line */}
            <div
              className="absolute inset-x-0 top-0 h-[2px] z-20"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #22C55E 35%, #4ADE80 55%, #22C55E 70%, transparent 100%)' }}
            />

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
            </div>

            {/* Progress pills */}
            <div
              className="relative z-10 flex-shrink-0 flex items-center justify-center gap-2"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: 10 }}
            >
              {SLIDES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === slide ? 28 : 7,
                    height: 7,
                    backgroundColor: i <= slide ? '#22C55E' : 'rgba(255,255,255,0.16)',
                  }}
                  style={{ borderRadius: 999, flexShrink: 0 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                />
              ))}
            </div>

            {/* Slide content */}
            <div className="relative z-10 flex-1 min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={slide}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  className="flex flex-col min-h-full"
                >
                  {cur.id === 'hero' && <HeroSlide />}
                  {cur.id === 'how'  && <HowSlide />}
                  {cur.id === 'auth' && (
                    <AuthSlide
                      isAuthenticated={isAuthenticated}
                      isAuthLoading={isAuthLoading}
                      onSuccess={handleAuthSuccess}
                      onGuest={complete}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer CTA */}
            {showFooter && (
              <div
                className="relative z-10 flex-shrink-0 px-5 pt-3 border-t border-white/[0.06]"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
              >
                {cur.id === 'hero' && (
                  <GreenButton onClick={() => goTo(1)}>
                    Nästa <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                  </GreenButton>
                )}
                {cur.id === 'how' && (
                  <GreenButton onClick={() => goTo(2)}>
                    Skapa konto <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                  </GreenButton>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

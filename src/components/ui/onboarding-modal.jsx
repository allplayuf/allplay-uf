import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, MapPin, Users, Zap } from 'lucide-react';
import LoginModal from '@/components/supabase/LoginModal';
import { useSupabaseAuth } from '@/components/supabase/AuthProvider';
import { base44 } from '@/api/base44Client';
import { triggerHaptic } from '@/components/utils/motionTokens';

export const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';
export const ONBOARDING_EVENT = 'allplay:show-onboarding';

const LOGO_URL =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png';

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

// ─── Pitch background SVG ─────────────────────────────────────────────────────
// Mirrors the reference design: dark forest green with subtle field markings

function PitchBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base field with alternating stripe bands */}
      <svg
        viewBox="0 0 100 160"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.9 }}
      >
        {/* Alternating pitch stripes */}
        {Array.from({ length: 16 }, (_, i) => (
          <rect
            key={i}
            x={0} y={i * 10} width={100} height={10}
            fill={i % 2 === 0 ? '#0B2010' : '#0D2613'}
          />
        ))}

        {/* Outer boundary */}
        <rect x="5" y="5" width="90" height="150" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5" />

        {/* Halfway line */}
        <line x1="5" y1="80" x2="95" y2="80" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5" />

        {/* Centre circle */}
        <circle cx="50" cy="80" r="14" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5" />
        <circle cx="50" cy="80" r="1" fill="rgba(255,255,255,0.25)" />

        {/* Top penalty area */}
        <rect x="24" y="5" width="52" height="22" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        {/* Top goal area */}
        <rect x="36" y="5" width="28" height="9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        {/* Top penalty spot */}
        <circle cx="50" cy="17" r="0.7" fill="rgba(255,255,255,0.2)" />
        {/* Top penalty arc */}
        <path d="M 38 27 A 12 12 0 0 1 62 27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* Bottom penalty area */}
        <rect x="24" y="133" width="52" height="22" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        {/* Bottom goal area */}
        <rect x="36" y="146" width="28" height="9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        {/* Bottom penalty spot */}
        <circle cx="50" cy="143" r="0.7" fill="rgba(255,255,255,0.2)" />
        {/* Bottom penalty arc */}
        <path d="M 38 133 A 12 12 0 0 0 62 133" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* Corner arcs */}
        <path d="M 5 9 A 4 4 0 0 1 9 5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <path d="M 95 9 A 4 4 0 0 0 91 5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <path d="M 5 151 A 4 4 0 0 0 9 155" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <path d="M 95 151 A 4 4 0 0 1 91 155" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      </svg>

      {/* Radial glow from centre — replicates the floodlight feel from the reference */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(34,197,94,0.13) 0%, rgba(34,197,94,0.04) 45%, transparent 75%)',
        }}
      />

      {/* Dark vignette around edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(5,14,8,0.70) 100%)',
        }}
      />
    </div>
  );
}

// ─── Shared green button ──────────────────────────────────────────────────────

function GreenButton({ children, onClick, disabled = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[54px] rounded-2xl font-black text-[15.5px] text-white flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #2EC95E 0%, #19A348 100%)',
        boxShadow: '0 8px 32px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
        opacity: disabled ? 0.6 : 1,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Screen 1: Hero — mirrors the reference screenshot ────────────────────────

function HeroSlide() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center px-7 py-10 text-center">
      <PitchBackground />

      {/* Logo mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.55, type: 'spring', stiffness: 300, damping: 22 }}
        className="relative mb-5 z-10"
      >
        <div
          className="w-[88px] h-[88px] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #2EC95E, #168A38)',
            boxShadow:
              '0 0 0 1.5px rgba(46,201,94,0.35), 0 0 40px rgba(34,197,94,0.55), 0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <img
            src={LOGO_URL}
            alt="AllPlay"
            className="w-[54px] h-[54px] object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </motion.div>

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 mb-8"
      >
        <p className="text-[28px] font-black text-white tracking-[-0.03em] leading-tight">AllPlay</p>
        <p
          className="text-[12px] font-bold tracking-[0.18em] uppercase mt-0.5"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          UF · Sverige
        </p>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 font-black text-white leading-[1.05] tracking-[-0.03em] mb-4"
        style={{ fontSize: 'clamp(32px, 9vw, 42px)' }}
      >
        Hitta din nästa<br />match.
      </motion.h1>

      {/* Sub copy */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.44, duration: 0.5 }}
        className="z-10 text-[15px] leading-relaxed font-medium"
        style={{ color: 'rgba(255,255,255,0.52)', maxWidth: 300 }}
      >
        Pickup-fotboll nära dig. Gå med i öppna matcher, bygg laget och klättra i ELO.
      </motion.p>
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
    desc: 'Tryck "Gå med" — inga formulär, inga väntetider. Du syns direkt i matchlistan.',
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
      {/* Small logo mark top-left for brand continuity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 mb-7"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #2EC95E, #168A38)',
            boxShadow: '0 0 12px rgba(34,197,94,0.5)',
          }}
        >
          <img src={LOGO_URL} alt="" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <span className="text-[15px] font-black text-white tracking-tight">AllPlay</span>
      </motion.div>

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-[14px] mb-6 font-medium"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        Tre steg till ditt nästa spel.
      </motion.p>

      <div className="flex flex-col gap-3">
        {HOW_STEPS.map(({ Icon, title, desc }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-4 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(34,197,94,0.14)',
                border: '1px solid rgba(34,197,94,0.28)',
              }}
            >
              <Icon size={18} style={{ color: '#2EC95E' }} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-[15px] mb-0.5">{title}</p>
              <p className="text-[12px] leading-snug font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {desc}
              </p>
            </div>
            <span
              className="text-[30px] font-black flex-shrink-0 self-center tabular-nums"
              style={{ color: 'rgba(46,201,94,0.14)', lineHeight: 1 }}
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
            boxShadow: '0 0 40px rgba(34,197,94,0.25)',
          }}
        >
          <Check className="w-9 h-9" style={{ color: '#2EC95E' }} strokeWidth={2.8} />
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
      {/* Small logo for brand continuity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 mb-6"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #2EC95E, #168A38)',
            boxShadow: '0 0 12px rgba(34,197,94,0.5)',
          }}
        >
          <img src={LOGO_URL} alt="" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <span className="text-[15px] font-black text-white tracking-tight">AllPlay</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-tight tracking-[-0.028em] mb-1.5"
        style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}
      >
        Skapa ditt konto.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16, duration: 0.4 }}
        className="text-[13.5px] leading-relaxed mb-6 font-medium"
        style={{ color: 'rgba(255,255,255,0.42)' }}
      >
        Gratis att komma igång
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
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
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={onGuest}
        className="w-full mt-5 py-3 text-[13px] font-semibold rounded-xl transition-colors"
        style={{ color: 'rgba(255,255,255,0.3)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
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

  // Initial show — needs_location is legacy; auto-complete it silently
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
    const handler = () => { setSlide(0); setDir(1); setOpen(true); };
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

  // Handle OAuth return — complete immediately when returning authenticated
  useEffect(() => {
    if (!open || isAuthLoading) return;
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored && isAuthenticated && slide < 2) complete();
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
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <div className="hidden sm:block absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 72, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative z-10 flex flex-col w-full h-[100dvh] sm:w-[420px] sm:h-auto sm:max-h-[90vh] sm:rounded-[28px] overflow-hidden"
            style={{
              background: '#0B2010',
              boxShadow: '0 -28px 72px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            {/* Top green accent line */}
            <div
              className="absolute inset-x-0 top-0 h-[2px] z-20"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #2EC95E 30%, #7EE89A 55%, #2EC95E 75%, transparent 100%)',
              }}
            />

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-0 flex-shrink-0 relative z-10">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
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
                    backgroundColor:
                      i <= slide ? '#2EC95E' : 'rgba(255,255,255,0.18)',
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

            {/* Footer CTA (hero + how only) */}
            {showFooter && (
              <div
                className="relative z-10 flex-shrink-0 px-5 pt-3"
                style={{
                  paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(11,32,16,0.85)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {cur.id === 'hero' && (
                  <>
                    <GreenButton onClick={() => goTo(1)}>
                      Kom igång <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                    </GreenButton>
                    <button
                      onClick={complete}
                      className="w-full mt-3 py-2.5 text-[13px] font-semibold transition-colors"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                    >
                      Har du redan ett konto? <span style={{ color: '#2EC95E' }}>Logga in</span>
                    </button>
                  </>
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

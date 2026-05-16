import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Zap } from 'lucide-react';
import LoginModal from '@/components/supabase/LoginModal';
import { useSupabaseAuth } from '@/components/supabase/AuthProvider';
import { base44 } from '@/api/base44Client';
import { triggerHaptic } from '@/components/utils/motionTokens';

export const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';
export const ONBOARDING_EVENT = 'allplay:show-onboarding';

const SLIDES = [
  { id: 'hero' },
  { id: 'proof' },
  { id: 'auth' },
];

// ─── Football SVG ─────────────────────────────────────────────────────────────

function Ball({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg" cx="36%" cy="28%" r="52%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e4e4e4" />
          <stop offset="100%" stopColor="#bbbbbb" />
        </radialGradient>
        <clipPath id="bc"><circle cx="50" cy="50" r="48" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg)" />
      <g clipPath="url(#bc)" fill="#111">
        <polygon points="50,4 61,14 57,27 43,27 39,14" />
        <polygon points="84,25 91,38 84,50 72,47 69,34" />
        <polygon points="16,25 31,34 28,47 16,50 9,38" />
        <polygon points="87,63 83,76 71,82 63,72 69,59" />
        <polygon points="13,63 31,59 37,72 29,82 17,76" />
        <polygon points="50,96 39,86 43,73 57,73 61,86" />
      </g>
      <ellipse cx="37" cy="32" rx="8" ry="6" fill="rgba(255,255,255,0.44)" />
    </svg>
  );
}

// ─── Animated football pitch ───────────────────────────────────────────────────

const GREEN_TEAM = [
  { x: 50, y: 18 },
  { x: 22, y: 32 }, { x: 38, y: 28 }, { x: 62, y: 28 }, { x: 78, y: 32 },
  { x: 35, y: 43 }, { x: 65, y: 43 },
];
const WHITE_TEAM = [
  { x: 50, y: 82 },
  { x: 22, y: 68 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 78, y: 68 },
  { x: 35, y: 57 }, { x: 65, y: 57 },
];

function PitchHero() {
  return (
    <div className="relative w-full overflow-hidden flex-shrink-0" style={{ height: 340 }}>
      {/* Pitch stripes */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 10} y={0} width={10} height={100} fill={i % 2 === 0 ? '#0A1A0E' : '#081408'} />
        ))}
        <rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="1.4" fill="rgba(255,255,255,0.28)" />
        <rect x="28" y="3" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
        <rect x="28" y="79" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
        <rect x="38" y="3" width="24" height="8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <rect x="38" y="89" width="24" height="8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      </svg>

      {/* Centre glow */}
      <div className="absolute pointer-events-none" style={{
        left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 68%)',
      }} />

      {/* Floodlight glow from top corners */}
      <div className="absolute pointer-events-none" style={{
        left: 0, top: 0, width: '100%', height: '40%',
        background: 'radial-gradient(ellipse 60% 80% at 20% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)',
      }} />
      <div className="absolute pointer-events-none" style={{
        left: 0, top: 0, width: '100%', height: '40%',
        background: 'radial-gradient(ellipse 60% 80% at 80% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)',
      }} />

      {GREEN_TEAM.map((p, i) => (
        <motion.div key={`g${i}`} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: 12, height: 12, transform: 'translate(-50%,-50%)', background: '#22C55E', boxShadow: '0 0 10px rgba(34,197,94,1), 0 0 20px rgba(34,197,94,0.5)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.2 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
        />
      ))}

      {WHITE_TEAM.map((p, i) => (
        <motion.div key={`w${i}`} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: 10, height: 10, transform: 'translate(-50%,-50%)', background: 'rgba(255,255,255,0.6)', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
          animate={{ opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.14 }}
        />
      ))}

      <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.8))' }}>
          <Ball size={52} />
        </motion.div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 40%, rgba(5,10,7,0.8) 100%)',
      }} />
      {/* Bottom fade into content */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, transparent, #070D09 90%)',
      }} />

      {/* AllPlay wordmark floating over pitch */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute top-5 left-0 right-0 flex justify-center"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.22)', backdropFilter: 'blur(8px)' }}>
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#22C55E' }}>
            <Zap size={9} className="text-black" strokeWidth={3} />
          </div>
          <span className="text-[11px] font-black tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.9)' }}>AllPlay</span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:  (d) => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
};

// ─── Green CTA button ─────────────────────────────────────────────────────────

function GreenButton({ children, onClick, disabled = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[54px] rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        boxShadow: '0 8px 28px rgba(34,197,94,0.40), inset 0 1px 0 rgba(255,255,255,0.18)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Slide content components ─────────────────────────────────────────────────

function HeroSlide() {
  return (
    <div className="flex flex-col flex-1">
      <PitchHero />
      {/* Text floats up over pitch gradient */}
      <div className="px-6 pt-1 pb-6" style={{ marginTop: -28 }}>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-black text-white leading-[1.0] tracking-[-0.035em] mb-3"
          style={{ fontSize: 'clamp(38px, 10vw, 48px)' }}
        >
          Fotboll<br />
          <span style={{ color: '#22C55E' }}>när du vill.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15px] leading-relaxed font-medium"
          style={{ color: 'rgba(255,255,255,0.48)' }}
        >
          Hitta en match. Gå med direkt.<br />Inga lag behövs.
        </motion.p>
      </div>
    </div>
  );
}

const AVATAR_COLORS = ['#1A6B35', '#1E8040', '#166B2E', '#22A348'];
const AVATAR_LABELS = ['M', 'J', 'K', 'A'];

function ProofSlide() {
  return (
    <div className="flex flex-col flex-1 px-5 pt-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="flex items-center gap-2 mb-3"
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.9)' }}
        />
        <span className="text-[11px] font-black tracking-[0.15em] uppercase" style={{ color: 'rgba(34,197,94,0.8)' }}>
          Live just nu
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-tight tracking-[-0.028em] mb-1.5"
        style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}
      >
        Matcher händer<br />just nu.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-[13.5px] leading-relaxed mb-5 font-medium"
        style={{ color: 'rgba(255,255,255,0.42)' }}
      >
        Gå med i minuter, inte dagar.
      </motion.p>

      {/* Ghost card peeking behind */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Second card peeking below */}
        <div className="absolute inset-x-4 -bottom-2 rounded-[18px] h-10"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(34,197,94,0.12)',
            zIndex: 0,
          }}
        />

        {/* Main match card */}
        <div
          className="relative rounded-[20px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.045)',
            border: '1.5px solid rgba(34,197,94,0.42)',
            boxShadow: '0 0 40px rgba(34,197,94,0.16), 0 0 0 1px rgba(34,197,94,0.08)',
            zIndex: 1,
          }}
        >
          {/* Top color stripe */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #16A34A, #22C55E, #4ADE80, #22C55E)' }} />

          <div className="p-5 space-y-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[18px] font-black text-white leading-tight tracking-[-0.02em]">Östermalms IP</p>
                <p className="text-[12.5px] mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.42)' }}>
                  Tisdag 18:00 · 5 mot 5
                </p>
              </div>
              <span
                className="text-[10.5px] font-bold px-2.5 py-1.5 rounded-xl flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(34,197,94,0.14)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.28)' }}
              >
                Alla nivåer
              </span>
            </div>

            {/* Progress bar 6/10 */}
            <div>
              <div className="flex justify-between items-baseline text-[11.5px] mb-2">
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Platser fyllda</span>
                <span className="font-black text-[14px]" style={{ color: '#22C55E' }}>6 / 10</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #16A34A, #22C55E, #4ADE80)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '60%' }}
                  transition={{ delay: 0.52, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-1.5">
              {AVATAR_LABELS.map((label, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.55 + i * 0.07, type: 'spring', stiffness: 500, damping: 22 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                  style={{ background: AVATAR_COLORS[i], boxShadow: '0 0 0 2px rgba(7,13,9,1), 0 0 0 3.5px rgba(34,197,94,0.28)' }}
                >
                  {label}
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.83, type: 'spring', stiffness: 500, damping: 22 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10.5px] font-bold ml-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.38)' }}
              >
                +2
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="ml-auto text-[11px] font-semibold"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                4 platser kvar
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AuthSlide({ isAuthenticated, isAuthLoading, onSuccess }) {
  if (!isAuthLoading && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 gap-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.5)', boxShadow: '0 0 40px rgba(34,197,94,0.2)' }}
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
    <div className="flex flex-col flex-1 px-5 pt-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="flex items-center gap-2 mb-3"
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22C55E' }} />
        <span className="text-[11px] font-black tracking-[0.15em] uppercase" style={{ color: 'rgba(34,197,94,0.8)' }}>
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

  // Initial show — location screen removed: needs_location is auto-completed
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

  // Handle OAuth return: jump straight to completion
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
            style={{ background: '#070D09', boxShadow: '0 -24px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.07)' }}
          >
            {/* Top green accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px] z-20"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #22C55E 35%, #4ADE80 55%, #22C55E 70%, transparent 100%)' }} />

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/18" />
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
                  transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                  className="flex flex-col min-h-full"
                >
                  {cur.id === 'hero'  && <HeroSlide />}
                  {cur.id === 'proof' && <ProofSlide />}
                  {cur.id === 'auth'  && (
                    <AuthSlide
                      isAuthenticated={isAuthenticated}
                      isAuthLoading={isAuthLoading}
                      onSuccess={handleAuthSuccess}
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
                    Kom igång <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                  </GreenButton>
                )}
                {cur.id === 'proof' && (
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

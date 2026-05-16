import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Navigation } from 'lucide-react';
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
  { id: 'location' },
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

function PitchHero({ height = 300 }) {
  return (
    <div className="relative w-full overflow-hidden flex-shrink-0" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 10} y={0} width={10} height={100} fill={i % 2 === 0 ? '#0C1E10' : '#091509'} />
        ))}
        <rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="1.4" fill="rgba(255,255,255,0.3)" />
        <rect x="28" y="3" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <rect x="28" y="79" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <rect x="38" y="3" width="24" height="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <rect x="38" y="89" width="24" height="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      </svg>

      <div className="absolute pointer-events-none" style={{
        left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: 120, height: 120,
        background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 70%)',
      }} />

      {GREEN_TEAM.map((p, i) => (
        <motion.div key={`g${i}`} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: 11, height: 11, transform: 'translate(-50%,-50%)', background: '#22C55E', boxShadow: '0 0 7px rgba(34,197,94,0.9)' }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.2 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
        />
      ))}

      {WHITE_TEAM.map((p, i) => (
        <motion.div key={`w${i}`} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: 10, height: 10, transform: 'translate(-50%,-50%)', background: 'rgba(255,255,255,0.55)', boxShadow: '0 0 5px rgba(255,255,255,0.4)' }}
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.14 }}
        />
      ))}

      <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.7))' }}>
          <Ball size={48} />
        </motion.div>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 45%, rgba(7,13,9,0.75) 100%)',
      }} />
      <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, transparent, #070D09)',
      }} />
    </div>
  );
}

// ─── Animated map pin for location screen ─────────────────────────────────────

function MapPinAnimation() {
  return (
    <div className="flex justify-center items-center" style={{ height: 180 }}>
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ border: '2px solid rgba(34,197,94,0.5)', width: 60 + i * 24, height: 60 + i * 24 }}
            animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            boxShadow: '0 8px 28px rgba(34,197,94,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Navigation size={20} style={{ color: 'white', transform: 'rotate(45deg)' }} strokeWidth={2.5} />
        </motion.div>
      </div>
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

function GreenButton({ children, onClick, disabled }) {
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
      <PitchHero height={300} />
      <div className="px-6 pt-5 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="font-black text-white leading-[1.05] tracking-[-0.03em] mb-3"
          style={{ fontSize: 'clamp(36px, 9vw, 44px)' }}
        >
          Fotboll när du vill.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15px] leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.52)' }}
        >
          Hitta en match. Gå med direkt. Inga lag behövs.
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
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="text-[11px] font-black tracking-[0.16em] uppercase mb-2.5"
        style={{ color: 'rgba(34,197,94,0.7)' }}
      >
        Live just nu
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-tight tracking-[-0.025em] mb-1.5"
        style={{ fontSize: 'clamp(26px, 7vw, 32px)' }}
      >
        Matcher händer just nu.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-[13.5px] leading-relaxed mb-5"
        style={{ color: 'rgba(255,255,255,0.48)' }}
      >
        Gå med i minuter, inte dagar.
      </motion.p>

      {/* Match card with green glow border */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[20px] overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1.5px solid rgba(34,197,94,0.38)',
          boxShadow: '0 0 32px rgba(34,197,94,0.14), 0 0 0 1px rgba(34,197,94,0.08)',
        }}
      >
        {/* Top color stripe */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #16A34A, #22C55E, #4ADE80)' }} />

        <div className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-black text-white leading-tight">Östermalms IP</p>
              <p className="text-[12.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Tisdag 18:00 · 5 mot 5
              </p>
            </div>
            <span
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              Öppen för alla nivåer
            </span>
          </div>

          {/* Progress bar 6/10 */}
          <div>
            <div className="flex justify-between text-[11.5px] mb-2">
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>Platser fyllda</span>
              <span className="font-black" style={{ color: '#22C55E' }}>6 / 10</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #16A34A, #22C55E)' }}
                initial={{ width: '0%' }}
                animate={{ width: '60%' }}
                transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {/* Avatars */}
          <div className="flex items-center gap-2">
            {AVATAR_LABELS.map((label, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.07, type: 'spring', stiffness: 480, damping: 22 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                style={{ background: AVATAR_COLORS[i], boxShadow: '0 0 0 1.5px rgba(34,197,94,0.3)' }}
              >
                {label}
              </motion.div>
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.78, type: 'spring', stiffness: 480, damping: 22 }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px]"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px dashed rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.4)' }}
            >
              +4
            </motion.div>
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
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.18)', border: '2px solid rgba(34,197,94,0.5)' }}
        >
          <Check className="w-7 h-7" style={{ color: '#22C55E' }} strokeWidth={2.8} />
        </div>
        <div className="text-center">
          <p className="text-[20px] font-black text-white mb-1">Du är inloggad</p>
          <p className="text-[13.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Tryck Nästa för att fortsätta.</p>
        </div>
        <GreenButton onClick={onSuccess}>
          Nästa <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
        </GreenButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-5 pt-6 pb-6">
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="text-[11px] font-black tracking-[0.16em] uppercase mb-2.5"
        style={{ color: 'rgba(34,197,94,0.7)' }}
      >
        Steg 3 av 4
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-tight tracking-[-0.025em] mb-1.5"
        style={{ fontSize: 'clamp(26px, 7vw, 32px)' }}
      >
        Skapa ditt konto.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="text-[13.5px] leading-relaxed mb-6"
        style={{ color: 'rgba(255,255,255,0.48)' }}
      >
        Gratis att komma igång
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
      >
        <LoginModal
          inline
          initialMode="register"
          onSuccess={onSuccess}
          onClose={() => {}}
        />
      </motion.div>
    </div>
  );
}

function LocationSlide({ locGranted }) {
  return (
    <div className="flex flex-col flex-1 px-5 pt-6 pb-4">
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="text-[11px] font-black tracking-[0.16em] uppercase mb-2.5"
        style={{ color: 'rgba(34,197,94,0.7)' }}
      >
        Sista steget
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="font-black text-white leading-tight tracking-[-0.025em] mb-1.5"
        style={{ fontSize: 'clamp(26px, 7vw, 32px)' }}
      >
        Hitta matcher nära dig.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="text-[13.5px] leading-relaxed mb-4"
        style={{ color: 'rgba(255,255,255,0.48)' }}
      >
        AllPlay använder din plats för att visa planer och matcher i närheten. Du kan ändra detta när som helst i inställningarna.
      </motion.p>

      <MapPinAnimation />

      <AnimatePresence>
        {locGranted && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center gap-3 rounded-2xl px-4 py-4 mt-2"
            style={{ background: 'rgba(34,197,94,0.13)', border: '1.5px solid rgba(34,197,94,0.42)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.25)', border: '1.5px solid rgba(34,197,94,0.55)' }}>
              <Check className="w-4 h-4 text-[#22C55E]" strokeWidth={3} />
            </div>
            <div>
              <p className="text-[14px] font-black text-[#22C55E]">Plats tillåten!</p>
              <p className="text-[11.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Du är redo att spela.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function OnboardingModal() {
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth();
  const [open, setOpen]         = useState(false);
  const [slide, setSlide]       = useState(0);
  const [dir, setDir]           = useState(1);
  const [locGranted, setLocGranted] = useState(false);
  const [ref_] = useState(() => new URLSearchParams(window.location.search).get('ref'));

  // Initial show
  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored === 'true') return;
    if (stored === 'needs_location') {
      setSlide(3);
      const t = setTimeout(() => setOpen(true), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setOpen(true), 450);
    return () => clearTimeout(t);
  }, []);

  // Handle OAuth return: if open and user authenticated before reaching location slide
  useEffect(() => {
    if (!open || isAuthLoading) return;
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored && isAuthenticated && slide < 3) {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'needs_location');
      setDir(1);
      setSlide(3);
    }
  }, [open, isAuthenticated, isAuthLoading, slide]);

  // Replay from Settings
  useEffect(() => {
    const handler = () => {
      setSlide(0); setDir(1); setLocGranted(false);
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

  const handleAuthSuccess = useCallback(() => {
    triggerHaptic('success');
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored !== 'true') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'needs_location');
    }
    setDir(1);
    setSlide(3);
  }, []);

  const handleLocationRequest = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => { setLocGranted(true); setTimeout(complete, 900); },
        () => complete()
      );
    } else {
      complete();
    }
  }, [complete]);

  const goTo = useCallback((n) => { setDir(1); setSlide(n); }, []);

  if (!open) return null;

  const cur = SLIDES[slide];
  const showFooter = cur.id !== 'auth' && !(cur.id === 'location' && locGranted);

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
          <div className="hidden sm:block absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ y: 56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 56, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative z-10 flex flex-col w-full h-[100dvh] sm:w-[420px] sm:h-auto sm:max-h-[90vh] sm:rounded-[28px] overflow-hidden"
            style={{ background: '#070D09', boxShadow: '0 -20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            {/* Top green accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px] z-20"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #22C55E 40%, #4ADE80 60%, transparent 100%)' }} />

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Progress dots */}
            <div
              className="relative z-10 flex-shrink-0 flex items-center justify-center gap-2.5"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: 10 }}
            >
              {SLIDES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === slide ? 10 : 7,
                    height: i === slide ? 10 : 7,
                    backgroundColor: i < slide ? '#2BA84A' : i === slide ? '#22C55E' : 'rgba(255,255,255,0.22)',
                  }}
                  style={{ borderRadius: '50%', flexShrink: 0 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* Slide content area */}
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
                  {cur.id === 'hero'     && <HeroSlide />}
                  {cur.id === 'proof'    && <ProofSlide />}
                  {cur.id === 'auth'     && (
                    <AuthSlide
                      isAuthenticated={isAuthenticated}
                      isAuthLoading={isAuthLoading}
                      onSuccess={handleAuthSuccess}
                    />
                  )}
                  {cur.id === 'location' && <LocationSlide locGranted={locGranted} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer CTA */}
            {showFooter && (
              <div
                className="relative z-10 flex-shrink-0 flex flex-col gap-2 px-5 pt-2 border-t border-white/[0.06]"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
              >
                {cur.id === 'hero' && (
                  <GreenButton onClick={() => goTo(1)}>
                    Kom igång <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                  </GreenButton>
                )}

                {cur.id === 'proof' && (
                  <GreenButton onClick={() => goTo(2)}>
                    Nästa <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                  </GreenButton>
                )}

                {cur.id === 'location' && (
                  <>
                    <GreenButton onClick={handleLocationRequest}>
                      Tillåt plats
                    </GreenButton>
                    <button
                      onClick={complete}
                      className="w-full h-11 font-semibold text-[13px] rounded-xl transition-colors"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Inte nu
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Users, Bell, ChevronRight, Check,
  Navigation, LogIn, Zap, Star, Swords,
} from 'lucide-react';
import { LoginModal } from '@/components/supabase';
import { base44 } from '@/api/base44Client';

export const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'welcome',
    eyebrow: 'Välkommen',
    title: 'Fotboll på riktigt,\nnär du vill.',
    subtitle: 'Hitta matcher, bygg lag och möt spelare nära dig.',
    accent: '#34C257',
    features: [
      { icon: MapPin, text: 'Hitta matcher nära dig',  accent: '#34C257' },
      { icon: Users,  text: 'Bygg lag med vänner',     accent: '#C4B5FD' },
      { icon: Swords, text: 'Tävla och utvecklas',     accent: '#FDBA74' },
    ],
  },
  {
    id: 'how-it-works',
    eyebrow: 'Så funkar det',
    title: 'Tre steg\ntill avspark.',
    subtitle: 'Från anmälan till kick-off — smidigt hela vägen.',
    accent: '#FDBA74',
    steps: [
      { n: '01', label: 'Hitta en plan',      desc: 'Fotbollsplaner nära dig på kartan',    icon: MapPin, accent: '#34C257' },
      { n: '02', label: 'Gå med i en match',  desc: 'Välj nivå och anmäl dig direkt',       icon: Zap,    accent: '#FDBA74' },
      { n: '03', label: 'Spela & utvecklas',  desc: 'Bygg din profil med stats och badges', icon: Star,   accent: '#FDE68A' },
    ],
  },
  {
    id: 'age',
    eyebrow: 'Snabb fråga',
    title: 'Hur gammal\när du?',
    subtitle: 'Frivilligt — hjälper oss visa rätt matcher för dig.',
    accent: '#34C257',
    isAgeScreen: true,
  },
  {
    id: 'permissions',
    eyebrow: 'Sista steget',
    title: 'Tillåt för\nbästa upplevelsen.',
    subtitle: 'Du kan ändra när som helst i enhetens inställningar.',
    accent: '#FDBA74',
    isPermissionScreen: true,
  },
];

// ─── Pitch graphic (Slide 1 hero) ─────────────────────────────────────────────

const TEAM_A = [
  { cx: 8,  cy: 50 },
  { cx: 22, cy: 22 }, { cx: 22, cy: 50 }, { cx: 22, cy: 78 },
  { cx: 42, cy: 34 }, { cx: 42, cy: 66 },
];
const TEAM_B = [
  { cx: 92, cy: 50 },
  { cx: 78, cy: 22 }, { cx: 78, cy: 50 }, { cx: 78, cy: 78 },
  { cx: 58, cy: 34 }, { cx: 58, cy: 66 },
];

function PitchGraphic({ accent }) {
  const allPlayers = [
    ...TEAM_A.map((p) => ({ ...p, team: 'a' })),
    ...TEAM_B.map((p) => ({ ...p, team: 'b' })),
  ];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '172px' }}>
      {/* SVG pitch markings */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.6 }}
        aria-hidden
      >
        {/* Grass stripes */}
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i} x={i * 10} y={0} width={10} height={100}
            fill={i % 2 === 0 ? 'rgba(10,28,16,1)' : 'rgba(7,20,11,1)'}
          />
        ))}
        {/* Outer border */}
        <rect x="2" y="2" width="96" height="96" fill="none"
          stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        {/* Halfway line */}
        <line x1="50" y1="2" x2="50" y2="98"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        {/* Center circle */}
        <circle cx="50" cy="50" r="17"
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        {/* Center spot */}
        <circle cx="50" cy="50" r="1.4" fill="rgba(255,255,255,0.35)" />
        {/* Penalty boxes */}
        <rect x="2" y="26" width="14" height="48"
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <rect x="84" y="26" width="14" height="48"
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        {/* Goal areas */}
        <rect x="2" y="38" width="6" height="24"
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <rect x="92" y="38" width="6" height="24"
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      </svg>

      {/* Pulsing accent ring around center */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.28, 0.10, 0.28] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute rounded-full border pointer-events-none"
        style={{
          left: '50%', top: '50%',
          width: '34%', aspectRatio: '1',
          transform: 'translate(-50%, -50%)',
          borderColor: `${accent}70`,
        }}
        aria-hidden
      />

      {/* Player dots */}
      {allPlayers.map((p, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, (i % 2 === 0 ? 1 : -1) * (1.5 + (i % 3) * 0.8), 0],
            y: [0, (i % 3 === 0 ? 1 : -1) * 1.2, 0],
          }}
          transition={{
            duration: 2.2 + i * 0.35,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.18,
          }}
          className="absolute rounded-full border"
          style={{
            left: `${p.cx}%`,
            top:  `${p.cy}%`,
            width: '10px', height: '10px',
            transform: 'translate(-50%, -50%)',
            background: p.team === 'a' ? '#2BA84A' : '#60A5FA',
            borderColor: p.team === 'a' ? 'rgba(43,168,74,0.6)' : 'rgba(96,165,250,0.6)',
            boxShadow: p.team === 'a'
              ? '0 0 5px rgba(43,168,74,0.55)'
              : '0 0 5px rgba(96,165,250,0.55)',
          }}
          aria-hidden
        />
      ))}

      {/* Gradient vignette */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(7,15,10,0.6) 80%)',
      }} />
      <div className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none" aria-hidden style={{
        background: 'linear-gradient(to bottom, transparent, rgba(7,15,10,0.85) 70%, rgba(7,15,10,1))',
      }} />
    </div>
  );
}

// ─── Slide 2 — connected step timeline ───────────────────────────────────────

function HowItWorksContent({ steps }) {
  return (
    <div className="relative flex flex-col gap-0 mt-2">
      {/* Vertical connector */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden
        className="absolute left-[23px] pointer-events-none"
        style={{
          top: '28px', bottom: '28px', width: '1px',
          transformOrigin: 'top',
          background: 'linear-gradient(to bottom, rgba(52,194,87,0.35), rgba(253,186,116,0.35), rgba(253,230,138,0.25))',
        }}
      />

      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-start gap-4 pb-5 last:pb-0"
          >
            {/* Step bubble */}
            <div
              className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative z-10 gap-0.5"
              style={{
                background: `${step.accent}12`,
                border: `1px solid ${step.accent}35`,
              }}
            >
              <span className="text-[9px] font-black tabular-nums leading-none" style={{ color: `${step.accent}90` }}>
                {step.n}
              </span>
              <Icon className="w-[15px] h-[15px]" style={{ color: step.accent }} strokeWidth={2.3} />
            </div>

            {/* Copy */}
            <div className="pt-2 min-w-0">
              <h3 className="text-[15px] font-bold text-white/92 leading-tight">{step.label}</h3>
              <p className="text-[12.5px] text-white/48 mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Slide 3 — age inputs ─────────────────────────────────────────────────────

function AgeInputs({ birthDay, setBirthDay, birthMonth, setBirthMonth, birthYear, setBirthYear, ageError, setAgeError }) {
  const monthRef = useRef(null);
  const yearRef  = useRef(null);

  const handleDay = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setBirthDay(clean);
    setAgeError('');
    if (clean.length === 2) monthRef.current?.focus();
  };

  const handleMonth = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setBirthMonth(clean);
    setAgeError('');
    if (clean.length === 2) yearRef.current?.focus();
  };

  const handleYear = (v) => {
    setBirthYear(v.replace(/\D/g, '').slice(0, 4));
    setAgeError('');
  };

  const fields = [
    { label: 'Dag',   ph: 'DD',   val: birthDay,   set: handleDay,   ref: undefined },
    { label: 'Månad', ph: 'MM',   val: birthMonth, set: handleMonth, ref: monthRef  },
    { label: 'År',    ph: 'ÅÅÅÅ', val: birthYear,  set: handleYear,  ref: yearRef   },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        {fields.map((f, i) => (
          <div key={i}>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/40 mb-2 text-center">
              {f.label}
            </p>
            <input
              ref={f.ref}
              type="number"
              inputMode="numeric"
              placeholder={f.ph}
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
              className="w-full h-[68px] rounded-2xl text-white text-[24px] font-black text-center tabular-nums outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(43,168,74,0.55)';
                e.target.style.background  = 'rgba(43,168,74,0.07)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                e.target.style.background  = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {ageError && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-[12.5px] text-[#FCA5A5] px-3 py-2.5 rounded-xl leading-snug"
            style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            {ageError}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-[11px] text-white/35 text-center leading-relaxed">
        Genom att fortsätta godkänner du vår{' '}
        <a
          href="https://allplayuf.se/legalpolicy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#86EFAC] underline underline-offset-2 hover:text-white"
        >
          användarpolicy
        </a>
      </p>
    </div>
  );
}

// ─── Slide 4 — permission card ────────────────────────────────────────────────

function PermissionCard({ icon: Icon, label, desc, accent, granted, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="relative w-full overflow-hidden rounded-2xl text-left"
      style={{
        background: granted ? `${accent}12` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${granted ? `${accent}45` : 'rgba(255,255,255,0.09)'}`,
        transition: 'background 0.4s ease, border-color 0.4s ease',
      }}
    >
      {/* Fill sweep on grant */}
      <AnimatePresence>
        {granted && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(90deg, ${accent}10 0%, ${accent}06 100%)` }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-center gap-3.5 px-4 py-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: granted ? `${accent}20` : `${accent}10`,
            border: `1px solid ${granted ? `${accent}50` : `${accent}22`}`,
            transition: 'background 0.3s ease, border-color 0.3s ease',
          }}
        >
          <AnimatePresence mode="wait">
            {granted ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <Check className="w-5 h-5" style={{ color: accent }} strokeWidth={2.8} />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ scale: 1 }} exit={{ scale: 0 }}>
                <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={2.2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-white/92 leading-tight">{label}</p>
          <p className="text-[12px] text-white/50 mt-0.5 leading-snug">{desc}</p>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          {granted ? (
            <span className="text-[12px] font-bold" style={{ color: accent }}>Tillåtet</span>
          ) : (
            <ChevronRight className="w-4 h-4 text-white/25" />
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};

export function OnboardingModal() {
  const [isOpen, setIsOpen]         = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection]   = useState(1);
  const [permissions, setPermissions] = useState({ location: false, notifications: false });
  const [birthDay,   setBirthDay]   = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear,  setBirthYear]  = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageError, setAgeError]     = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingReferral, setIsProcessingReferral] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
      const t = setTimeout(() => setIsOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && !isProcessingReferral) {
      setIsProcessingReferral(true);
      (async () => {
        try {
          const isAuth = await base44.auth.isAuthenticated();
          if (isAuth) {
            const user = await base44.auth.me();
            if (!user.referred_by) {
              await base44.functions.invoke('auth/handleReferralSignup', { userId: user.id, referralCode: ref });
            }
          } else {
            sessionStorage.setItem('pending_referral_code', ref);
          }
        } catch { /* ignore */ }
        setIsProcessingReferral(false);
      })();
    }
  }, [isProcessingReferral]);

  const handleComplete = async () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        await base44.auth.updateMe({ onboarding_completed: true });
        const pendingDob = localStorage.getItem('allplay_pending_dob');
        if (pendingDob) {
          base44.functions.invoke('verifyAge', { date_of_birth: pendingDob }).catch(() => {});
          localStorage.removeItem('allplay_pending_dob');
        }
        const pending = sessionStorage.getItem('pending_referral_code');
        if (pending) {
          const user = await base44.auth.me();
          await base44.functions.invoke('auth/handleReferralSignup', { userId: user.id, referralCode: pending }).catch(() => {});
          sessionStorage.removeItem('pending_referral_code');
        }
      }
    } catch { /* ignore */ }
    setIsOpen(false);
  };

  const verifyAge = () => {
    if (!birthDay && !birthMonth && !birthYear) {
      setAgeVerified(true);
      return true;
    }
    const day   = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);
    const year  = parseInt(birthYear, 10);
    if (
      isNaN(day) || isNaN(month) || isNaN(year) ||
      day < 1 || day > 31 || month < 1 || month > 12 ||
      year < 1900 || year > new Date().getFullYear()
    ) {
      setAgeError('Ogiltigt datum. Kontrollera dag, månad och år.');
      return false;
    }
    const birthDate = new Date(year, month - 1, day);
    const today     = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 13) {
      setAgeError('Du måste vara minst 13 år för att använda AllPlay.');
      return false;
    }
    const dob = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    localStorage.setItem('allplay_pending_dob', dob);
    setAgeVerified(true);
    return true;
  };

  const handleNext = () => {
    const slide = SLIDES[currentSlide];
    if (slide.isAgeScreen && !ageVerified) {
      if (!verifyAge()) return;
    }
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide((p) => p + 1);
    } else {
      handleComplete();
    }
  };

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions((p) => ({ ...p, location: true })),
        () => {}
      );
    }
  };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') setPermissions((p) => ({ ...p, notifications: true }));
    }
  };

  if (!isOpen && !showLoginModal) return null;

  const slide  = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const accent = slide.accent;
  const showAge = slide.isAgeScreen;
  const ctaLabel = showAge && (birthDay || birthMonth || birthYear)
    ? 'Verifiera & fortsätt'
    : showAge
    ? 'Hoppa över'
    : isLast
    ? null
    : 'Nästa';

  return (
    <>
      <AnimatePresence>
        {isOpen && !showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          >
            {/* Desktop backdrop */}
            <div className="hidden sm:block absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Panel */}
            <motion.div
              initial={{ y: 32, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 32, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 flex flex-col overflow-hidden
                         w-full h-[100dvh]
                         sm:w-[440px] sm:h-auto sm:max-h-[88vh] sm:rounded-[28px] sm:border sm:border-white/[0.07]"
              style={{
                background: 'radial-gradient(150% 100% at 50% -10%, #0E2718 0%, #090F0C 55%, #060C09 100%)',
                boxShadow: '0 -32px 80px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              {/* Ambient glow — slides with accent color */}
              <motion.div
                key={`orb-${currentSlide}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.55, 0.75, 0.55] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute pointer-events-none"
                style={{
                  top: '-15%', right: '-20%',
                  width: '70%', height: '50%',
                  borderRadius: '50%',
                  filter: 'blur(80px)',
                  background: `radial-gradient(circle, ${accent}45 0%, ${accent}10 50%, transparent 70%)`,
                }}
                aria-hidden
              />

              {/* Noise texture */}
              <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                }}
                aria-hidden
              />

              {/* Top hairline */}
              <div
                className="absolute inset-x-0 top-0 h-px pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)' }}
                aria-hidden
              />

              {/* ── Progress bar ── */}
              <div
                className="relative z-10 flex-shrink-0 flex items-center justify-between gap-1.5 px-5 sm:px-6"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: '12px' }}
              >
                {/* Segmented track */}
                <div className="flex-1 flex items-center gap-1.5">
                  {SLIDES.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-[3px] rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.09)' }}
                    >
                      <motion.div
                        initial={false}
                        animate={{ width: i <= currentSlide ? '100%' : '0%' }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ background: i === currentSlide ? accent : `${accent}70` }}
                      />
                    </div>
                  ))}
                </div>

                {currentSlide > 0 && (
                  <button
                    onClick={handleComplete}
                    className="text-[11.5px] font-semibold text-white/45 hover:text-white/80 px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors flex-shrink-0 ml-1"
                  >
                    Hoppa över
                  </button>
                )}
              </div>

              {/* ── Slide body ── */}
              <div className="relative z-10 flex-1 min-h-0 overflow-y-auto">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col"
                  >
                    {/* Pitch hero — welcome only */}
                    {slide.id === 'welcome' && <PitchGraphic accent={accent} />}

                    {/* Text block */}
                    <div className={`px-5 sm:px-6 ${slide.id === 'welcome' ? 'pt-1' : 'pt-6'}`}>
                      {/* Eyebrow */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.35 }}
                        className="flex items-center gap-2 mb-3"
                      >
                        <div
                          className="h-[1px] w-5 rounded-full"
                          style={{ background: `${accent}80` }}
                          aria-hidden
                        />
                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase"
                          style={{ color: `${accent}CC` }}>
                          {slide.eyebrow}
                        </span>
                      </motion.div>

                      {/* Title — word-by-word stagger */}
                      <div className="mb-2.5 overflow-hidden">
                        <h2 className="text-[30px] sm:text-[34px] font-black text-white leading-[1.05] tracking-[-0.025em] whitespace-pre-line">
                          {slide.title.split(' ').map((word, wi) => (
                            <motion.span
                              key={wi}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.08 + wi * 0.055, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                              className="inline-block"
                              style={{ marginRight: '0.28em' }}
                            >
                              {word}
                            </motion.span>
                          ))}
                        </h2>
                      </div>

                      {/* Subtitle */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.22, duration: 0.4 }}
                        className="text-[14px] text-white/52 leading-relaxed mb-5"
                      >
                        {slide.subtitle}
                      </motion.p>
                    </div>

                    {/* Slide-specific content */}
                    <div className="px-5 sm:px-6 pb-4">

                      {/* WELCOME — feature list */}
                      {slide.id === 'welcome' && slide.features && (
                        <div className="space-y-2">
                          {slide.features.map((f, i) => {
                            const Icon = f.icon;
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -14 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.18 + i * 0.08, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                                className="flex items-center gap-3 py-3 px-3.5 rounded-2xl"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                }}
                              >
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: `${f.accent}18`,
                                    border: `1px solid ${f.accent}35`,
                                  }}
                                >
                                  <Icon className="w-[17px] h-[17px]" style={{ color: f.accent }} strokeWidth={2.4} />
                                </div>
                                <span className="text-[14.5px] font-semibold text-white/88">{f.text}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* HOW IT WORKS */}
                      {slide.id === 'how-it-works' && slide.steps && (
                        <HowItWorksContent steps={slide.steps} />
                      )}

                      {/* AGE */}
                      {slide.isAgeScreen && (
                        <AgeInputs
                          birthDay={birthDay}     setBirthDay={setBirthDay}
                          birthMonth={birthMonth} setBirthMonth={setBirthMonth}
                          birthYear={birthYear}   setBirthYear={setBirthYear}
                          ageError={ageError}     setAgeError={setAgeError}
                        />
                      )}

                      {/* PERMISSIONS */}
                      {slide.isPermissionScreen && (
                        <div className="space-y-2.5">
                          <PermissionCard
                            icon={Navigation}
                            label="Plats"
                            desc="Hitta matcher och planer nära dig"
                            accent="#34C257"
                            granted={permissions.location}
                            onClick={requestLocation}
                          />
                          <PermissionCard
                            icon={Bell}
                            label="Notiser"
                            desc="Påminnelser om matcher och inbjudningar"
                            accent="#FDBA74"
                            granted={permissions.notifications}
                            onClick={requestNotifications}
                          />
                        </div>
                      )}

                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── Footer CTA ── */}
              <div
                className="relative z-10 flex-shrink-0 flex flex-col gap-2.5 px-5 sm:px-6 pt-2"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 18px)' }}
              >
                {isLast ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setIsOpen(false); setShowLoginModal(true); }}
                      className="w-full h-[52px] rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)',
                        boxShadow: '0 8px 28px rgba(43,168,74,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
                      }}
                    >
                      <LogIn className="w-4 h-4" strokeWidth={2.5} />
                      Logga in / Skapa konto
                    </motion.button>
                    <button
                      onClick={handleNext}
                      className="w-full h-11 rounded-xl text-white/52 hover:text-white/80 font-semibold text-[13px] hover:bg-white/[0.04] transition-colors"
                    >
                      Fortsätt som gäst
                    </button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="w-full h-[52px] rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(180deg, ${accent} 0%, ${accent}E0 55%, ${accent}A0 100%)`,
                      boxShadow: `0 8px 28px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.22)`,
                    }}
                  >
                    <span>{ctaLabel}</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                  </motion.button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          setIsOpen(false);
        }}
      />
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Bell, ChevronRight, Check, Navigation, LogIn, Zap, Star, Swords } from 'lucide-react';
import { LoginModal } from '@/components/supabase';
import { base44 } from '@/api/base44Client';
import { triggerHaptic } from '@/components/utils/motionTokens';

export const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';
export const ONBOARDING_EVENT = 'allplay:show-onboarding';

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'welcome',
    label: 'Välkommen till AllPlay',
    title: 'Fotboll när\ndu vill.',
    sub: 'Hitta matcher, bygg lag och möt spelare nära dig.',
  },
  {
    id: 'how',
    label: 'Så funkar det',
    title: 'Redo på\ntre steg.',
    sub: 'Från anmälan till avspark — smidigt hela vägen.',
    steps: [
      { n: '01', head: 'Hitta en plan',     body: 'Se fotbollsplaner nära dig på kartan',  color: '#22C55E' },
      { n: '02', head: 'Gå med i en match', body: 'Välj nivå och anmäl dig direkt',        color: '#34D399' },
      { n: '03', head: 'Spela & väx',       body: 'Bygg din profil med stats och badges',  color: '#6EE7B7' },
    ],
  },
  {
    id: 'age',
    label: 'Snabb fråga',
    title: 'Hur gammal\när du?',
    sub: 'Frivilligt — hjälper oss visa rätt matcher.',
    isAge: true,
  },
  {
    id: 'perms',
    label: 'Sista steget',
    title: 'Tillåt för\nbästa upplevelsen.',
    sub: 'Ändra när som helst i enhetens inställningar.',
    isPerms: true,
  },
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

// ─── HERO 1: Top-down tactical pitch view ─────────────────────────────────────

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
    <div className="relative w-full overflow-hidden" style={{ height: 230 }}>
      {/* Pitch SVG */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        {/* Grass stripes */}
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 10} y={0} width={10} height={100}
            fill={i % 2 === 0 ? '#0C1E10' : '#091509'} />
        ))}
        {/* Pitch lines */}
        <rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="1.4" fill="rgba(255,255,255,0.3)" />
        {/* Penalty areas */}
        <rect x="28" y="3" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <rect x="28" y="79" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        {/* Goal boxes */}
        <rect x="38" y="3" width="24" height="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <rect x="38" y="89" width="24" height="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      </svg>

      {/* Green center glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 110, height: 110,
          background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 70%)',
        }}
      />

      {/* Green team */}
      {GREEN_TEAM.map((p, i) => (
        <motion.div
          key={`g${i}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: 11, height: 11,
            transform: 'translate(-50%,-50%)',
            background: '#22C55E',
            boxShadow: '0 0 7px rgba(34,197,94,0.9)',
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.2 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
        />
      ))}

      {/* White team */}
      {WHITE_TEAM.map((p, i) => (
        <motion.div
          key={`w${i}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: 10, height: 10,
            transform: 'translate(-50%,-50%)',
            background: 'rgba(255,255,255,0.55)',
            boxShadow: '0 0 5px rgba(255,255,255,0.4)',
          }}
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.14 }}
        />
      ))}

      {/* Football at center */}
      <div
        className="absolute"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.7))' }}
        >
          <Ball size={48} />
        </motion.div>
      </div>

      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 45%, rgba(7,13,9,0.75) 100%)',
      }} />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, transparent, #070D09)',
      }} />
    </div>
  );
}

// ─── HERO 2: Animated match card ─────────────────────────────────────────────

function MatchCardHero() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const delays = [400, 800, 1150, 1500];
    const timers = delays.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="px-5 pt-6 pb-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.10)' }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg, #16A34A, #22C55E, #4ADE80)' }} />
        <div className="p-4 space-y-3">
          <AnimatePresence>
            {step >= 1 && (
              <motion.div key="top" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}
                className="flex items-start justify-between">
                <div>
                  <p className="text-[16px] font-black text-white leading-tight">Södermalm IP</p>
                  <p className="text-[12px] text-white/45 mt-0.5">Tisdag 18:00 · 5 mot 5</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(34,197,94,0.18)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.35)' }}>
                  Öppen
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 2 && (
              <motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-white/40">Platser</span>
                  <span className="font-bold text-[#22C55E]">4 / 10</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  <motion.div className="h-full rounded-full bg-[#22C55E]"
                    initial={{ width: '0%' }}
                    animate={{ width: '40%' }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 3 && (
              <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 500, damping: 22 }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: `hsl(${140 + i * 15},60%,35%)` }}>
                    {['M', 'J', 'K', 'A'][i]}
                  </motion.div>
                ))}
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white/40"
                     style={{ background: 'rgba(255,255,255,0.07)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                  +6
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 4 && (
              <motion.button key="cta" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="w-full h-10 rounded-xl font-black text-[13.5px] text-white"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 16px rgba(34,197,94,0.35)' }}>
                Gå med i matchen →
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Age inputs ───────────────────────────────────────────────────────────────

function AgeInputs({ day, setDay, month, setMonth, year, setYear, error, setError }) {
  const mRef = useRef(null);
  const yRef = useRef(null);

  const fields = [
    {
      label: 'Dag', ph: 'DD', val: day,
      set: (v) => { const c = v.replace(/\D/g, '').slice(0, 2); setDay(c); setError(''); if (c.length === 2) mRef.current?.focus(); },
    },
    {
      label: 'Månad', ph: 'MM', val: month, ref: mRef,
      set: (v) => { const c = v.replace(/\D/g, '').slice(0, 2); setMonth(c); setError(''); if (c.length === 2) yRef.current?.focus(); },
    },
    {
      label: 'År', ph: 'ÅÅÅÅ', val: year, ref: yRef,
      set: (v) => { setYear(v.replace(/\D/g, '').slice(0, 4)); setError(''); },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Ball icon */}
      <div className="flex justify-center mb-2">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Ball size={48} />
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {fields.map((f, i) => (
          <div key={i}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/35 mb-2 text-center">{f.label}</p>
            <input
              ref={f.ref}
              type="number"
              inputMode="numeric"
              placeholder={f.ph}
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
              className="w-full h-[60px] rounded-2xl text-white text-[22px] font-black text-center tabular-nums outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.10)' }}
              onFocus={(e) => { e.target.style.borderColor = '#22C55E'; e.target.style.background = 'rgba(34,197,94,0.09)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[12.5px] text-red-300 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.28)' }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-[11px] text-white/30 text-center">
        Godkänner du vår{' '}
        <a href="https://allplayuf.se/legalpolicy" target="_blank" rel="noopener noreferrer"
          className="text-[#4ADE80] underline underline-offset-2">
          användarpolicy
        </a>
      </p>
    </div>
  );
}

// ─── Permission card ──────────────────────────────────────────────────────────

function PermCard({ icon: Icon, title, desc, color, granted, onTap }) {
  const wasGranted = useRef(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (granted && !wasGranted.current) {
      triggerHaptic('success');
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }
    wasGranted.current = granted;
  }, [granted]);

  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.975 }}
      className="relative w-full rounded-2xl text-left overflow-hidden"
      style={{
        background: granted ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${granted ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.09)'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      {/* Pulse ring */}
      <AnimatePresence>
        {pulse && (
          <motion.span
            key="ring"
            className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
            style={{ borderColor: color }}
            initial={{ scale: 0.88, opacity: 0.85 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Left color stripe */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: granted ? color : 'rgba(255,255,255,0.12)' }} />

      <div className="flex items-center gap-4 px-4 py-4 pl-6">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: granted ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.07)',
            border: `1.5px solid ${granted ? 'rgba(34,197,94,0.55)' : 'rgba(255,255,255,0.12)'}`,
            transition: 'all 0.3s',
          }}
        >
          <AnimatePresence mode="wait">
            {granted ? (
              <motion.div key="chk" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                <Check className="w-6 h-6 text-[#22C55E]" strokeWidth={2.8} />
              </motion.div>
            ) : (
              <motion.div key="ico" exit={{ scale: 0, transition: { duration: 0.1 } }}>
                <Icon className="w-6 h-6" style={{ color }} strokeWidth={2.1} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-white leading-tight">{title}</p>
          <p className="text-[12.5px] text-white/45 mt-0.5 leading-snug">{desc}</p>
        </div>

        {/* Status */}
        {granted ? (
          <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            className="text-[12px] font-black text-[#22C55E] flex-shrink-0">
            Tillåtet
          </motion.span>
        ) : (
          <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0" />
        )}
      </div>
    </motion.button>
  );
}

// ─── Slide transitions ────────────────────────────────────────────────────────

const variants = {
  enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:  (d) => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
};

// ─── Main modal ───────────────────────────────────────────────────────────────

export function OnboardingModal() {
  const [open, setOpen]           = useState(false);
  const [slide, setSlide]         = useState(0);
  const [dir, setDir]             = useState(1);
  const [perms, setPerms]         = useState({ loc: false, notif: false });
  const [day, setDay]             = useState('');
  const [month, setMonth]         = useState('');
  const [year, setYear]           = useState('');
  const [ageOk, setAgeOk]         = useState(false);
  const [ageErr, setAgeErr]       = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [ref_]                    = useState(() => new URLSearchParams(window.location.search).get('ref'));

  // First-visit show
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 450);
      return () => clearTimeout(t);
    }
  }, []);

  // "Show again" event from Settings
  useEffect(() => {
    const handler = () => {
      setSlide(0); setDir(1);
      setPerms({ loc: false, notif: false });
      setDay(''); setMonth(''); setYear('');
      setAgeOk(false); setAgeErr('');
      setOpen(true);
    };
    window.addEventListener(ONBOARDING_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_EVENT, handler);
  }, []);

  // Referral code
  useEffect(() => {
    if (!ref_) return;
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (!user.referred_by) await base44.functions.invoke('auth/handleReferralSignup', { userId: user.id, referralCode: ref_ });
        } else {
          sessionStorage.setItem('pending_referral_code', ref_);
        }
      } catch { /**/ }
    })();
  }, [ref_]);

  const complete = async () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        await base44.auth.updateMe({ onboarding_completed: true });
        const dob = localStorage.getItem('allplay_pending_dob');
        if (dob) { base44.functions.invoke('verifyAge', { date_of_birth: dob }).catch(() => {}); localStorage.removeItem('allplay_pending_dob'); }
        const pending = sessionStorage.getItem('pending_referral_code');
        if (pending) { const u = await base44.auth.me(); await base44.functions.invoke('auth/handleReferralSignup', { userId: u.id, referralCode: pending }).catch(() => {}); sessionStorage.removeItem('pending_referral_code'); }
      }
    } catch { /**/ }
    setOpen(false);
  };

  const checkAge = () => {
    if (!day && !month && !year) { setAgeOk(true); return true; }
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      setAgeErr('Ogiltigt datum — kontrollera dag, månad och år.'); return false;
    }
    const bd = new Date(y, m - 1, d);
    let age = new Date().getFullYear() - bd.getFullYear();
    const dm = new Date().getMonth() - bd.getMonth();
    if (dm < 0 || (dm === 0 && new Date().getDate() < bd.getDate())) age--;
    if (age < 13) { setAgeErr('Du måste vara minst 13 år för att använda AllPlay.'); return false; }
    localStorage.setItem('allplay_pending_dob', `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    setAgeOk(true); return true;
  };

  const next = () => {
    const cur = SLIDES[slide];
    if (cur.isAge && !ageOk && !checkAge()) return;
    if (slide < SLIDES.length - 1) { setDir(1); setSlide(p => p + 1); }
    else complete();
  };

  const openLogin = () => {
    triggerHaptic('medium');
    setOpen(false);
    setTimeout(() => setShowLogin(true), 120);
  };

  if (!open && !showLogin) return null;

  const cur = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;
  const allGranted = perms.loc && perms.notif;

  const ctaText = cur.isAge
    ? ((day || month || year) ? 'Verifiera & fortsätt' : 'Hoppa över')
    : 'Nästa';

  return (
    <>
      <AnimatePresence>
        {open && !showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          >
            {/* Backdrop */}
            <div className="hidden sm:block absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Sheet */}
            <motion.div
              initial={{ y: 56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 56, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="relative z-10 flex flex-col w-full h-[100dvh] sm:w-[420px] sm:h-auto sm:max-h-[90vh] sm:rounded-[28px] overflow-hidden"
              style={{
                background: '#070D09',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              {/* Top green accent line */}
              <div className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent 0%, #22C55E 40%, #4ADE80 60%, transparent 100%)' }} />

              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Progress */}
              <div
                className="relative z-10 flex-shrink-0 flex items-center gap-2 px-5"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: 12 }}
              >
                {SLIDES.map((_, i) => (
                  <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.10)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: i === slide ? '#22C55E' : 'rgba(34,197,94,0.5)' }}
                      initial={false}
                      animate={{ width: i <= slide ? '100%' : '0%' }}
                      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                ))}
                {slide > 0 && (
                  <button
                    onClick={complete}
                    className="text-[12px] font-semibold text-white/30 hover:text-white/60 px-2 py-1 ml-1 rounded-lg transition-colors flex-shrink-0"
                  >
                    Hoppa över
                  </button>
                )}
              </div>

              {/* Slide content */}
              <div className="relative z-10 flex-1 min-h-0 overflow-y-auto">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={slide}
                    custom={dir}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col min-h-full"
                  >
                    {/* Slide-specific hero */}
                    {cur.id === 'welcome' && <PitchHero />}
                    {cur.id === 'how' && <MatchCardHero />}

                    {/* Text */}
                    <div className={`px-5 ${cur.id === 'welcome' ? 'pt-4' : cur.id === 'how' ? 'pt-5' : 'pt-8'}`}>
                      <p className="text-[11px] font-black tracking-[0.16em] uppercase mb-2.5"
                        style={{ color: 'rgba(34,197,94,0.7)' }}>
                        {cur.label}
                      </p>
                      <h2
                        className="font-black text-white whitespace-pre-line leading-[1.06] tracking-[-0.03em] mb-2"
                        style={{ fontSize: 'clamp(28px, 7.5vw, 34px)' }}
                      >
                        {cur.title}
                      </h2>
                      <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.48)' }}>
                        {cur.sub}
                      </p>
                    </div>

                    {/* Slide-specific body */}
                    <div className="px-5 pb-6">

                      {/* Welcome: stat pills */}
                      {cur.id === 'welcome' && (
                        <div className="space-y-2.5">
                          {[
                            { icon: MapPin,  label: 'Matcher nära dig',    color: '#22C55E' },
                            { icon: Users,   label: 'Bygg lag med vänner', color: '#34D399' },
                            { icon: Swords,  label: 'Tävla och utvecklas', color: '#6EE7B7' },
                          ].map((f, i) => {
                            const Icon = f.icon;
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -14 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.14 + i * 0.09, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                                className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.09)',
                                }}
                              >
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.38)' }}
                                >
                                  <Icon className="w-[18px] h-[18px]" style={{ color: f.color }} strokeWidth={2.2} />
                                </div>
                                <span className="text-[14px] font-semibold text-white/88">{f.label}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* How: steps */}
                      {cur.id === 'how' && cur.steps && (
                        <div className="space-y-2.5">
                          {cur.steps.map((s, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.12 + i * 0.09, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                              className="flex items-center gap-4 rounded-2xl px-4 py-4"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                            >
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-[18px]"
                                style={{ background: 'rgba(34,197,94,0.16)', border: '1px solid rgba(34,197,94,0.35)', color: s.color }}
                              >
                                {s.n}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-white leading-tight">{s.head}</p>
                                <p className="text-[12px] text-white/45 mt-0.5 leading-snug">{s.body}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Age */}
                      {cur.isAge && (
                        <AgeInputs
                          day={day} setDay={setDay}
                          month={month} setMonth={setMonth}
                          year={year} setYear={setYear}
                          error={ageErr} setError={setAgeErr}
                        />
                      )}

                      {/* Permissions */}
                      {cur.isPerms && (
                        <div className="space-y-3">
                          <PermCard
                            icon={Navigation}
                            title="Plats"
                            desc="AllPlay hittar matcher och planer nära dig"
                            color="#22C55E"
                            granted={perms.loc}
                            onTap={() => {
                              if ('geolocation' in navigator)
                                navigator.geolocation.getCurrentPosition(
                                  () => setPerms(p => ({ ...p, loc: true })),
                                  () => {}
                                );
                            }}
                          />
                          <PermCard
                            icon={Bell}
                            title="Notiser"
                            desc="AllPlay skickar påminnelser om matcher"
                            color="#22C55E"
                            granted={perms.notif}
                            onTap={async () => {
                              if ('Notification' in window) {
                                const p = await Notification.requestPermission();
                                if (p === 'granted') setPerms(prev => ({ ...prev, notif: true }));
                              }
                            }}
                          />
                          <AnimatePresence>
                            {allGranted && (
                              <motion.div
                                key="done"
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                                className="flex items-center gap-3 rounded-2xl px-4 py-4"
                                style={{
                                  background: 'rgba(34,197,94,0.13)',
                                  border: '1.5px solid rgba(34,197,94,0.42)',
                                  boxShadow: '0 0 20px rgba(34,197,94,0.10)',
                                }}
                              >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: 'rgba(34,197,94,0.25)', border: '1.5px solid rgba(34,197,94,0.55)' }}>
                                  <Check className="w-4 h-4 text-[#22C55E]" strokeWidth={3} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-black text-[#22C55E]">Allt klart!</p>
                                  <p className="text-[11.5px] text-white/45 mt-0.5">Du är redo att spela.</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer CTA */}
              <div
                className="relative z-10 flex-shrink-0 flex flex-col gap-2 px-5 pt-2 border-t border-white/[0.06]"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
              >
                {isLast ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={openLogin}
                      className="w-full h-[54px] rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2.5 mt-3"
                      style={{
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        boxShadow: '0 8px 28px rgba(34,197,94,0.40), inset 0 1px 0 rgba(255,255,255,0.18)',
                      }}
                    >
                      <LogIn className="w-4 h-4" strokeWidth={2.5} />
                      Logga in / Skapa konto
                    </motion.button>
                    <button
                      onClick={complete}
                      className="w-full h-11 font-semibold text-[13px] rounded-xl transition-colors"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Fortsätt som gäst
                    </button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={next}
                    className="w-full h-[54px] rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2.5 mt-3"
                    style={{
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      boxShadow: '0 8px 28px rgba(34,197,94,0.40), inset 0 1px 0 rgba(255,255,255,0.18)',
                    }}
                  >
                    {ctaText}
                    <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                  </motion.button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setShowLogin(false);
          localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          setOpen(false);
        }}
      />
    </>
  );
}

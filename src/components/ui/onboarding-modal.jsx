import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Users, Bell, ChevronRight, Check,
  Navigation, LogIn, Zap, Star, Swords, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { LoginModal } from "@/components/supabase";

const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';

/**
 * Premium onboarding — same slides, new craft.
 *
 *   Slide 1  Welcome        — what is AllPlay
 *   Slide 2  How it works   — 3 steps
 *   Slide 3  Age            — birthday (optional)
 *   Slide 4  Permissions    — location + notifications
 */

const SLIDES = [
  {
    id: 'welcome',
    eyebrow: 'Välkommen',
    title: 'Fotboll på riktigt,\nnär du vill.',
    subtitle: 'Hitta matcher, bygg lag och möt spelare nära dig.',
    features: [
      { icon: MapPin, text: 'Hitta matcher nära dig',  accent: '#34C257' },
      { icon: Users,  text: 'Bygg lag med vänner',     accent: '#C4B5FD' },
      { icon: Swords, text: 'Tävla och utvecklas',     accent: '#FDBA74' },
    ],
    accent: '#34C257',
  },
  {
    id: 'how-it-works',
    eyebrow: 'Så funkar det',
    title: 'Tre steg till\nfirst touch.',
    subtitle: 'Från anmälan till avspark — smidigt hela vägen.',
    steps: [
      { n: '01', title: 'Hitta en plan',        desc: 'Fotbollsplaner nära dig på kartan',       icon: MapPin, accent: '#34C257' },
      { n: '02', title: 'Gå med i en match',    desc: 'Välj nivå och anmäl dig direkt',          icon: Zap,    accent: '#FDBA74' },
      { n: '03', title: 'Spela & utvecklas',    desc: 'Bygg din profil med stats och badges',    icon: Star,   accent: '#FDE68A' },
    ],
    accent: '#FDBA74',
  },
  {
    id: 'age',
    eyebrow: 'Snabb fråga',
    title: 'Hur gammal\när du?',
    subtitle: 'Hjälper oss att ge dig rätt matcher. Helt frivilligt.',
    isAgeScreen: true,
    accent: '#34C257',
  },
  {
    id: 'permissions',
    eyebrow: 'Nästan klart',
    title: 'Tillåt för\nbästa upplevelsen.',
    subtitle: 'Du kan ändra när som helst i enhetens inställningar.',
    isPermissionScreen: true,
    accent: '#FDBA74',
  },
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [permissions, setPermissions] = useState({ location: false, notifications: false });
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageError, setAgeError] = useState('');
  const [isVerifyingAge] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingReferral, setIsProcessingReferral] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setIsOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
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
        } catch (e) { /* ignore */ }
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
    } catch (e) { /* ignore */ }
    setIsOpen(false);
  };

  const verifyAge = () => {
    if (!birthDay || !birthMonth || !birthYear) {
      setAgeVerified(true);
      return true;
    }
    setAgeError('');
    const day = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);
    const year = parseInt(birthYear, 10);
    if (
      isNaN(day) || isNaN(month) || isNaN(year) ||
      day < 1 || day > 31 || month < 1 || month > 12 ||
      year < 1900 || year > new Date().getFullYear()
    ) {
      setAgeError('Ogiltigt datum. Kontrollera dag, månad och år.');
      return false;
    }
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 13) {
      setAgeError('Du måste vara minst 13 år för att använda AllPlay.');
      return false;
    }
    const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    localStorage.setItem('allplay_pending_dob', dob);
    setAgeVerified(true);
    return true;
  };

  const handleNext = () => {
    const slide = SLIDES[currentSlide];
    if (slide.isAgeScreen && !ageVerified) {
      const ok = verifyAge();
      if (!ok) return;
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

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const progress = ((currentSlide + 1) / SLIDES.length) * 100;
  const accent = slide.accent;

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="relative w-full sm:max-w-[440px] sm:w-[440px] h-[100dvh] sm:h-[min(620px,86vh)] overflow-hidden flex flex-col sm:rounded-[26px] border-0 sm:border border-white/[0.06]"
              style={{
                background:
                  'radial-gradient(140% 110% at 50% 0%, #0F2A18 0%, #0A1C10 45%, #05100A 100%)',
                boxShadow:
                  '0 -24px 70px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Ambient orb */}
              <motion.div
                key={`orb-${currentSlide}`}
                aria-hidden
                animate={{ opacity: [0.4, 0.65, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-32 -right-20 w-[380px] h-[380px] rounded-full blur-[110px] pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${accent}55 0%, ${accent}10 40%, transparent 70%)`,
                }}
              />

              {/* Noise */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                }}
              />

              {/* Top hairline */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px pointer-events-none"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)',
                }}
              />

              {/* Header: progress + skip */}
              <div
                className="relative z-10 flex items-center justify-between px-5 sm:px-6 flex-shrink-0"
                style={{ paddingTop: 'calc(1.1rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
              >
                <div className="flex-1 flex items-center gap-1.5 mr-3">
                  {SLIDES.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <motion.div
                        initial={false}
                        animate={{ width: i < currentSlide ? '100%' : i === currentSlide ? '100%' : '0%' }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: accent }}
                      />
                    </div>
                  ))}
                </div>
                {currentSlide > 0 && (
                  <button
                    onClick={handleComplete}
                    className="text-[#8FA097] hover:text-white text-[11.5px] font-semibold px-2.5 py-1 rounded-md hover:bg-white/[0.06] transition-colors flex-shrink-0"
                  >
                    Hoppa över
                  </button>
                )}
              </div>

              {/* Slide body */}
              <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-6 pt-2 pb-4">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col"
                  >
                    {/* Eyebrow */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: `${accent}22`, boxShadow: `inset 0 0 0 1px ${accent}44` }}
                      >
                        <Sparkles className="w-3 h-3" style={{ color: accent }} strokeWidth={2.6} />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                        {slide.eyebrow}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-[28px] sm:text-[32px] font-black text-white leading-[1.05] tracking-[-0.03em] mb-2.5 whitespace-pre-line drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                      {slide.title}
                    </h2>
                    <p className="text-[14px] text-white/60 leading-relaxed mb-6">
                      {slide.subtitle}
                    </p>

                    {/* WELCOME */}
                    {slide.id === 'welcome' && (
                      <div className="space-y-2.5">
                        {slide.features.map((f, i) => {
                          const Icon = f.icon;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.12 + i * 0.08 }}
                              className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] backdrop-blur-sm"
                            >
                              <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: `${f.accent}1E`,
                                  boxShadow: `inset 0 0 0 1px ${f.accent}44`,
                                }}
                              >
                                <Icon className="w-[19px] h-[19px]" style={{ color: f.accent }} strokeWidth={2.4} />
                              </div>
                              <span className="text-[14.5px] font-semibold text-white/90">{f.text}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* HOW IT WORKS */}
                    {slide.id === 'how-it-works' && (
                      <div className="space-y-2">
                        {slide.steps.map((step, i) => {
                          const Icon = step.icon;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.08 + i * 0.08 }}
                              className="relative flex gap-3 p-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07]"
                            >
                              <div className="flex flex-col items-center flex-shrink-0">
                                <span
                                  className="text-[11px] font-black tabular-nums leading-none mb-1"
                                  style={{ color: step.accent }}
                                >
                                  {step.n}
                                </span>
                                <div
                                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                                  style={{
                                    background: `${step.accent}1E`,
                                    boxShadow: `inset 0 0 0 1px ${step.accent}44`,
                                  }}
                                >
                                  <Icon className="w-[19px] h-[19px]" style={{ color: step.accent }} strokeWidth={2.4} />
                                </div>
                              </div>
                              <div className="min-w-0 pt-0.5">
                                <h3 className="text-[14.5px] font-bold text-white leading-tight">{step.title}</h3>
                                <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">{step.desc}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* AGE */}
                    {slide.isAgeScreen && (
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
                          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 mb-3">
                            Födelsedatum <span className="normal-case tracking-normal text-white/40 font-normal">(frivilligt)</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2.5">
                            {[
                              { label: 'Dag',   value: birthDay,   set: setBirthDay,   ph: 'DD',   max: 31 },
                              { label: 'Månad', value: birthMonth, set: setBirthMonth, ph: 'MM',   max: 12 },
                              { label: 'År',    value: birthYear,  set: setBirthYear,  ph: 'ÅÅÅÅ', max: new Date().getFullYear() },
                            ].map((f, i) => (
                              <div key={i}>
                                <label className="block text-[10px] text-white/45 mb-1.5 font-semibold uppercase tracking-wider">
                                  {f.label}
                                </label>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  max={f.max}
                                  placeholder={f.ph}
                                  value={f.value}
                                  onChange={(e) => { f.set(e.target.value); setAgeError(''); }}
                                  className="bg-[#0F1513] border-[#243029] text-[#F4F7F5] text-center h-12 text-[15px] font-bold rounded-xl tabular-nums focus-visible:border-[#2BA84A]/45 focus-visible:ring-2 focus-visible:ring-[#2BA84A]/20"
                                />
                              </div>
                            ))}
                          </div>
                          {ageError && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 text-[12.5px] text-[#FCA5A5] bg-[#DC2626]/10 px-3 py-2 rounded-lg ring-1 ring-[#DC2626]/20"
                            >
                              {ageError}
                            </motion.p>
                          )}
                        </div>

                        <p className="text-[11px] text-white/40 text-center leading-relaxed">
                          Genom att använda AllPlay godkänner du vår{' '}
                          <a
                            href="https://allplayuf.se/legalpolicy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#86EFAC] underline underline-offset-2 hover:text-white"
                          >
                            användarpolicy
                          </a>.
                        </p>
                      </div>
                    )}

                    {/* PERMISSIONS */}
                    {slide.isPermissionScreen && (
                      <div className="space-y-2.5">
                        {[
                          { icon: Navigation, label: 'Plats',   desc: 'Hitta matcher och planer nära dig',     granted: permissions.location,       action: requestLocation,      accent: '#34C257' },
                          { icon: Bell,       label: 'Notiser', desc: 'Påminnelser om matcher och inbjudningar', granted: permissions.notifications, action: requestNotifications, accent: '#FDBA74' },
                        ].map((p, i) => {
                          const PIcon = p.icon;
                          return (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.08 + i * 0.08 }}
                              onClick={p.action}
                              whileTap={{ scale: 0.985 }}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all ${
                                p.granted
                                  ? 'bg-[#2BA84A]/10 ring-1 ring-[#2BA84A]/30'
                                  : 'bg-white/[0.04] ring-1 ring-white/[0.07] hover:bg-white/[0.07]'
                              }`}
                            >
                              <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: p.granted ? '#2BA84A22' : `${p.accent}1E`,
                                  boxShadow: `inset 0 0 0 1px ${p.granted ? '#2BA84A55' : `${p.accent}44`}`,
                                }}
                              >
                                {p.granted ? (
                                  <Check className="w-5 h-5 text-[#86EFAC]" strokeWidth={2.6} />
                                ) : (
                                  <PIcon className="w-[19px] h-[19px]" style={{ color: p.accent }} strokeWidth={2.4} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-[14px] font-bold leading-tight ${p.granted ? 'text-[#86EFAC]' : 'text-white'}`}>
                                  {p.label}
                                </div>
                                <div className="text-[12px] text-white/55 mt-0.5 leading-snug">{p.desc}</div>
                              </div>
                              {p.granted && <Check className="w-4 h-4 text-[#86EFAC] flex-shrink-0" strokeWidth={2.8} />}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer CTA */}
              <div
                className="relative z-10 flex-shrink-0 px-5 sm:px-6 pt-2 space-y-2.5"
                style={{ paddingBottom: 'calc(1.1rem + env(safe-area-inset-bottom))' }}
              >
                {isLast ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setIsOpen(false); setShowLoginModal(true); }}
                      className="w-full h-12 sm:h-[52px] rounded-2xl font-black text-[14px] text-white inline-flex items-center justify-center gap-2 transition-opacity"
                      style={{
                        background: 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)',
                        boxShadow: '0 12px 28px rgba(43,168,74,0.4), inset 0 1px 0 rgba(255,255,255,0.22)',
                      }}
                    >
                      <LogIn className="w-4 h-4" strokeWidth={2.6} />
                      Logga in / Skapa konto
                    </motion.button>
                    <Button
                      onClick={handleNext}
                      variant="ghost"
                      className="w-full h-11 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.04] font-semibold text-[13px]"
                    >
                      Fortsätt som gäst
                    </Button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={isVerifyingAge}
                    className="w-full h-12 sm:h-[52px] rounded-2xl font-black text-[14px] text-white inline-flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                    style={{
                      background: `linear-gradient(180deg, ${accent} 0%, ${accent}DD 55%, ${accent}99 100%)`,
                      boxShadow: `0 12px 28px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
                    }}
                  >
                    {isVerifyingAge
                      ? 'Verifierar…'
                      : slide.isAgeScreen
                      ? ((birthDay && birthMonth && birthYear) ? 'Verifiera & fortsätt' : 'Hoppa över')
                      : (<><span>Nästa</span><ChevronRight className="w-4 h-4" strokeWidth={2.8} /></>)}
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
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Shield, Users, Bell, ChevronRight, Check,
  Navigation, LogIn, Zap, Star, FileText, Swords
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { LoginModal } from "@/components/supabase";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';

const SLIDES = [
  {
    id: "welcome",
    title: "Välkommen till\nAllPlay",
    subtitle: "Hitta matcher, bygg lag och spela fotboll.",
    features: [
      { icon: MapPin, text: "Hitta matcher nära dig", color: "#2BA84A" },
      { icon: Users, text: "Bygg lag med vänner", color: "#9370DB" },
      { icon: Swords, text: "Spela matcher och tävla", color: "#F4743B" },
    ],
    gradient: "from-[#2BA84A]/30 via-transparent to-[#F4743B]/20",
    accentColor: "#2BA84A",
  },
  {
    id: "how-it-works",
    title: "Så funkar det",
    subtitle: "Tre steg till din första match.",
    steps: [
      { number: "1", title: "Hitta en plan", desc: "Se fotbollsplaner nära dig på kartan", icon: MapPin, color: "#2BA84A" },
      { number: "2", title: "Gå med i en match", desc: "Välj nivå och anmäl dig direkt", icon: Zap, color: "#F4743B" },
      { number: "3", title: "Spela & utvecklas", desc: "Bygg din profil med stats och badges", icon: Star, color: "#F59E0B" },
    ],
    gradient: "from-[#F4743B]/25 via-transparent to-[#9370DB]/20",
    accentColor: "#F4743B",
  },
  {
    id: "age",
    title: "Hur gammal är du?",
    subtitle: "Vi behöver veta att du uppfyller ålderskraven.",
    isAgeScreen: true,
    gradient: "from-[#2BA84A]/20 via-transparent to-[#2BA84A]/10",
    accentColor: "#2BA84A",
  },
  {
    id: "permissions",
    title: "Nästan klart!",
    subtitle: "Aktivera för bästa upplevelsen.",
    isPermissionScreen: true,
    gradient: "from-[#F59E0B]/25 via-transparent to-[#2BA84A]/15",
    accentColor: "#F59E0B",
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
  const [isVerifyingAge, setIsVerifyingAge] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingReferral, setIsProcessingReferral] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setIsOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  // Handle referral codes
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

  const verifyAge = async () => {
    if (!birthDay || !birthMonth || !birthYear) {
      setAgeVerified(true);
      return true;
    }
    setIsVerifyingAge(true);
    setAgeError('');
    try {
      const dob = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
      const response = await base44.functions.invoke('verifyAge', { date_of_birth: dob });
      if (response.data?.allowed === false) {
        setAgeError(response.data.message || 'Du måste vara minst 13 år.');
        setIsVerifyingAge(false);
        return false;
      }
      if (response.data?.success) {
        setAgeVerified(true);
        setIsVerifyingAge(false);
        return true;
      }
    } catch (e) {
      setAgeError('Kunde inte verifiera ålder.');
    }
    setIsVerifyingAge(false);
    return false;
  };

  const handleNext = async () => {
    const slide = SLIDES[currentSlide];
    if (slide.isAgeScreen && !ageVerified) {
      const ok = await verifyAge();
      if (!ok) return;
    }
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide(p => p + 1);
    } else {
      handleComplete();
    }
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(p => ({ ...p, location: true })),
        () => {}
      );
    }
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") setPermissions(p => ({ ...p, notifications: true }));
    }
  };

  // If login modal is open, hide onboarding but keep state
  if (!isOpen && !showLoginModal) return null;

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const progress = ((currentSlide + 1) / SLIDES.length) * 100;

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <>
      <AnimatePresence>
      {isOpen && !showLoginModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-none sm:max-w-[440px] sm:w-[440px] h-[100dvh] sm:h-[min(600px,80vh)] bg-[#0A0E0C] sm:rounded-[28px] border-0 sm:border border-[#1A2420] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
          >
            {/* Ambient gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} pointer-events-none opacity-60`} />

            {/* Floating orbs */}
            <motion.div
              key={`orb-${currentSlide}`}
              animate={{ x: [0, 15, 0], y: [0, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-16 right-8 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: slide.accentColor }}
            />

            {/* Top bar: progress + skip */}
            <div className="relative z-10 flex items-center justify-between px-5 sm:px-6 flex-shrink-0" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))', paddingBottom: '0.5rem' }}>
              {/* Progress bar */}
              <div className="flex-1 h-1 bg-[#1A2420] rounded-full overflow-hidden mr-4">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: slide.accentColor }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              {currentSlide > 0 && (
                <button
                  onClick={handleComplete}
                  className="text-[#7B8A83] hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                >
                  Hoppa över
                </button>
              )}
            </div>

            {/* Slide content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 sm:py-4 relative z-10" style={{ minHeight: 0 }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col"
                >
                  {/* Title */}
                  <h2 className="text-[24px] sm:text-[28px] md:text-[32px] font-black text-white leading-tight mb-1.5 sm:mb-2 whitespace-pre-line">
                    {slide.title}
                  </h2>
                  <p className="text-[14px] sm:text-[15px] text-[#9CA3AF] mb-5 sm:mb-8 leading-relaxed">
                    {slide.subtitle}
                  </p>

                  {/* --- WELCOME SLIDE --- */}
                  {slide.id === "welcome" && (
                    <div className="space-y-2.5 sm:space-y-3">
                      {slide.features.map((f, i) => {
                        const Icon = f.icon;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.1 }}
                            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                          >
                            <div
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${f.color}20` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: f.color }} strokeWidth={2} />
                            </div>
                            <span className="text-[14px] sm:text-[15px] font-medium text-[#E5E7EB]">{f.text}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* --- HOW IT WORKS SLIDE --- */}
                  {slide.id === "how-it-works" && (
                    <div className="space-y-4">
                      {slide.steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.12 }}
                            className="flex gap-4"
                          >
                            {/* Step indicator + line */}
                            <div className="flex flex-col items-center">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0 ring-2"
                                style={{ backgroundColor: `${step.color}25`, ringColor: `${step.color}40`, color: step.color }}
                              >
                                <Icon className="w-4.5 h-4.5" strokeWidth={2.5} />
                              </div>
                              {i < slide.steps.length - 1 && (
                                <div className="w-px flex-1 min-h-[24px] bg-gradient-to-b from-[#223029] to-transparent mt-1" />
                              )}
                            </div>
                            {/* Text */}
                            <div className="pb-4">
                              <h3 className="font-bold text-[15px] text-white mb-0.5">{step.title}</h3>
                              <p className="text-[13px] text-[#9CA3AF] leading-relaxed">{step.desc}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* --- AGE SCREEN --- */}
                  {slide.isAgeScreen && (
                    <div className="space-y-5">
                      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
                        <label className="block text-sm font-semibold text-[#E5E7EB] mb-3">
                          Födelsedatum <span className="text-[#7B8A83] font-normal">(valfritt)</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Dag', value: birthDay, set: setBirthDay, ph: 'DD', max: 31 },
                            { label: 'Månad', value: birthMonth, set: setBirthMonth, ph: 'MM', max: 12 },
                            { label: 'År', value: birthYear, set: setBirthYear, ph: 'ÅÅÅÅ', max: new Date().getFullYear() },
                          ].map((f, i) => (
                            <div key={i}>
                              <label className="block text-[11px] text-[#7B8A83] mb-1">{f.label}</label>
                              <Input
                                type="number"
                                min="1"
                                max={f.max}
                                placeholder={f.ph}
                                value={f.value}
                                onChange={e => { f.set(e.target.value); setAgeError(''); }}
                                className="bg-[#131816] border-[#223029] text-[#F4F7F5] text-center h-12 text-base font-semibold rounded-xl"
                              />
                            </div>
                          ))}
                        </div>
                        {ageError && (
                          <motion.p
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 text-sm text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20"
                          >
                            {ageError}
                          </motion.p>
                        )}
                      </div>

                      <p className="text-xs text-[#7B8A83] text-center leading-relaxed">
                        Genom att använda AllPlay godkänner du vår{" "}
                        <a
                          href="https://allplayuf.se/legalpolicy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2BA84A] underline underline-offset-2 hover:text-[#248232]"
                        >
                          användarpolicy
                        </a>.
                      </p>
                    </div>
                  )}

                  {/* --- PERMISSIONS SCREEN --- */}
                  {slide.isPermissionScreen && (
                    <div className="space-y-3">
                      {[
                        {
                          icon: Navigation, label: "Plats", desc: "Hitta matcher och planer nära dig",
                          granted: permissions.location, action: requestLocation, color: "#2BA84A"
                        },
                        {
                          icon: Bell, label: "Notiser", desc: "Påminnelser om matcher och inbjudningar",
                          granted: permissions.notifications, action: requestNotifications, color: "#F59E0B"
                        }
                      ].map((p, i) => {
                        const PIcon = p.icon;
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                            onClick={p.action}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                              p.granted
                                ? 'bg-[#2BA84A]/8 border-[#2BA84A]/30'
                                : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10 active:scale-[0.98]'
                            }`}
                          >
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: p.granted ? '#2BA84A20' : `${p.color}15` }}
                            >
                              {p.granted ? (
                                <Check className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
                              ) : (
                                <PIcon className="w-5 h-5" style={{ color: p.color }} strokeWidth={2} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-sm ${p.granted ? 'text-[#2BA84A]' : 'text-[#E5E7EB]'}`}>{p.label}</div>
                              <div className="text-xs text-[#7B8A83] mt-0.5">{p.desc}</div>
                            </div>
                            {p.granted && <Check className="w-4 h-4 text-[#2BA84A] flex-shrink-0" />}
                          </motion.button>
                        );
                      })}

                      <p className="text-[11px] text-[#4B5563] text-center mt-4 leading-relaxed">
                        Du kan ändra behörigheter när som helst i enhetens inställningar.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom CTA */}
            <div className="relative z-10 flex-shrink-0 px-5 sm:px-6 pt-2 sm:pt-3 space-y-2.5 sm:space-y-3" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
              {isLast ? (
                <>
                  {/* Primary: Login / Create account */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        setShowLoginModal(true);
                      }}
                      className="w-full h-[48px] sm:h-[52px] rounded-2xl font-bold text-[14px] sm:text-[15px] shadow-lg bg-[#2BA84A] hover:bg-[#248232] text-white"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Logga in / Skapa konto
                    </Button>
                  </motion.div>
                  {/* Secondary: Continue as guest */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleNext}
                      variant="ghost"
                      className="w-full h-[44px] sm:h-[48px] rounded-2xl text-[#7B8A83] hover:text-[#E5E7EB] hover:bg-white/5 font-medium text-[13px] sm:text-[14px]"
                    >
                      Fortsätt utan konto
                    </Button>
                  </motion.div>
                </>
              ) : (
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleNext}
                    disabled={isVerifyingAge}
                    className="w-full h-[48px] sm:h-[52px] rounded-2xl font-bold text-[14px] sm:text-[15px] shadow-lg transition-all disabled:opacity-50 bg-[#F4743B] hover:bg-[#E5683A] text-white"
                  >
                    {isVerifyingAge ? (
                      "Verifierar..."
                    ) : slide.isAgeScreen ? (
                      (birthDay && birthMonth && birthYear) ? "Verifiera & fortsätt" : "Hoppa över"
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Nästa <ChevronRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </motion.div>
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
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Shield, 
  Users, 
  Bell, 
  ChevronRight, 
  X, 
  Check, 
  Map as MapIcon,
  Trophy,
  UserPlus,
  Navigation,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { LoginModal } from "@/components/supabase";

const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';

const SLIDES = [
  {
    id: "screen_0_welcome",
    title: "Välkommen till AllPlay!",
    description: "Din plattform för att hitta matcher, bygga lag och spela fotboll med likasinnade.",
    bullets: [
      "Hitta matcher nära dig på sekunder",
      "Skapa lag och spela turneringar",
      "Bygg din profil och samla MVP-röster"
    ],
    icon: Trophy,
    color: "#2BA84A"
  },
  {
    id: "screen_0_age",
    title: "Hur gammal är du?",
    description: "Detta är valfritt, men om du anger din ålder måste du vara minst 13 år. Om du är under 18 år aktiveras extra skydd automatiskt.",
    isAgeVerificationScreen: true,
    icon: Shield,
    color: "#2BA84A"
  },
  {
    id: "screen_1",
    title: "Hitta matcher nära dig",
    description: "AllPlay visar fotbollsplaner och matcher nära dig, så du slipper chattgrupper och krånglig planering.",
    bullets: [
      "Se planer på karta i din stad",
      "Skapa egna matcher på sekunder",
      "Gå med i öppna matcher i närheten"
    ],
    icon: MapIcon,
    color: "#F4743B"
  },
  {
    id: "screen_2",
    title: "Spela på rätt nivå",
    description: "Du anger din nivå och AllPlay hjälper dig hitta matcher med spelare som ligger ungefär som du.",
    bullets: [
      "Nivåsystem inspirerat av ELO",
      "Matcher filtrerade på nivå",
      "Verifiering via rapportering"
    ],
    tags: [
      { label: "Nivåmatchning", color: "bg-[#2BA84A]" },
      { label: "Trygghet", color: "bg-[#F4743B]" }
    ],
    icon: Shield,
    color: "#2BA84A"
  },
  {
    id: "screen_3",
    title: "Bygg lag & hitta vänner",
    description: "Skapa eller gå med i lag, samla badges och bygg streaks tillsammans med andra.",
    bullets: [
      "Skapa lag med dina vänner",
      "Se när dina vänner spelar",
      "Samla badges och MVP-röster"
    ],
    icon: Users,
    color: "#9370DB"
  },
  {
    id: "screen_4_permissions",
    title: "För att AllPlay ska fungera",
    description: "Vi använder din position och notiser för att visa relevanta matcher och påminna dig i tid.",
    isPermissionScreen: true,
    icon: Bell,
    color: "#F59E0B"
  }
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false
  });
  const [isProcessingReferral, setIsProcessingReferral] = useState(false);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageError, setAgeError] = useState('');
  const [isVerifyingAge, setIsVerifyingAge] = useState(false);
  const [continueAsGuest, setContinueAsGuest] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboarding = () => {
      // Check localStorage ONLY - onboarding is shown once per device
      const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      if (!hasCompletedOnboarding) {
        // Small delay for better UX on load
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
      }
    };

    checkOnboarding();
  }, []);

  // Check for referral code on mount
  useEffect(() => {
    const processReferral = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (referralCode && !isProcessingReferral) {
        setIsProcessingReferral(true);
        try {
          const isAuth = await base44.auth.isAuthenticated();
          if (isAuth) {
            const user = await base44.auth.me();
            
            // Only process if user doesn't already have a referrer
            if (!user.referred_by) {
              await base44.functions.invoke('auth/handleReferralSignup', {
                userId: user.id,
                referralCode: referralCode
              });
            }
          } else {
            // Store referral code for after signup
            sessionStorage.setItem('pending_referral_code', referralCode);
          }
        } catch (error) {
          console.error('Error processing referral:', error);
        } finally {
          setIsProcessingReferral(false);
        }
      }
    };

    processReferral();
  }, [isProcessingReferral]);

  const handleComplete = async () => {
    // Always mark as completed in localStorage (works for guests too)
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    
    // If authenticated, also save to user profile
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        await base44.auth.updateMe({ onboarding_completed: true });
        
        const pendingReferral = sessionStorage.getItem('pending_referral_code');
        if (pendingReferral) {
          try {
            const user = await base44.auth.me();
            await base44.functions.invoke('auth/handleReferralSignup', {
              userId: user.id,
              referralCode: pendingReferral
            });
            sessionStorage.removeItem('pending_referral_code');
          } catch (error) {
            console.error('Error processing pending referral:', error);
          }
        }
      }
    } catch (error) {
      // Ignore errors - localStorage is already set
    }
    
    setIsOpen(false);
  };

  const handleNext = async () => {
    const slide = SLIDES[currentSlide];
    
    // If on age verification screen, verify age before proceeding
    if (slide.isAgeVerificationScreen && !ageVerified) {
      const verified = await verifyAge();
      if (!verified) return;
    }
    
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const requestLocation = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(p => ({ ...p, location: true })),
        (error) => console.log("Location denied", error)
      );
    }
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPermissions(p => ({ ...p, notifications: true }));
      }
    }
  };

  const verifyAge = async () => {
    // If no date provided, skip age verification (optional)
    if (!birthDay || !birthMonth || !birthYear) {
      setAgeVerified(true);
      return true;
    }

    setIsVerifyingAge(true);
    setAgeError('');
    
    try {
      // Format date as YYYY-MM-DD
      const dateOfBirth = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
      
      const response = await base44.functions.invoke('verifyAge', {
        date_of_birth: dateOfBirth
      });

      if (response.data?.allowed === false) {
        setAgeError(response.data.message || 'Du måste vara minst 13 år för att använda AllPlay.');
        setIsVerifyingAge(false);
        return false;
      }

      if (response.data?.success) {
        setAgeVerified(true);
        setIsVerifyingAge(false);
        return true;
      }
    } catch (error) {
      console.error('Age verification error:', error);
      setAgeError('Kunde inte verifiera ålder. Försök igen.');
    }
    
    setIsVerifyingAge(false);
    return false;
  };

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[400px] h-[600px] sm:h-[650px] bg-gradient-to-b from-[#040F0F] to-[#2D3A3A] rounded-[32px] border border-[#223029] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between p-6 flex-shrink-0 z-20">
              <div className="w-8 h-8" /> {/* Spacer */}
              <div className="flex gap-1.5">
                {SLIDES.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentSlide 
                        ? "w-6 bg-[#F4743B]" 
                        : "w-1.5 bg-[#4B5563]"
                    }`}
                  />
                ))}
              </div>
              {currentSlide > 0 && (
                <button 
                  onClick={handleComplete}
                  className="text-[#9CA3AF] hover:text-white text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Hoppa över
                </button>
              )}
            </div>

            {/* Content Scroll Area - Fixed height with scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-[#223029] scrollbar-track-transparent" style={{ minHeight: 0 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Hero Icon/Illustration */}
                  <div className="relative w-32 h-32 mb-8">
                    <div 
                      className="absolute inset-0 rounded-full opacity-20 blur-2xl"
                      style={{ backgroundColor: slide.color }}
                    />
                    <div className="relative w-full h-full bg-[#121715]/50 border border-white/10 rounded-full flex items-center justify-center shadow-xl ring-1 ring-white/5">
                      <Icon 
                        size={48} 
                        style={{ color: slide.color }}
                        strokeWidth={1.5}
                      />
                      {/* Decorative floating elements based on slide */}
                      {slide.id === "screen_1" && (
                        <motion.div 
                          animate={{ y: [-5, 5, -5] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute -right-2 top-0 bg-[#2BA84A] p-2 rounded-full border-2 border-[#121715]"
                        >
                          <MapPin size={14} className="text-white" />
                        </motion.div>
                      )}
                      {slide.id === "screen_2" && (
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -left-2 bottom-2 bg-[#F59E0B] p-2 rounded-full border-2 border-[#121715]"
                        >
                          <Trophy size={14} className="text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Text Content */}
                  <h2 className="text-2xl font-bold text-white mb-4 px-2">
                    {slide.title}
                  </h2>
                  <p className="text-[#D1D5DB] text-[15px] leading-relaxed mb-8">
                    {slide.description}
                  </p>

                  {/* Interactive Elements */}
                  {slide.isAgeVerificationScreen ? (
                    <div className="w-full space-y-4">
                      <div className="bg-[#121715]/50 rounded-2xl p-5 border border-white/5">
                        <label className="block text-sm font-semibold text-[#F4F7F5] mb-3 text-left">
                          Födelsedatum (valfritt)
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-[#B6C2BC] mb-1">Dag</label>
                            <Input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="DD"
                              value={birthDay}
                              onChange={(e) => {
                                setBirthDay(e.target.value);
                                setAgeError('');
                              }}
                              className="bg-[#18221E] border-[#223029] text-[#F4F7F5] text-center h-14 text-lg font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[#B6C2BC] mb-1">Månad</label>
                            <Input
                              type="number"
                              min="1"
                              max="12"
                              placeholder="MM"
                              value={birthMonth}
                              onChange={(e) => {
                                setBirthMonth(e.target.value);
                                setAgeError('');
                              }}
                              className="bg-[#18221E] border-[#223029] text-[#F4F7F5] text-center h-14 text-lg font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[#B6C2BC] mb-1">År</label>
                            <Input
                              type="number"
                              min="1950"
                              max={new Date().getFullYear()}
                              placeholder="ÅÅÅÅ"
                              value={birthYear}
                              onChange={(e) => {
                                setBirthYear(e.target.value);
                                setAgeError('');
                              }}
                              className="bg-[#18221E] border-[#223029] text-[#F4F7F5] text-center h-14 text-lg font-semibold"
                            />
                          </div>
                        </div>
                        {ageError && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 text-sm text-red-400 flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/30"
                          >
                            <span className="text-lg">⚠️</span> 
                            <span>{ageError}</span>
                          </motion.p>
                        )}
                      </div>
                      
                      <div className="bg-[#2BA84A]/5 border border-[#2BA84A]/20 rounded-2xl p-4 text-left">
                        <p className="text-xs font-semibold text-[#2BA84A] mb-2 flex items-center gap-2">
                          <Shield size={14} />
                          Om du anger din ålder:
                        </p>
                        <ul className="space-y-1.5 text-xs text-[#CFE8D6]">
                          <li className="flex items-start gap-2">
                            <span className="text-[#2BA84A] mt-0.5">•</span>
                            <span>Minst 13 år krävs för att använda AllPlay</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#2BA84A] mt-0.5">•</span>
                            <span>13-17 år: Automatiskt extra skydd (dold plats m.m.)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#2BA84A] mt-0.5">•</span>
                            <span>Du kan lämna tomt och fylla i senare</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : slide.isPermissionScreen ? (
                    <div className="w-full space-y-3">
                      <button
                        onClick={requestLocation}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          permissions.location 
                            ? "bg-[#2BA84A]/10 border-[#2BA84A] text-[#2BA84A]" 
                            : "bg-[#121715] border-[#223029] text-[#F4F7F5] hover:border-[#F4743B]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${permissions.location ? "bg-[#2BA84A]/20" : "bg-[#18221E]"}`}>
                            <Navigation size={18} />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm">Platstjänster</div>
                            <div className="text-xs opacity-70">För att hitta planer</div>
                          </div>
                        </div>
                        {permissions.location && <Check size={18} />}
                      </button>

                      <button
                        onClick={requestNotifications}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          permissions.notifications 
                            ? "bg-[#2BA84A]/10 border-[#2BA84A] text-[#2BA84A]" 
                            : "bg-[#121715] border-[#223029] text-[#F4F7F5] hover:border-[#F4743B]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${permissions.notifications ? "bg-[#2BA84A]/20" : "bg-[#18221E]"}`}>
                            <Bell size={18} />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm">Notiser</div>
                            <div className="text-xs opacity-70">För matchinbjudningar</div>
                          </div>
                        </div>
                        {permissions.notifications && <Check size={18} />}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      {/* Bullets */}
                      <div className="bg-[#121715]/50 rounded-2xl p-4 border border-white/5 space-y-3 text-left">
                        {slide.bullets?.map((bullet, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm text-[#D1D5DB]">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F4743B] flex-shrink-0" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tags */}
                      {slide.tags && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {slide.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${tag.color}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Navigation Area - Fixed */}
            <div className="flex-shrink-0 p-6 bg-gradient-to-t from-[#040F0F] via-[#040F0F] to-transparent z-20 space-y-3 border-t border-[#223029]/50">
              <Button
                onClick={handleNext}
                disabled={isVerifyingAge}
                className="w-full h-12 rounded-full bg-[#F4743B] hover:bg-[#E5683A] text-white font-semibold text-lg shadow-lg hover:shadow-[#F4743B]/20 transition-all disabled:opacity-50"
              >
                {isVerifyingAge ? (
                  "Verifierar..."
                ) : currentSlide === SLIDES.length - 1 ? (
                  "Kom igång som gäst"
                ) : slide.isAgeVerificationScreen ? (
                  (birthDay && birthMonth && birthYear) ? "Verifiera och fortsätt" : "Hoppa över"
                ) : (
                  <>
                    Nästa
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </Button>
              
              {/* Login/Register option on last slide */}
              {currentSlide === SLIDES.length - 1 && (
                <Button
                  onClick={() => setShowLoginModal(true)}
                  variant="outline"
                  className="w-full h-12 rounded-full border-[#2BA84A] text-[#2BA84A] hover:bg-[#2BA84A]/10 font-semibold text-lg"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Logga in / Skapa konto
                </Button>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          handleComplete();
        }}
      />
    </AnimatePresence>
  );
}
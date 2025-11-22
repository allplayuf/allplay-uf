import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X, ChevronRight, User, Trophy, Target } from 'lucide-react';
import { base44 } from "@/api/base44Client";

const STEPS = [
  { id: 'welcome', title: 'Välkommen' },
  { id: 'skill', title: 'Erfarenhet' },
  { id: 'position', title: 'Position' },
  { id: 'complete', title: 'Klar' }
];

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Nybörjare', desc: 'Spelar för att det är kul, ny inom sporten.' },
  { value: 'intermediate', label: 'Medel', desc: 'Spelat ett tag, kan grunderna väl.' },
  { value: 'advanced', label: 'Avancerad', desc: 'Spelar regelbundet, hög nivå.' },
  { value: 'elite', label: 'Elit', desc: 'Tävlingsinriktad, mycket hög nivå.' }
];

const POSITIONS = [
  { value: 'goalkeeper', label: 'Målvakt' },
  { value: 'defender', label: 'Försvarare' },
  { value: 'midfielder', label: 'Mittfältare' },
  { value: 'forward', label: 'Anfallare' }
];

export function OnboardingModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    skill_level: 'intermediate',
    preferred_position: 'midfielder'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const modalSeen = localStorage.getItem('allplay_onboarding_completed');
    if (!modalSeen) {
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await base44.auth.updateMe(userData);
      localStorage.setItem('allplay_onboarding_completed', 'true');
      setIsVisible(false);
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-3xl mx-auto flex items-center justify-center shadow-xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Välkommen till AllPlay!</h2>
              <p className="text-[#B6C2BC]">Vi behöver veta lite mer om dig för att hitta rätt matcher.</p>
            </div>
          </div>
        );
      case 'skill':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Vilken nivå spelar du på?</h3>
            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setUserData({ ...userData, skill_level: level.value })}
                  className={`w-full p-4 rounded-xl border transition-all text-left flex flex-col gap-1 ${
                    userData.skill_level === level.value
                      ? 'bg-[#2BA84A]/20 border-[#2BA84A] ring-1 ring-[#2BA84A]/50'
                      : 'bg-[#18221E] border-[#223029] hover:border-[#2BA84A]/50'
                  }`}
                >
                  <span className={`font-bold ${userData.skill_level === level.value ? 'text-[#2BA84A]' : 'text-white'}`}>
                    {level.label}
                  </span>
                  <span className="text-xs text-[#B6C2BC]">{level.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'position':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Vilken position föredrar du?</h3>
            <div className="grid grid-cols-2 gap-3">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setUserData({ ...userData, preferred_position: pos.value })}
                  className={`p-4 rounded-xl border transition-all text-center ${
                    userData.preferred_position === pos.value
                      ? 'bg-[#F4743B]/20 border-[#F4743B] ring-1 ring-[#F4743B]/50 text-[#F4743B]'
                      : 'bg-[#18221E] border-[#223029] hover:border-[#F4743B]/50 text-white'
                  }`}
                >
                  <span className="font-bold">{pos.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full mx-auto flex items-center justify-center shadow-xl">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Allt klart!</h2>
              <p className="text-[#B6C2BC]">Din profil är nu skapad. Dags att hitta din första match!</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-[#121715] border border-[#223029] rounded-[24px] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Progress Bar */}
          <div className="h-1.5 bg-[#18221E] w-full">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#2BA84A] to-[#F4743B]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-8 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-6 border-t border-[#223029] bg-[#0F1513]">
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-[#2BA84A] to-[#248232] text-white font-bold text-lg hover:shadow-lg hover:shadow-[#2BA84A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Sparar...' : (currentStep === STEPS.length - 1 ? 'Kom igång' : 'Nästa')}
              {!isSubmitting && currentStep < STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
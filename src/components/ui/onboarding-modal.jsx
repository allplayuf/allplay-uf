import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function OnboardingModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the modal before
    const modalSeen = localStorage.getItem('allplay_preview_modal_seen');
    
    if (!modalSeen) {
      // Show modal after a short delay
      setTimeout(() => {
        setIsVisible(true);
      }, 500);
    } else {
      setHasSeenModal(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('allplay_preview_modal_seen', 'true');
    setHasSeenModal(true);
  };

  if (hasSeenModal) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#121715] border border-[#223029] rounded-[24px] w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#F4743B] to-[#E5683A] p-6 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 ring-2 ring-white/30">
                  <AlertCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">AllPlay – Testversion</h2>
                <p className="text-sm text-white/90 font-medium">(endast preview)</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-sm text-[#F4F7F5] leading-relaxed">
                Du använder just nu en förhandsversion av AllPlay.
              </p>

              {/* Do's */}
              <div>
                <h3 className="text-sm font-bold text-[#2BA84A] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Det här får du gärna göra:
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="text-xs text-[#CFE8D6] leading-relaxed list-disc">Skapa konto och profil</li>
                  <li className="text-xs text-[#CFE8D6] leading-relaxed list-disc">Skapa matcher och testa flöden</li>
                  <li className="text-xs text-[#CFE8D6] leading-relaxed list-disc">Utforska appen och ge feedback</li>
                </ul>
              </div>

              {/* Don'ts */}
              <div>
                <h3 className="text-sm font-bold text-[#F4743B] mb-3 flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Det här ska du inte göra än:
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="text-xs text-[#FDE3D2] leading-relaxed list-disc">Använd inte appen för riktiga matcher</li>
                  <li className="text-xs text-[#FDE3D2] leading-relaxed list-disc">Gå inte till planer i verkligheten baserat på matcherna i appen</li>
                </ul>
              </div>

              <div className="p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <p className="text-xs text-[#B6C2BC] leading-relaxed">
                  All data i den här versionen är endast till för test och preview.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleClose}
                className="w-full h-12 rounded-[16px] bg-gradient-to-r from-[#2BA84A] to-[#248232] text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_4px_16px_rgba(43,168,74,0.4)]"
              >
                Jag förstår – ta mig in i appen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
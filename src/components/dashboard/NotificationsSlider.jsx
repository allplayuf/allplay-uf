import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Users, X, Trophy, Bell, Target } from "lucide-react";

export default function NotificationsSlider({ notifications = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState([]);

  const activeNotifications = notifications.filter((_, i) => !dismissed.includes(i));

  useEffect(() => {
    if (activeNotifications.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeNotifications.length]);

  if (activeNotifications.length === 0) return null;

  const currentNotif = activeNotifications[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeNotifications.length) % activeNotifications.length);
  };

  const handleDismiss = () => {
    const originalIndex = notifications.findIndex(n => n === currentNotif);
    setDismissed([...dismissed, originalIndex]);
    if (currentIndex >= activeNotifications.length - 1) {
      setCurrentIndex(Math.max(0, activeNotifications.length - 2));
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'venue': return MapPin;
      case 'feature': return Sparkles;
      case 'social': return Users;
      case 'match': return Trophy;
      case 'reminder': return Bell;
      case 'achievement': return Target;
      default: return Sparkles;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'venue': return { bg: 'from-[#2BA84A]/20 to-[#248232]/10', border: 'border-[#2BA84A]/30', text: 'text-[#2BA84A]', glow: 'shadow-[0_0_20px_rgba(43,168,74,0.3)]' };
      case 'feature': return { bg: 'from-[#F4743B]/20 to-[#E5683A]/10', border: 'border-[#F4743B]/30', text: 'text-[#F4743B]', glow: 'shadow-[0_0_20px_rgba(244,116,59,0.3)]' };
      case 'social': return { bg: 'from-[#9370DB]/20 to-[#7C3AED]/10', border: 'border-[#9370DB]/30', text: 'text-[#9370DB]', glow: 'shadow-[0_0_20px_rgba(147,112,219,0.3)]' };
      case 'match': return { bg: 'from-[#FFD700]/20 to-[#FFA500]/10', border: 'border-[#FFD700]/30', text: 'text-[#FFD700]', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.3)]' };
      case 'reminder': return { bg: 'from-[#14B8A6]/20 to-[#0D9488]/10', border: 'border-[#14B8A6]/30', text: 'text-[#14B8A6]', glow: 'shadow-[0_0_20px_rgba(20,184,166,0.3)]' };
      case 'achievement': return { bg: 'from-[#EC4899]/20 to-[#DB2777]/10', border: 'border-[#EC4899]/30', text: 'text-[#EC4899]', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]' };
      default: return { bg: 'from-[#F4743B]/20 to-[#E5683A]/10', border: 'border-[#F4743B]/30', text: 'text-[#F4743B]', glow: 'shadow-[0_0_20px_rgba(244,116,59,0.3)]' };
    }
  };

  const Icon = getIcon(currentNotif.type);
  const colors = getColor(currentNotif.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-gradient-to-br from-[#121715] to-[#0F1513] rounded-xl sm:rounded-2xl border border-[#223029] p-3 sm:p-4 overflow-hidden ${colors.glow}`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {activeNotifications.length > 1 && (
          <button
            onClick={handlePrev}
            className="hidden sm:flex w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] items-center justify-center transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-[#B6C2BC]" />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0"
          >
            <motion.div 
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text}`} strokeWidth={2.5} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-[#F4F7F5] leading-snug truncate">{currentNotif.title}</p>
              {currentNotif.subtitle && (
                <p className="text-[10px] sm:text-xs text-[#B6C2BC] truncate">{currentNotif.subtitle}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleDismiss}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B6C2BC]" />
        </button>

        {activeNotifications.length > 1 && (
          <button
            onClick={handleNext}
            className="hidden sm:flex w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] items-center justify-center transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4 text-[#B6C2BC]" />
          </button>
        )}
      </div>

      {activeNotifications.length > 1 && (
        <div className="flex gap-1 mt-2 sm:mt-3 justify-center">
          {activeNotifications.map((_, index) => (
            <motion.div
              key={index}
              animate={{
                width: index === currentIndex ? '24px' : '4px',
                backgroundColor: index === currentIndex ? '#2BA84A' : '#223029'
              }}
              className="h-1 rounded-full"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
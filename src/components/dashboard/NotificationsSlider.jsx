import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Users, X } from "lucide-react";

export default function NotificationsSlider({ notifications = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState([]);

  const activeNotifications = notifications.filter((_, i) => !dismissed.includes(i));

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
      default: return Sparkles;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'venue': return { bg: 'from-[#2BA84A]/20 to-[#248232]/10', border: 'border-[#2BA84A]/30', text: 'text-[#2BA84A]' };
      case 'feature': return { bg: 'from-[#F4743B]/20 to-[#E5683A]/10', border: 'border-[#F4743B]/30', text: 'text-[#F4743B]' };
      case 'social': return { bg: 'from-[#9370DB]/20 to-[#7C3AED]/10', border: 'border-[#9370DB]/30', text: 'text-[#9370DB]' };
      default: return { bg: 'from-[#F4743B]/20 to-[#E5683A]/10', border: 'border-[#F4743B]/30', text: 'text-[#F4743B]' };
    }
  };

  const Icon = getIcon(currentNotif.type);
  const colors = getColor(currentNotif.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-[#121715] to-[#0F1513] rounded-2xl border border-[#223029] p-4 overflow-hidden"
    >
      <div className="flex items-center gap-3">
        {activeNotifications.length > 1 && (
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors flex-shrink-0"
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
            className="flex-1 flex items-center gap-3 min-w-0"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${colors.text}`} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F4F7F5] leading-snug truncate">{currentNotif.title}</p>
              {currentNotif.subtitle && (
                <p className="text-xs text-[#B6C2BC] truncate">{currentNotif.subtitle}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleDismiss}
          className="w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-[#B6C2BC]" />
        </button>

        {activeNotifications.length > 1 && (
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4 text-[#B6C2BC]" />
          </button>
        )}
      </div>

      {activeNotifications.length > 1 && (
        <div className="flex gap-1 mt-3 justify-center">
          {activeNotifications.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex ? 'w-6 bg-[#2BA84A]' : 'w-1 bg-[#223029]'
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
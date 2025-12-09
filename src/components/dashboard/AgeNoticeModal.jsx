import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";

export default function AgeNoticeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#121715] border border-[#223029] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-[#F59E0B]/20">
              <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#F4F7F5]">18-årsgräns</h2>
              <p className="text-[#B6C2BC] leading-relaxed">
                Observera att AllPlay just nu endast är till för personer som är över 18 år.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-[#2BA84A] hover:bg-[#248232] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Jag förstår</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
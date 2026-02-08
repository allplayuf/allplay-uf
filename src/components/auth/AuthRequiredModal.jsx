/**
 * Auth Required Modal
 * Central modal shown when guest users attempt auth-required actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/supabase';
import { AUTH_COPY } from './authConfig';

export function AuthRequiredModal({ isOpen, onClose, actionKey, onLoginSuccess }) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const copy = AUTH_COPY[actionKey] || AUTH_COPY.default;

  const handleOpenLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    onClose();
    onLoginSuccess?.();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md mx-4 bg-[#121715] border border-[#223029] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative p-6 bg-gradient-to-br from-[#2BA84A]/20 to-[#0F2917]/20 border-b border-[#223029]">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#18221E] hover:bg-[#223029] text-[#B6C2BC] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-[#2BA84A]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F4F7F5]">{copy.title}</h2>
                    <p className="text-sm text-[#B6C2BC]">Skapa konto eller logga in</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <p className="text-[#B6C2BC] leading-relaxed">
                  {copy.description}
                </p>

                {/* Benefits */}
                <div className="bg-[#18221E] rounded-xl p-4 space-y-2">
                  <p className="text-[#F4F7F5] font-semibold text-sm mb-3">Med ett konto kan du:</p>
                  <div className="space-y-2 text-sm text-[#B6C2BC]">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-[#2BA84A] flex-shrink-0" />
                      <span>Gå med i matcher och spela med andra</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-[#2BA84A] flex-shrink-0" />
                      <span>Skapa egna matcher och lag</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-[#2BA84A] flex-shrink-0" />
                      <span>Samla MVPs och bygg din profil</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-[#2BA84A] flex-shrink-0" />
                      <span>Hitta vänner och delta i turneringar</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleOpenLogin}
                    className="w-full h-12 bg-[#2BA84A] hover:bg-[#248232] text-white font-bold rounded-xl transition-all"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Logga in / Skapa konto
                  </Button>

                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full h-12 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] rounded-xl font-semibold"
                  >
                    Fortsätt som gäst
                  </Button>
                </div>

                <p className="text-center text-xs text-[#7B8A83]">
                  Som gäst kan du bläddra bland matcher och planer
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
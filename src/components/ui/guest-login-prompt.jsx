/**
 * Guest Login Prompt
 * 
 * Unified modal/prompt shown when guests try protected actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, X } from 'lucide-react';
import { Button } from './button';
import { LoginModal } from '@/components/supabase';

const FEATURE_MESSAGES = {
  'join_match': 'gå med i matcher',
  'create_match': 'skapa matcher',
  'add_friend': 'lägga till vänner',
  'chat': 'chatta',
  'join_team': 'gå med i lag',
  'create_team': 'skapa lag',
  'join_cup': 'delta i cuper',
  'edit_profile': 'redigera din profil',
  'invite': 'bjuda in andra',
  'view_profile': 'se din profil',
  'protected_action': 'använda denna funktion'
};

export function GuestLoginPrompt({ 
  isOpen, 
  onClose, 
  feature = 'protected_action',
  title = 'Skapa ett konto',
  customMessage = null
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const message = customMessage || FEATURE_MESSAGES[feature] || feature;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#121715] rounded-2xl border border-[#223029] shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-[#2BA84A]/20 to-[#F4743B]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/30">
                  <UserPlus className="w-8 h-8 text-[#2BA84A]" />
                </div>
                
                {/* Title */}
                <h2 className="text-xl font-bold text-[#F4F7F5] mb-2">{title}</h2>
                
                {/* Message */}
                <p className="text-[#B6C2BC] text-sm mb-6">
                  Du måste vara inloggad för att {message}. Skapa ett gratis konto för att komma igång!
                </p>
                
                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white h-11 rounded-xl gap-2 font-semibold"
                  >
                    <LogIn className="w-4 h-4" />
                    Logga in / Skapa konto
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full h-11 rounded-xl border-[#223029] text-[#B6C2BC] hover:bg-[#18221E]"
                  >
                    Fortsätt som gäst
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => {
          setShowLoginModal(false);
          onClose();
        }}
        onSuccess={() => {
          setShowLoginModal(false);
          onClose();
        }}
      />
    </>
  );
}

/**
 * Hook for managing guest login prompts
 */
export function useGuestLoginPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState('protected_action');
  const [customTitle, setCustomTitle] = useState(null);
  const [customMessage, setCustomMessage] = useState(null);

  const showPrompt = (featureName, options = {}) => {
    setFeature(featureName);
    setCustomTitle(options.title || null);
    setCustomMessage(options.message || null);
    setIsOpen(true);
  };

  const closePrompt = () => {
    setIsOpen(false);
    setFeature('protected_action');
    setCustomTitle(null);
    setCustomMessage(null);
  };

  const Prompt = () => (
    <GuestLoginPrompt
      isOpen={isOpen}
      onClose={closePrompt}
      feature={feature}
      title={customTitle}
      customMessage={customMessage}
    />
  );

  return {
    showPrompt,
    closePrompt,
    Prompt
  };
}
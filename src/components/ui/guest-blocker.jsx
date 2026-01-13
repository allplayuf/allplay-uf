import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { Button } from "./button";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { isGuest } from "../utils/permissions";
import { useQuery } from "@tanstack/react-query";

/**
 * GuestBlocker - Wraps protected actions and shows login prompt for guests
 * 
 * Usage:
 * <GuestBlocker feature="join_match" fallback={<LoginPrompt />}>
 *   <Button onClick={handleJoin}>Gå med</Button>
 * </GuestBlocker>
 */
export function GuestBlocker({ 
  children, 
  feature = "protected_action",
  showInline = false,
  onBlock = null,
  className = ""
}) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    staleTime: 10 * 60 * 1000,
  });

  const handleProtectedAction = () => {
    if (onBlock) {
      onBlock();
    } else {
      base44.auth.redirectToLogin(window.location.pathname);
    }
  };

  // If authenticated, render children normally
  if (!isGuest(user)) {
    return children;
  }

  // If guest and showInline, show inline prompt
  if (showInline) {
    return (
      <div className={`bg-[#121715] border border-[#223029] rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#F4743B]/20 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#F4743B]" />
          </div>
          <div>
            <p className="font-medium text-[#F4F7F5] text-sm">Logga in krävs</p>
            <p className="text-xs text-[#7B8A83]">Du måste vara inloggad för denna funktion</p>
          </div>
        </div>
        <Button
          onClick={handleProtectedAction}
          className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white h-10 rounded-xl gap-2"
        >
          <LogIn className="w-4 h-4" />
          Logga in
        </Button>
      </div>
    );
  }

  // Default: Clone children and intercept onClick
  return React.cloneElement(children, {
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleProtectedAction();
    }
  });
}

/**
 * GuestOverlay - Shows overlay on protected content for guests
 */
export function GuestOverlay({ 
  children, 
  message = "Logga in för att använda denna funktion",
  className = ""
}) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    staleTime: 10 * 60 * 1000,
  });

  if (!isGuest(user)) {
    return children;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#0F1513]/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10"
      >
        <div className="w-14 h-14 bg-[#F4743B]/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-[#F4743B]/30">
          <Lock className="w-7 h-7 text-[#F4743B]" />
        </div>
        <p className="text-[#F4F7F5] font-medium text-center mb-4 px-4">{message}</p>
        <Button
          onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
          className="bg-[#2BA84A] hover:bg-[#248232] text-white h-10 px-6 rounded-xl gap-2"
        >
          <LogIn className="w-4 h-4" />
          Logga in
        </Button>
      </motion.div>
    </div>
  );
}

/**
 * GuestModal - Modal that appears when guest tries protected action
 */
export function GuestModal({ isOpen, onClose, feature = "denna funktion" }) {
  if (!isOpen) return null;

  const featureMessages = {
    'join_match': 'gå med i matcher',
    'create_match': 'skapa matcher',
    'add_friend': 'lägga till vänner',
    'chat': 'chatta',
    'join_team': 'gå med i lag',
    'create_team': 'skapa lag',
    'join_cup': 'delta i cuper',
    'edit_profile': 'redigera din profil',
    'invite': 'bjuda in andra'
  };

  const message = featureMessages[feature] || feature;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[#121715] rounded-2xl border border-[#223029] shadow-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2BA84A]/20 to-[#F4743B]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/30">
              <UserPlus className="w-8 h-8 text-[#2BA84A]" />
            </div>
            <h2 className="text-xl font-bold text-[#F4F7F5] mb-2">Skapa ett konto</h2>
            <p className="text-[#B6C2BC] text-sm mb-6">
              Du måste vara inloggad för att {message}. Skapa ett gratis konto för att komma igång!
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
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
    </AnimatePresence>
  );
}

/**
 * useGuestBlock - Hook for handling guest-blocked actions
 */
export function useGuestBlock() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    staleTime: 10 * 60 * 1000,
  });
  
  const [showModal, setShowModal] = React.useState(false);
  const [blockedFeature, setBlockedFeature] = React.useState(null);

  const checkAuth = (feature, callback) => {
    if (isGuest(user)) {
      setBlockedFeature(feature);
      setShowModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  const GuestBlockModal = () => (
    <GuestModal 
      isOpen={showModal} 
      onClose={() => setShowModal(false)} 
      feature={blockedFeature}
    />
  );

  return {
    isGuest: isGuest(user),
    checkAuth,
    GuestBlockModal,
    showModal,
    setShowModal
  };
}
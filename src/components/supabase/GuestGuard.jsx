/**
 * Guest Guard Components
 * 
 * ARCHITECTURE: UI gating only - backend RLS is source of truth
 * - These components only hide/show UI elements
 * - They do NOT provide security - that's handled by Supabase RLS
 * - Used to improve UX by showing login prompts for protected actions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from './AuthProvider';
import LoginModal from './LoginModal';

/**
 * Hook for handling guest-blocked actions
 * Returns a function to check auth and show login modal if needed
 */
export function useGuestGuard() {
  const { isGuest, isAuthenticated } = useSupabaseAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const checkAuth = (actionCallback) => {
    if (isGuest) {
      setPendingAction(() => actionCallback);
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const executeAction = async (actionCallback) => {
    if (isGuest) {
      setPendingAction(() => actionCallback);
      setShowLoginModal(true);
      return false;
    }
    await actionCallback();
    return true;
  };

  const handleLoginSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const LoginModalComponent = () => (
    <LoginModal
      isOpen={showLoginModal}
      onClose={() => {
        setShowLoginModal(false);
        setPendingAction(null);
      }}
      onSuccess={handleLoginSuccess}
    />
  );

  return {
    isGuest,
    isAuthenticated,
    checkAuth,
    executeAction,
    showLoginModal,
    setShowLoginModal,
    LoginModal: LoginModalComponent
  };
}

/**
 * Button that requires authentication
 * Shows login modal when clicked by guest
 */
export function AuthRequiredButton({ 
  children, 
  onClick, 
  disabled,
  className,
  variant = 'default',
  ...props 
}) {
  const { isGuest, executeAction, LoginModal } = useGuestGuard();

  const handleClick = async (e) => {
    if (isGuest) {
      e.preventDefault();
      e.stopPropagation();
      await executeAction(onClick);
    } else if (onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        className={className}
        variant={variant}
        {...props}
      >
        {isGuest && <Lock className="w-3 h-3 mr-1.5 opacity-70" />}
        {children}
      </Button>
      <LoginModal />
    </>
  );
}

/**
 * Overlay for guest users on protected content
 */
export function GuestOverlay({ 
  children, 
  message = 'Du måste vara inloggad för att fortsätta',
  showOverlay = true 
}) {
  const { isGuest } = useSupabaseAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!isGuest || !showOverlay) {
    return children;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-[#121715]/80 backdrop-blur-sm rounded-2xl"
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-[#2BA84A]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#2BA84A]" />
          </div>
          <p className="text-[#F4F7F5] font-medium mb-4">{message}</p>
          <Button
            onClick={() => setShowLoginModal(true)}
            className="bg-[#2BA84A] hover:bg-[#248232] text-white font-bold"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Logga in
          </Button>
        </div>
      </motion.div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

/**
 * Component that only renders for authenticated users
 */
export function AuthOnly({ children, fallback = null }) {
  const { isGuest, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return null;
  }

  if (isGuest) {
    return fallback;
  }

  return children;
}

/**
 * Component that only renders for users with specific roles
 */
export function RoleOnly({ children, roles = [], fallback = null }) {
  const { hasRole, isGuest, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return null;
  }

  if (isGuest) {
    return fallback;
  }

  const hasRequiredRole = roles.some(role => hasRole(role));
  if (!hasRequiredRole) {
    return fallback;
  }

  return children;
}

/**
 * Admin only component
 */
export function AdminOnly({ children, fallback = null }) {
  return (
    <RoleOnly roles={['admin']} fallback={fallback}>
      {children}
    </RoleOnly>
  );
}

/**
 * Cup admin only component
 */
export function CupAdminOnly({ children, fallback = null }) {
  return (
    <RoleOnly roles={['admin', 'cup_admin']} fallback={fallback}>
      {children}
    </RoleOnly>
  );
}

/**
 * Moderator only component
 */
export function ModeratorOnly({ children, fallback = null }) {
  return (
    <RoleOnly roles={['admin', 'moderator']} fallback={fallback}>
      {children}
    </RoleOnly>
  );
}

export default {
  useGuestGuard,
  AuthRequiredButton,
  GuestOverlay,
  AuthOnly,
  RoleOnly,
  AdminOnly,
  CupAdminOnly,
  ModeratorOnly
};
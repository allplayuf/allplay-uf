/**
 * useRequireAuth Hook
 * Guards actions that require authentication
 */

import { useState, useCallback } from 'react';
import { useSupabaseAuth } from '@/components/supabase/AuthProvider';

export function useRequireAuth() {
  const { isAuthenticated, isGuest } = useSupabaseAuth();
  const [modalState, setModalState] = useState({
    isOpen: false,
    actionKey: null,
    onSuccess: null
  });

  /**
   * Check if action requires auth and show modal if needed
   * @param {string} actionKey - Action identifier from AUTH_ACTIONS
   * @param {Function} callback - Function to execute if authenticated
   * @returns {Promise<boolean>} - True if authenticated, false if blocked
   */
  const requireAuth = useCallback(async (actionKey, callback) => {
    if (isAuthenticated) {
      // User is authenticated, execute callback
      if (callback) {
        await callback();
      }
      return true;
    }

    // User is guest, show modal
    setModalState({
      isOpen: true,
      actionKey,
      onSuccess: callback
    });

    return false;
  }, [isAuthenticated]);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      actionKey: null,
      onSuccess: null
    });
  }, []);

  const handleLoginSuccess = useCallback(() => {
    closeModal();
    // Execute the callback after successful login if provided
    if (modalState.onSuccess) {
      modalState.onSuccess();
    }
  }, [modalState.onSuccess, closeModal]);

  return {
    requireAuth,
    isAuthenticated,
    isGuest,
    modalState,
    closeModal,
    handleLoginSuccess
  };
}
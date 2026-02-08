/**
 * AuthGate Wrapper Component
 * Wraps components that require authentication
 * Usage: <AuthGate action="join_match">{(run) => <Button onClick={run(handleJoin)}>Join</Button>}</AuthGate>
 */

import React from 'react';
import { useRequireAuth } from './useRequireAuth';
import { AuthRequiredModal } from './AuthRequiredModal';

export function AuthGate({ action, children, fallback = null }) {
  const { requireAuth, isAuthenticated, modalState, closeModal, handleLoginSuccess } = useRequireAuth();

  /**
   * Wraps a function to require auth
   * @param {Function} fn - The function to wrap
   * @returns {Function} - Wrapped function that checks auth first
   */
  const run = (fn) => {
    return async (...args) => {
      const isAuth = await requireAuth(action, () => fn(...args));
      if (!isAuth) {
        // Auth required modal will be shown
        return;
      }
    };
  };

  // If not authenticated and fallback provided, show fallback
  if (!isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      {children(run)}
      
      <AuthRequiredModal
        isOpen={modalState.isOpen && modalState.actionKey === action}
        onClose={closeModal}
        actionKey={action}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
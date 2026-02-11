/**
 * ConsentChecker - wraps app content
 * If authenticated user hasn't accepted current ToS version in this session, shows ConsentGate.
 * Acceptance is purely client-side (session state) - no backend save required.
 */
import React, { useState } from "react";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { CONSENT_VERSION } from "./consentConstants";
import ConsentGate from "./ConsentGate";

export default function ConsentChecker({ children }) {
  const { isAuthenticated, isGuest, isLoading, logout } = useSupabaseAuth();
  const [accepted, setAccepted] = useState(() => {
    try {
      return sessionStorage.getItem('allplay_tos_accepted') === CONSENT_VERSION;
    } catch { return false; }
  });

  const handleAccept = () => {
    try { sessionStorage.setItem('allplay_tos_accepted', CONSENT_VERSION); } catch {}
    setAccepted(true);
  };

  const handleCancel = () => {
    logout();
  };

  if (isLoading) return children;
  if (isGuest || !isAuthenticated) return children;

  if (!accepted) {
    return (
      <ConsentGate
        isSignup={false}
        onAccept={handleAccept}
        onCancel={handleCancel}
      />
    );
  }

  return children;
}
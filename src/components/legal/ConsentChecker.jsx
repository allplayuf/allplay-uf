/**
 * ConsentChecker - wraps app content
 * If authenticated user hasn't accepted current ToS version, shows ConsentGate.
 * Acceptance is persisted on the user's profile via updateMe so it survives sessions.
 */
import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { CONSENT_VERSION } from "./consentConstants";
import ConsentGate from "./ConsentGate";
import { base44 } from "@/api/base44Client";

export default function ConsentChecker({ children }) {
  const { isAuthenticated, isGuest, isLoading, logout, user } = useSupabaseAuth();
  const [accepted, setAccepted] = useState(null); // null = checking, true/false = known
  const [saving, setSaving] = useState(false);

  // Check if user already accepted this version (from user profile data)
  useEffect(() => {
    if (isLoading || isGuest || !isAuthenticated || !user) {
      setAccepted(null);
      return;
    }

    // Check localStorage first (persists across page reloads within session)
    try {
      if (localStorage.getItem('allplay_tos_accepted') === CONSENT_VERSION) {
        setAccepted(true);
        return;
      }
    } catch {}

    // Check user metadata for consent version
    const userConsentVersion = user.tos_version_accepted;
    if (userConsentVersion === CONSENT_VERSION) {
      try { localStorage.setItem('allplay_tos_accepted', CONSENT_VERSION); } catch {}
      setAccepted(true);
    } else {
      // Also check sessionStorage as fallback
      try {
        if (sessionStorage.getItem('allplay_tos_accepted') === CONSENT_VERSION) {
          setAccepted(true);
          return;
        }
      } catch {}
      setAccepted(false);
    }
  }, [isLoading, isGuest, isAuthenticated, user]);

  const handleAccept = async () => {
    setSaving(true);
    try {
      // Save to user profile so it persists across sessions
      await base44.auth.updateMe({ 
        tos_version_accepted: CONSENT_VERSION,
        tos_accepted_at: new Date().toISOString(),
        tos_accepted_doc: 'tos_privacy_combined'
      });
      // Persist acceptance locally so modal never re-appears this session
      try { localStorage.setItem('allplay_tos_accepted', CONSENT_VERSION); } catch {}
      try { sessionStorage.setItem('allplay_tos_accepted', CONSENT_VERSION); } catch {}
      setAccepted(true);
    } catch (err) {
      console.error('Failed to save consent:', err);
      try { localStorage.setItem('allplay_tos_accepted', CONSENT_VERSION); } catch {}
      try { sessionStorage.setItem('allplay_tos_accepted', CONSENT_VERSION); } catch {}
      setAccepted(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    logout();
  };

  if (isLoading || accepted === null) return children;
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
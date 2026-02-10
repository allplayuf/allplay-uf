/**
 * ConsentChecker - wraps app content
 * If authenticated user hasn't accepted current ToS version, shows ConsentGate
 */
import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CONSENT_VERSION, CONSENT_DOC } from "./consentConstants";
import ConsentGate from "./ConsentGate";

export default function ConsentChecker({ children }) {
  const { isAuthenticated, isGuest, isLoading, logout } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState(null);

  // Only check consent for authenticated users
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  // Check for pending consent from signup (email verification flow)
  useEffect(() => {
    if (!isAuthenticated || !user || user.tos_version_accepted === CONSENT_VERSION) return;
    
    try {
      const pending = localStorage.getItem('allplay_pending_consent');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed.version === CONSENT_VERSION) {
          // Auto-save pending consent
          savePendingConsent(parsed);
        }
      }
    } catch (e) { /* ignore */ }
  }, [isAuthenticated, user]);

  const savePendingConsent = async (pending) => {
    try {
      await base44.auth.updateMe({
        tos_version_accepted: pending.version,
        tos_accepted_at: pending.accepted_at,
        tos_accepted_doc: pending.doc
      });
      localStorage.removeItem('allplay_pending_consent');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (e) {
      console.error('Failed to save pending consent:', e);
    }
  };

  const handleAccept = async () => {
    setConsentError(null);
    setConsentLoading(true);
    try {
      await base44.auth.updateMe({
        tos_version_accepted: CONSENT_VERSION,
        tos_accepted_at: new Date().toISOString(),
        tos_accepted_doc: CONSENT_DOC
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (e) {
      setConsentError('Kunde inte spara samtycke. Försök igen.');
    } finally {
      setConsentLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
  };

  // If loading, don't block
  if (isLoading || userLoading) return children;
  
  // Guest users skip consent check
  if (isGuest || !isAuthenticated) return children;

  // Check if user has accepted current version
  if (user && user.tos_version_accepted !== CONSENT_VERSION) {
    return (
      <ConsentGate
        isSignup={false}
        isLoading={consentLoading}
        error={consentError}
        onAccept={handleAccept}
        onCancel={handleCancel}
      />
    );
  }

  return children;
}
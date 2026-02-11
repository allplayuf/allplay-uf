/**
 * ConsentChecker - wraps app content
 * If authenticated user hasn't accepted current ToS version, shows ConsentGate
 * 
 * Uses Supabase auth (source of truth) and Supabase users table for consent data.
 * Does NOT use base44.auth (which is a separate session that may not be synced).
 */
import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CONSENT_VERSION, CONSENT_DOC, CONSENT_STORAGE_KEY } from "./consentConstants";
import { getMyProfile } from "@/components/supabase/services/usersService";
import { callEdgeFunction } from "@/components/supabase/callEdgeFunction";
import ConsentGate from "./ConsentGate";

export default function ConsentChecker({ children }) {
  const { isAuthenticated, isGuest, isLoading, user: authUser, logout } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState(null);

  // Fetch Supabase profile to check tos_version_accepted
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['supabase-consent-check', authUser?.id],
    queryFn: () => getMyProfile(),
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Check for pending consent from signup (email verification flow)
  useEffect(() => {
    if (!isAuthenticated || !profile) return;
    if (profile.tos_version_accepted === CONSENT_VERSION) return;
    
    try {
      const pending = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed.version === CONSENT_VERSION) {
          savePendingConsent(parsed);
        }
      }
    } catch (e) { /* ignore */ }
  }, [isAuthenticated, profile]);

  const savePendingConsent = async (pending) => {
    try {
      await callEdgeFunction('update_profile', {
        tos_version_accepted: pending.version,
        tos_accepted_at: pending.accepted_at,
        tos_accepted_doc: pending.doc
      });
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      queryClient.invalidateQueries({ queryKey: ['supabase-consent-check'] });
    } catch (e) {
      console.error('Failed to save pending consent:', e);
    }
  };

  const handleAccept = async () => {
    setConsentError(null);
    setConsentLoading(true);
    try {
      await callEdgeFunction('update_profile', {
        tos_version_accepted: CONSENT_VERSION,
        tos_accepted_at: new Date().toISOString(),
        tos_accepted_doc: CONSENT_DOC
      });
      queryClient.invalidateQueries({ queryKey: ['supabase-consent-check'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] });
    } catch (e) {
      setConsentError('Kunde inte spara samtycke. Försök igen.');
    } finally {
      setConsentLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
  };

  // If loading, don't block - render children
  if (isLoading || profileLoading) return children;
  
  // Guest users skip consent check
  if (isGuest || !isAuthenticated) return children;

  // Check if user has accepted current version
  if (profile && profile.tos_version_accepted !== CONSENT_VERSION) {
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
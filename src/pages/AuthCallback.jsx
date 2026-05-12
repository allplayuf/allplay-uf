import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, sessionStore, AUTH_STATES } from '@/components/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const didNavigate = useRef(false);

  function goToDashboard() {
    if (!didNavigate.current) {
      didNavigate.current = true;
      navigate('/dashboard', { replace: true });
    }
  }

  useEffect(() => {
    let isMounted = true;

    // Listen for SIGNED_IN equivalent — navigate as soon as session is confirmed
    const unsubscribe = sessionStore.subscribe((state) => {
      if (isMounted && state.authState === AUTH_STATES.AUTHENTICATED) {
        goToDashboard();
      }
    });

    async function handleCallback() {
      try {
        // init() loads persisted session and runs detectSessionInUrl (hash tokens)
        await supabaseClient.init();

        // If init() already resolved a session (hash tokens or existing session), we're done
        if (sessionStore.authState === AUTH_STATES.AUTHENTICATED) {
          goToDashboard();
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          // PKCE flow — verifier stored in localStorage (survives cross-origin redirects)
          const verifier = localStorage.getItem('allplay_pkce_verifier') || '';
          localStorage.removeItem('allplay_pkce_verifier');
          const redirectTo = `${window.location.origin}/auth/callback`;
          const result = await supabaseClient.exchangeCodeForSession(code, verifier, redirectTo);
          if (result.error) {
            console.error('[AuthCallback] PKCE exchange failed:', result.error);
          }
          // exchangeCodeForSession sets AUTHENTICATED on success → subscriber above navigates
        }
      } catch (e) {
        console.error('[AuthCallback]', e);
      }

      // Fallback redirect after 4 s in case subscriber never fires
      setTimeout(() => isMounted && goToDashboard(), 4000);
    }

    handleCallback();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen bg-[#0F1513] flex flex-col items-center justify-center gap-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="w-8 h-8 border-2 border-[#2BA84A]/30 border-t-[#2BA84A] rounded-full animate-spin" />
      <p className="text-sm text-[#8FA097]">Loggar in...</p>
    </div>
  );
}

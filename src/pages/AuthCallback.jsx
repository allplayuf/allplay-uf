import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, sessionStore, AUTH_STATES } from '@/components/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const didNavigate = useRef(false);
  const [callbackError, setCallbackError] = useState(null);

  function goToDashboard() {
    if (!didNavigate.current) {
      didNavigate.current = true;
      navigate('/dashboard', { replace: true });
    }
  }

  useEffect(() => {
    let isMounted = true;

    const rawSearch = window.location.search;
    const rawHash = window.location.hash;
    const pkceVerifier = localStorage.getItem('allplay_pkce_verifier') || '';

    const searchParams = new URLSearchParams(rawSearch);
    const hashParams = new URLSearchParams(rawHash.substring(1));
    const oauthError = searchParams.get('error') || hashParams.get('error');
    const oauthErrorDesc = searchParams.get('error_description') || hashParams.get('error_description');

    if (oauthError) {
      setCallbackError({
        stage: 'oauth_redirect',
        message: oauthErrorDesc || oauthError,
        rawSearch,
        rawHash,
        hadVerifier: !!pkceVerifier,
      });
      return;
    }

    // Navigate as soon as session becomes AUTHENTICATED (set by exchange below)
    const unsubscribe = sessionStore.subscribe((state) => {
      if (isMounted && state.authState === AUTH_STATES.AUTHENTICATED) {
        goToDashboard();
      }
    });

    async function handleCallback() {
      try {
        await supabaseClient.init();

        const code = searchParams.get('code');

        if (code) {
          // Always exchange the code when present — never skip this based on
          // an existing session, because the user intentionally went through
          // OAuth and must get a session for that provider.
          localStorage.removeItem('allplay_pkce_verifier');
          const redirectTo = `${window.location.origin}/auth/callback`;
          const result = await supabaseClient.exchangeCodeForSession(code, pkceVerifier, redirectTo);
          if (result.error) {
            if (isMounted) {
              setCallbackError({
                stage: 'pkce_exchange',
                message: result.error.message || 'Kodutbyte misslyckades',
                code: result.error.code,
                rawSearch,
                rawHash,
                hadVerifier: !!pkceVerifier,
              });
            }
            return;
          }
          // exchangeCodeForSession calls setAuthState(AUTHENTICATED) on success
          // → the subscriber above fires and calls goToDashboard()
        } else if (sessionStore.authState === AUTH_STATES.AUTHENTICATED) {
          // No code in URL but already authenticated — go straight to app
          goToDashboard();
        } else {
          if (isMounted) {
            setCallbackError({
              stage: 'no_code',
              message: 'Ingen auth-kod hittades i URL:en',
              rawSearch,
              rawHash,
              hadVerifier: !!pkceVerifier,
            });
          }
        }
      } catch (e) {
        console.error('[AuthCallback]', e);
        if (isMounted) {
          setCallbackError({
            stage: 'exception',
            message: e.message || 'Okänt fel',
            rawSearch,
            rawHash,
            hadVerifier: !!pkceVerifier,
          });
        }
      }
    }

    handleCallback();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (callbackError) {
    return (
      <div
        className="min-h-screen bg-[#0F1513] flex flex-col items-center justify-center gap-6 p-6"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="w-full max-w-sm bg-[#121715] border border-red-900/40 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-900/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
              </svg>
            </div>
            <h2 className="text-[#F4F7F5] font-semibold text-base">Inloggning misslyckades</h2>
          </div>

          <p className="text-[#B6C2BC] text-sm">{callbackError.message}</p>

          <details className="text-xs text-[#8FA097] border border-[#223029] rounded-lg p-3 cursor-pointer">
            <summary className="font-mono select-none">Diagnostik</summary>
            <div className="mt-2 space-y-1 font-mono break-all">
              <div><span className="text-[#2BA84A]">stage:</span> {callbackError.stage}</div>
              {callbackError.code != null && <div><span className="text-[#2BA84A]">code:</span> {callbackError.code}</div>}
              <div><span className="text-[#2BA84A]">verifier:</span> {callbackError.hadVerifier ? 'hittades' : 'saknas'}</div>
              <div><span className="text-[#2BA84A]">search:</span> {callbackError.rawSearch || '(tom)'}</div>
              <div><span className="text-[#2BA84A]">hash:</span> {callbackError.rawHash || '(tom)'}</div>
            </div>
          </details>

          <button
            onClick={() => window.location.replace('/')}
            className="w-full h-11 rounded-xl bg-[#2BA84A] hover:bg-[#248232] text-white font-semibold text-sm transition-colors"
          >
            Logga in igen
          </button>
        </div>
      </div>
    );
  }

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

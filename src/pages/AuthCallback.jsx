import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, sessionStore, AUTH_STATES } from '@/components/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          // PKCE flow
          const verifier = sessionStorage.getItem('allplay_pkce_verifier') || '';
          sessionStorage.removeItem('allplay_pkce_verifier');
          const redirectTo = `${window.location.origin}/auth/callback`;
          const result = await supabaseClient.exchangeCodeForSession(code, verifier, redirectTo);
          if (result.error) console.error('[AuthCallback] PKCE exchange failed:', result.error);
        } else {
          // Implicit flow fallback
          const hash = window.location.hash;
          if (hash) {
            const hp = new URLSearchParams(hash.substring(1));
            const accessToken = hp.get('access_token');
            const refreshToken = hp.get('refresh_token');
            const expiresIn = hp.get('expires_in');
            if (accessToken) {
              sessionStore.setTokens(accessToken, refreshToken, Number(expiresIn) || 3600);
              sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
              await supabaseClient.validateSession();
            }
          }
        }
      } catch (e) {
        console.error('[AuthCallback]', e);
      }
      navigate('/dashboard', { replace: true });
    }

    handleCallback();
  }, [navigate]);

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

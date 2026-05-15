import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, User, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from './AuthProvider';
import ConsentGate from '@/components/legal/ConsentGate';
import { CONSENT_VERSION, CONSENT_DOC } from '@/components/legal/consentConstants';

/* ─── Logos ─── */
function AppleLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* ─── Platform flags (evaluated once at module load) ─── */
const _isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
const showAppleSignIn = !Capacitor.isNativePlatform() || _isNativeIOS;
const showGoogleSignIn = !_isNativeIOS;

/* ─── Spinner ─── */
function Spinner({ color = 'border-t-white border-white/20' }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      className={`w-[18px] h-[18px] rounded-full border-2 ${color}`}
    />
  );
}

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { login, signInWithApple, signInWithGoogle, error, clearError } = useSupabaseAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'consent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [consentError, setConsentError] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);

  const anyLoading = isLoading || appleLoading || googleLoading;
  const displayError = localError || error;

  /* ─── Social handlers ─── */
  const handleAppleSignIn = async () => {
    setLocalError(null);
    clearError();
    setAppleLoading(true);
    try {
      const result = await signInWithApple();
      if (result?.redirecting) return;
      if (result?.cancelled) return;
      if (result?.success) { onSuccess?.(); onClose(); }
      else if (result?.error) setLocalError(result.error?.message || 'Apple-inloggning misslyckades. Försök igen.');
    } catch {
      setLocalError('Apple-inloggning misslyckades. Försök igen.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.redirecting) return;
      if (result?.success) { onSuccess?.(); onClose(); }
      else if (result?.error) setLocalError('Google-inloggning misslyckades. Försök igen.');
    } catch {
      setLocalError('Google-inloggning misslyckades. Försök igen.');
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ─── Email/password submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Fyll i både e-post och lösenord');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) { setLocalError('Fyll i ditt namn'); return; }
      if (password.length < 6) { setLocalError('Lösenordet måste vara minst 6 tecken'); return; }
      if (password !== confirmPassword) { setLocalError('Lösenorden matchar inte'); return; }
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        setMode('consent');
        return;
      }

      const result = await login(email, password);
      if (result.success) {
        const pendingDob = localStorage.getItem('allplay_pending_dob');
        if (pendingDob) {
          import('@/api/base44Client').then(({ base44 }) => {
            base44.functions.invoke('verifyAge', { date_of_birth: pendingDob }).catch(() => {});
          }).catch(() => {});
          localStorage.removeItem('allplay_pending_dob');
        }
        onSuccess?.();
        onClose();
      } else {
        const msg = (result.error?.message || '').toLowerCase();
        if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
          setLocalError('Verifiera din e-post först — kolla inkorgen (och skräpposten) och klicka på länken vi skickade.');
        } else if (msg.includes('invalid') || msg.includes('credentials')) {
          setLocalError('Felaktig e-post eller lösenord. Försök igen.');
        } else {
          setLocalError(msg || 'Inloggningen misslyckades. Försök igen.');
        }
      }
    } catch {
      setLocalError('Ett fel uppstod. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Consent + signup completion ─── */
  const handleConsentAccept = async () => {
    setConsentError(null);
    setConsentLoading(true);
    try {
      const { base44 } = await import('@/api/base44Client');
      const { SUPABASE_ANON_KEY: anonKey, SUPABASE_URL: supaUrl } = await import('./config');

      if (!anonKey || anonKey.length < 20) {
        setConsentError('API-nyckel saknas i denna build. Kontakta support.');
        return;
      }

      const response = await fetch(`${supaUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName },
          user_metadata: { full_name: fullName },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error_description || data.msg || data.error || 'Registreringen misslyckades';
        if (msg.includes('already registered')) {
          setConsentError('E-postadressen är redan registrerad. Försök logga in istället.');
        } else if (msg.includes('valid email')) {
          setConsentError('Ange en giltig e-postadress.');
        } else if (msg.includes('password')) {
          setConsentError('Lösenordet måste vara minst 6 tecken.');
        } else {
          setConsentError(msg);
        }
        return;
      }

      // Email-confirmation required path
      if (data.user && !data.session) {
        try {
          const userRow = {
            id: data.user.id,
            email,
            username: email.split('@')[0],
            ...(fullName ? { full_name: fullName, display_name: fullName } : {}),
          };
          await fetch(`${supaUrl}/rest/v1/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify(userRow),
          });
        } catch { /* non-fatal */ }

        try { localStorage.setItem('allplay_pending_consent', JSON.stringify({ version: CONSENT_VERSION, doc: CONSENT_DOC, accepted_at: new Date().toISOString() })); } catch { /* ignore */ }
        try { if (fullName) localStorage.setItem('allplay_pending_fullname', fullName); } catch { /* ignore */ }

        setSuccessMessage('Konto skapat! Vi har skickat ett verifieringsmail till ' + email + '. Klicka på länken i mailet och logga sedan in. Kolla även skräpposten.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      // Immediate session path
      if (data.session || data.access_token) {
        const { sessionStore, AUTH_STATES, supabaseClient } = await import('./client');
        sessionStore.setTokens(data.access_token, data.refresh_token);
        sessionStore.setUser(data.user);
        sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
        await supabaseClient.syncUserToPublicProfile(data.user);
        try {
          await base44.auth.updateMe({ tos_version_accepted: CONSENT_VERSION, tos_accepted_at: new Date().toISOString(), tos_accepted_doc: CONSENT_DOC });
        } catch {
          sessionStore.clear();
          setConsentError('Kunde inte spara samtycke. Försök igen.');
          return;
        }
        onSuccess?.(); onClose();
        return;
      }

      // Fallback: try to log in after signup
      const loginResult = await login(email, password);
      if (loginResult.success) {
        try { await base44.auth.updateMe({ tos_version_accepted: CONSENT_VERSION, tos_accepted_at: new Date().toISOString(), tos_accepted_doc: CONSENT_DOC }); } catch { /* non-fatal */ }
        onSuccess?.(); onClose();
      } else {
        try { localStorage.setItem('allplay_pending_consent', JSON.stringify({ version: CONSENT_VERSION, doc: CONSENT_DOC, accepted_at: new Date().toISOString() })); } catch { /* ignore */ }
        setSuccessMessage('Konto skapat! Kolla din e-post (' + email + ') och klicka på verifieringslänken.');
        setMode('login');
      }
    } catch {
      setConsentError('Ett fel uppstod. Försök igen.');
    } finally {
      setConsentLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setLocalError(null);
    setSuccessMessage(null);
    setConsentError(null);
    clearError();
  };

  /* ─── Consent screen ─── */
  if (mode === 'consent' && isOpen) {
    return (
      <ConsentGate
        isSignup={true}
        isLoading={consentLoading}
        error={consentError}
        onAccept={handleConsentAccept}
        onCancel={() => { setMode('register'); setConsentError(null); }}
      />
    );
  }

  /* ─── Main modal ─── */
  const hasSocialButtons = showAppleSignIn || showGoogleSignIn;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative w-full sm:max-w-[420px] sm:mx-4 bg-[#0D1710] sm:rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: 'calc(96vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-0.5">
              <div className="w-9 h-[3px] rounded-full bg-[#2A3D30]" />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-[#162019] hover:bg-[#1E2D23] text-[#6B8070] hover:text-[#B6C2BC] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="relative px-6 pt-5 pb-4 overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)`,
                  backgroundSize: '28px 28px',
                }}
              />
              <div className="absolute -top-10 -left-10 w-44 h-44 bg-[#2BA84A]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#2BA84A] to-[#1A7A33] flex items-center justify-center">
                    {mode === 'login'
                      ? <LogIn className="w-3 h-3 text-white" strokeWidth={2.5} />
                      : <UserPlus className="w-3 h-3 text-white" strokeWidth={2.5} />}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2BA84A]">AllPlay</span>
                </div>
                <h2 className="text-[22px] font-black text-[#F0F4F1] leading-tight tracking-tight">
                  {mode === 'login' ? 'Välkommen tillbaka' : 'Skapa ditt konto'}
                </h2>
                <p className="text-[13px] text-[#5A7A65] mt-0.5">
                  {mode === 'login' ? 'Logga in för att fortsätta' : 'Gratis att komma igång'}
                </p>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 130px)' }}>
              <div className="px-6 pb-7 space-y-3">

                {/* Alerts */}
                <AnimatePresence mode="wait">
                  {successMessage && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 p-3.5 bg-[#1A3D25] border border-[#2BA84A]/30 rounded-xl text-[#7DE89A] text-[13px]"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2BA84A]" />
                      <span>{successMessage}</span>
                    </motion.div>
                  )}
                  {displayError && !successMessage && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 p-3.5 bg-red-950/50 border border-red-500/25 rounded-xl text-red-300 text-[13px]"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                      <span>{displayError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Social buttons ── */}
                {hasSocialButtons && (
                  <div className={`grid gap-2.5 ${showAppleSignIn && showGoogleSignIn ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {showAppleSignIn && (
                      <button
                        type="button"
                        onClick={handleAppleSignIn}
                        disabled={anyLoading}
                        className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#0A0A0A] hover:bg-[#111] active:bg-[#1A1A1A] text-white font-semibold text-[14px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none border border-[#2A2A2A]"
                      >
                        {appleLoading
                          ? <Spinner color="border-t-white border-white/20" />
                          : <><AppleLogo className="w-[17px] h-[17px] flex-shrink-0 -mt-px" /><span>Apple</span></>}
                      </button>
                    )}
                    {showGoogleSignIn && (
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={anyLoading}
                        className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white hover:bg-[#F8F8F8] active:bg-[#F0F0F0] text-[#1F1F1F] font-semibold text-[14px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none border border-[#E0E0E0]"
                      >
                        {googleLoading
                          ? <Spinner color="border-t-[#4285F4] border-gray-200" />
                          : <><GoogleLogo size={17} /><span>Google</span></>}
                      </button>
                    )}
                  </div>
                )}

                {/* ── Divider ── */}
                {hasSocialButtons && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#1A2820]" />
                    <span className="text-[11px] text-[#3D5448] font-medium tracking-wide">eller med e-post</span>
                    <div className="flex-1 h-px bg-[#1A2820]" />
                  </div>
                )}

                {/* ── Email form ── */}
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {/* Name (register) */}
                  {mode === 'register' && (
                    <div>
                      <Label className="text-[#8A9E92] text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">Namn</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5448]" />
                        <Input
                          type="text"
                          placeholder="Ditt namn"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          autoComplete="name"
                          className="pl-10 h-11 bg-[#0F1A13] border-[#1A2820] text-[#EEF2EE] placeholder:text-[#3D5448] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/25 rounded-xl text-[14px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <Label className="text-[#8A9E92] text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">E-post</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5448]" />
                      <Input
                        type="email"
                        placeholder="din@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete={mode === 'login' ? 'email' : 'email'}
                        className="pl-10 h-11 bg-[#0F1A13] border-[#1A2820] text-[#EEF2EE] placeholder:text-[#3D5448] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/25 rounded-xl text-[14px]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <Label className="text-[#8A9E92] text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">Lösenord</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5448]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={mode === 'register' ? 'Minst 6 tecken' : '••••••••'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="pl-10 pr-11 h-11 bg-[#0F1A13] border-[#1A2820] text-[#EEF2EE] placeholder:text-[#3D5448] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/25 rounded-xl text-[14px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3D5448] hover:text-[#8A9E92] transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password (register) */}
                  {mode === 'register' && (
                    <div>
                      <Label className="text-[#8A9E92] text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">Bekräfta lösenord</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5448]" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Samma lösenord igen"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          className="pl-10 h-11 bg-[#0F1A13] border-[#1A2820] text-[#EEF2EE] placeholder:text-[#3D5448] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/25 rounded-xl text-[14px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-1">
                    <Button
                      type="submit"
                      disabled={anyLoading}
                      className="w-full h-12 bg-gradient-to-b from-[#34C257] to-[#27A043] hover:from-[#3DD668] hover:to-[#2EBD50] text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(43,168,74,0.30)] text-[15px] tracking-[-0.01em]"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Spinner color="border-t-white border-white/20" />
                          {mode === 'login' ? 'Loggar in…' : 'Fortsätter…'}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {mode === 'login'
                            ? <><LogIn className="w-4 h-4" /> Logga in</>
                            : <><UserPlus className="w-4 h-4" /> Skapa konto</>}
                        </span>
                      )}
                    </Button>
                  </div>
                </form>

                {/* ── Switch mode ── */}
                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-[13px] text-[#5A7A65] hover:text-[#8FB09A] transition-colors"
                  >
                    {mode === 'login'
                      ? <>Inget konto? <span className="text-[#2BA84A] font-semibold hover:text-[#35D45F]">Skapa ett gratis</span></>
                      : <>Har du ett konto? <span className="text-[#2BA84A] font-semibold hover:text-[#35D45F]">Logga in</span></>}
                  </button>
                </div>

                {/* Guest note */}
                <p className="text-center text-[11px] text-[#2E4035] pb-0.5">
                  Du kan bläddra bland matcher utan konto
                </p>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Supabase Login Modal
 * Email/password authentication
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, User, UserPlus, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from './AuthProvider';
import ConsentGate from '@/components/legal/ConsentGate';
import { CONSENT_VERSION, CONSENT_DOC } from '@/components/legal/consentConstants';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { login, error, clearError } = useSupabaseAuth();
  const [mode, setMode] = useState('login'); // 'login', 'register', or 'consent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [consentError, setConsentError] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    if (!email || !password) {
      setLocalError('Fyll i både e-post och lösenord');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setLocalError('Fyll i ditt namn');
        return;
      }
      if (password.length < 6) {
        setLocalError('Lösenordet måste vara minst 6 tecken');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Lösenorden matchar inte');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        setMode('consent');
        return;
      } else {
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
            setLocalError('📧 Du behöver verifiera din e-post först! Vi skickade ett mail till dig när du skapade kontot. Kolla din inkorg (och skräppost) och klicka på verifieringslänken.');
          } else if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('invalid login')) {
            setLocalError('Felaktig e-post eller lösenord. Försök igen.');
          } else {
            setLocalError(msg || 'Inloggningen misslyckades. Försök igen.');
          }
        }
      }
    } catch (e) {
      setLocalError('Ett fel uppstod. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle consent acceptance: create account + save consent
  const handleConsentAccept = async () => {
    setConsentError(null);
    setConsentLoading(true);

    try {
      const { base44 } = await import('@/api/base44Client');

      const { SUPABASE_ANON_KEY: anonKey, SUPABASE_URL: supaUrl } = await import('./config');

      if (!anonKey || anonKey.length < 20) {
        console.error('[LoginModal] SUPABASE_ANON_KEY missing in build!', { length: anonKey?.length });
        setConsentError('API-nyckel saknas i denna build. Kontakta support.');
        return;
      }

      console.log('[LoginModal] signup using hardcoded anonKey:', anonKey.slice(0, 8) + '...', 'length:', anonKey.length);

      const response = await fetch(`${supaUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName },
          user_metadata: { full_name: fullName }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error_description || data.msg || data.error || 'Registreringen misslyckades';
        if (errorMsg.includes('already registered')) {
          setConsentError('E-postadressen är redan registrerad. Försök logga in istället.');
        } else if (errorMsg.includes('valid email')) {
          setConsentError('Ange en giltig e-postadress.');
        } else if (errorMsg.includes('password')) {
          setConsentError('Lösenordet måste vara minst 6 tecken.');
        } else {
          setConsentError(errorMsg);
        }
        return;
      }

      if (data.user && !data.session) {
        try {
          const userRow = { id: data.user.id, email };
          if (fullName) {
            userRow.full_name = fullName;
            userRow.display_name = fullName;
          }
          userRow.username = email ? email.split('@')[0] : data.user.id.slice(0, 8);

          await fetch(`${supaUrl}/rest/v1/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(userRow)
          });
          console.log('[LoginModal] Pre-created public.users row for', data.user.id, fullName);
        } catch (syncErr) {
          console.warn('[LoginModal] Failed to pre-create public.users row:', syncErr);
        }

        try {
          localStorage.setItem('allplay_pending_consent', JSON.stringify({
            version: CONSENT_VERSION,
            doc: CONSENT_DOC,
            accepted_at: new Date().toISOString()
          }));
        } catch (e) { /* ignore */ }

        try {
          localStorage.setItem('allplay_pending_fullname', fullName);
        } catch (e) { /* ignore */ }

        setSuccessMessage('📧 Konto skapat! Vi har skickat ett verifieringsmail till ' + email + '. Du MÅSTE klicka på länken i mailet innan du kan logga in. Kolla även skräpposten!');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      if (data.session || data.access_token) {
        const { sessionStore, AUTH_STATES, supabaseClient } = await import('./client');
        sessionStore.setTokens(data.access_token, data.refresh_token);
        sessionStore.setUser(data.user);
        sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);

        await supabaseClient.syncUserToPublicProfile(data.user);

        try {
          await base44.auth.updateMe({
            tos_version_accepted: CONSENT_VERSION,
            tos_accepted_at: new Date().toISOString(),
            tos_accepted_doc: CONSENT_DOC
          });
        } catch (consentErr) {
          console.error('Failed to save consent:', consentErr);
          sessionStore.clear();
          setConsentError('Kunde inte spara samtycke. Försök igen.');
          return;
        }

        onSuccess?.();
        onClose();
        return;
      }

      const loginResult = await login(email, password);
      if (loginResult.success) {
        try {
          await base44.auth.updateMe({
            tos_version_accepted: CONSENT_VERSION,
            tos_accepted_at: new Date().toISOString(),
            tos_accepted_doc: CONSENT_DOC
          });
        } catch (consentErr) {
          console.error('Failed to save consent after login:', consentErr);
        }
        onSuccess?.();
        onClose();
      } else {
        setSuccessMessage('📧 Konto skapat! Kolla din e-post (' + email + ') och klicka på verifieringslänken innan du loggar in. Kolla även skräpposten!');
        try {
          localStorage.setItem('allplay_pending_consent', JSON.stringify({
            version: CONSENT_VERSION,
            doc: CONSENT_DOC,
            accepted_at: new Date().toISOString()
          }));
        } catch (e) { /* ignore */ }
        setMode('login');
      }
    } catch (e) {
      setConsentError('Ett fel uppstod. Försök igen.');
    } finally {
      setConsentLoading(false);
    }
  };

  const switchMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    setLocalError(null);
    setSuccessMessage(null);
    setConsentError(null);
    clearError();
  };

  const displayError = localError || error;

  if (mode === 'consent' && isOpen) {
    return (
      <ConsentGate
        isSignup={true}
        isLoading={consentLoading}
        error={consentError}
        onAccept={handleConsentAccept}
        onCancel={() => {
          setMode('register');
          setConsentError(null);
        }}
      />
    );
  }

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
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Sheet on mobile, centered modal on sm+ */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full sm:max-w-md sm:mx-4 bg-[#0F1A13] sm:rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: 'calc(95vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}
          >
            {/* Drag handle (mobile only) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#2E3D35]" />
            </div>

            {/* Header */}
            <div className="relative px-6 pt-4 pb-5 overflow-hidden">
              {/* Subtle grid background */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
                  backgroundSize: '32px 32px',
                }}
              />
              {/* Green glow blob */}
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-[#2BA84A]/20 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#18221E] hover:bg-[#223029] text-[#B6C2BC] transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2BA84A] to-[#1A7A33] flex items-center justify-center shadow-lg ring-1 ring-[#2BA84A]/30 flex-shrink-0">
                  {mode === 'login' ? (
                    <LogIn className="w-7 h-7 text-white" strokeWidth={2} />
                  ) : (
                    <UserPlus className="w-7 h-7 text-white" strokeWidth={2} />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#2BA84A] mb-0.5">AllPlay</div>
                  <h2 className="text-2xl font-black text-[#F4F7F5] leading-tight">
                    {mode === 'login' ? 'Logga in' : 'Skapa konto'}
                  </h2>
                  <p className="text-sm text-[#8FA097] mt-0.5">
                    {mode === 'login' ? 'Välkommen tillbaka' : 'Börja spela idag'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                {/* Success message */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-[#2BA84A]/10 border border-[#2BA84A]/25 rounded-xl text-[#A7F3D0] text-sm"
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2BA84A]" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                {/* Error message */}
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{displayError}</span>
                  </motion.div>
                )}

                {/* Full Name (Register only) */}
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <Label className="text-[#C2CEC8] text-xs font-semibold uppercase tracking-wide">Namn</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A7265]" />
                      <Input
                        type="text"
                        placeholder="Ditt namn"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12 bg-[#121A15] border-[#1E2D23] text-[#F4F7F5] placeholder:text-[#4A5E52] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl text-[15px]"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-[#C2CEC8] text-xs font-semibold uppercase tracking-wide">E-postadress</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A7265]" />
                    <Input
                      type="email"
                      placeholder="din@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-[#121A15] border-[#1E2D23] text-[#F4F7F5] placeholder:text-[#4A5E52] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl text-[15px]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label className="text-[#C2CEC8] text-xs font-semibold uppercase tracking-wide">Lösenord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A7265]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'register' ? 'Minst 6 tecken' : '••••••••'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-11 h-12 bg-[#121A15] border-[#1E2D23] text-[#F4F7F5] placeholder:text-[#4A5E52] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl text-[15px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A7265] hover:text-[#F4F7F5] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Register only) */}
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <Label className="text-[#C2CEC8] text-xs font-semibold uppercase tracking-wide">Bekräfta lösenord</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A7265]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Upprepa lösenordet"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12 bg-[#121A15] border-[#1E2D23] text-[#F4F7F5] placeholder:text-[#4A5E52] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl text-[15px]"
                      />
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-gradient-to-b from-[#34C257] to-[#2BA84A] hover:from-[#3DD668] hover:to-[#31B852] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(43,168,74,0.35)] text-[15px]"
                    style={{ height: '52px' }}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {mode === 'login' ? 'Loggar in...' : 'Skapar konto...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {mode === 'login' ? 'Logga in' : 'Fortsätt'}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-[#1E2D23]" />
                  <span className="text-xs text-[#4A5E52] font-medium">eller</span>
                  <div className="flex-1 h-px bg-[#1E2D23]" />
                </div>

                {/* Toggle mode */}
                <button
                  type="button"
                  onClick={switchMode}
                  className="w-full h-11 rounded-xl border border-[#1E2D23] bg-[#121A15] hover:bg-[#18221E] hover:border-[#2BA84A]/30 text-[#8FA097] hover:text-[#F4F7F5] transition-all text-sm font-medium"
                >
                  {mode === 'login' ? (
                    <>Inget konto? <span className="text-[#2BA84A] font-semibold">Skapa ett gratis</span></>
                  ) : (
                    <>Har du ett konto? <span className="text-[#2BA84A] font-semibold">Logga in</span></>
                  )}
                </button>

                {/* Guest note */}
                <p className="text-center text-xs text-[#3D5248] pb-1">
                  Du kan bläddra bland matcher utan konto
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

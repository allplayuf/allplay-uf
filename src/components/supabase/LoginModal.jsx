/**
 * Supabase Login Modal
 * Email/password authentication
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, User, UserPlus, CheckCircle } from 'lucide-react';
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
        // Validate form first, then show consent gate
        setMode('consent');
        return;
      } else {
        const result = await login(email, password);
        
        if (result.success) {
          // Send pending DOB from onboarding if exists
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
      
      // Step 1: Use hardcoded anon key — no backend function call needed
      const { SUPABASE_ANON_KEY: anonKey, SUPABASE_URL: supaUrl } = await import('./config');
      
      if (!anonKey || anonKey.length < 20) {
        console.error('[LoginModal] SUPABASE_ANON_KEY missing in build!', { length: anonKey?.length });
        setConsentError('API-nyckel saknas i denna build. Kontakta support.');
        return;
      }

      console.log('[LoginModal] signup using hardcoded anonKey:', anonKey.slice(0, 8) + '...', 'length:', anonKey.length);

      // Step 2: Create Supabase account
      const response = await fetch(`${supaUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName }
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

      // Step 3: Check if email confirmation needed
      if (data.user && !data.session) {
        // Can't save consent yet since no session - save pending consent locally
        // It will be checked on first login
        try {
          localStorage.setItem('allplay_pending_consent', JSON.stringify({
            version: CONSENT_VERSION,
            doc: CONSENT_DOC,
            accepted_at: new Date().toISOString()
          }));
        } catch (e) { /* ignore */ }
        
        setSuccessMessage('Konto skapat! Kolla din e-post för att verifiera kontot.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      // Step 4: Session available - store tokens
      if (data.session || data.access_token) {
        const { sessionStore, AUTH_STATES, supabaseClient } = await import('./client');
        sessionStore.setTokens(data.access_token, data.refresh_token);
        sessionStore.setUser(data.user);
        sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
        
        // Sync to Base44
        await supabaseClient.syncUserToBase44(data.user);

        // Step 5: Save consent to user entity
        try {
          await base44.auth.updateMe({
            tos_version_accepted: CONSENT_VERSION,
            tos_accepted_at: new Date().toISOString(),
            tos_accepted_doc: CONSENT_DOC
          });
        } catch (consentErr) {
          console.error('Failed to save consent:', consentErr);
          // Rollback - logout user since consent wasn't saved
          sessionStore.clear();
          setConsentError('Kunde inte spara samtycke. Försök igen.');
          return;
        }

        onSuccess?.();
        onClose();
        return;
      }

      // Auto-login fallback
      const loginResult = await login(email, password);
      if (loginResult.success) {
        // Save consent after login
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
        setSuccessMessage('Konto skapat! Logga in med dina uppgifter.');
        // Save pending consent for first login
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

  // If in consent mode, render full-screen ConsentGate
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-[#121715] border border-[#223029] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-[#2BA84A]/20 to-[#0F2917]/20 border-b border-[#223029]">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#18221E] hover:bg-[#223029] text-[#B6C2BC] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center">
                  {mode === 'login' ? (
                    <LogIn className="w-6 h-6 text-[#2BA84A]" />
                  ) : (
                    <UserPlus className="w-6 h-6 text-[#2BA84A]" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F7F5]">
                    {mode === 'login' ? 'Logga in' : 'Skapa konto'}
                  </h2>
                  <p className="text-sm text-[#B6C2BC]">
                    {mode === 'login' ? 'Fortsätt till AllPlay' : 'Börja spela idag'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Success message */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl text-[#2BA84A] text-sm"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}

              {/* Error message */}
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{displayError}</span>
                </motion.div>
              )}

              {/* Full Name (Register only) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label className="text-[#F4F7F5] font-medium">Namn</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EAAA4]" />
                    <Input
                      type="text"
                      placeholder="Ditt namn"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#9EAAA4] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-medium">E-postadress</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EAAA4]" />
                  <Input
                    type="email"
                    placeholder="din@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#9EAAA4] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-medium">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EAAA4]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'register' ? 'Minst 6 tecken' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#9EAAA4] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9EAAA4] hover:text-[#F4F7F5] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label className="text-[#F4F7F5] font-medium">Bekräfta lösenord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EAAA4]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Upprepa lösenordet"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#9EAAA4] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#2BA84A] hover:bg-[#248232] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  mode === 'login' ? 'Logga in' : 'Skapa konto'
                )}
              </Button>

              {/* Toggle mode */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-sm text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
                >
                  {mode === 'login' ? (
                    <>Har du inget konto? <span className="text-[#2BA84A] font-medium">Skapa ett här</span></>
                  ) : (
                    <>Har du redan ett konto? <span className="text-[#2BA84A] font-medium">Logga in</span></>
                  )}
                </button>
              </div>

              {/* Guest info */}
              <p className="text-center text-xs text-[#9EAAA4]">
                Du kan fortsätta utan konto för att bläddra bland matcher
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
/**
 * Supabase Login Modal
 * Email/password authentication
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from './AuthProvider';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { login, error, clearError } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Fyll i både e-post och lösenord');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setLocalError(result.error?.message || 'Inloggningen misslyckades');
      }
    } catch (e) {
      setLocalError('Ett fel uppstod. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

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
                  <LogIn className="w-6 h-6 text-[#2BA84A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F7F5]">Logga in</h2>
                  <p className="text-sm text-[#B6C2BC]">Fortsätt till AllPlay</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-medium">E-postadress</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83]" />
                  <Input
                    type="email"
                    placeholder="din@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-medium">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8A83] hover:text-[#F4F7F5] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

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
                    Loggar in...
                  </span>
                ) : (
                  'Logga in'
                )}
              </Button>

              {/* Guest info */}
              <p className="text-center text-xs text-[#7B8A83]">
                Du kan fortsätta utan konto för att bläddra bland matcher
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
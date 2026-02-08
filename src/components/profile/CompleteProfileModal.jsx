/**
 * Complete Profile Modal
 * 
 * Blocks user onboarding until profile is complete
 * Required fields: username only
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/components/supabase/services';
import { useSupabaseAuth } from '@/components/supabase';
import { AlertCircle, Loader2, CheckCircle2, X } from 'lucide-react';

// Username validation regex: 3-30 chars, lowercase, only [a-z0-9._]
const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/;

export function CompleteProfileModal({ isOpen, onComplete, onClose }) {
  const { user } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Generate default username suggestion
  useEffect(() => {
    if (user?.email && !formData.username) {
      const emailPrefix = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const suggestion = emailPrefix ? `${emailPrefix}${randomSuffix}` : `player${randomSuffix}`;
      setFormData(prev => ({ ...prev, username: suggestion }));
    }
  }, [user?.email]);

  // Validate form
  const validate = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Användarnamn måste vara minst 3 tecken';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Användarnamn får vara max 30 tecken';
    } else if (!USERNAME_REGEX.test(formData.username)) {
      newErrors.username = 'Endast små bokstäver, siffror, punkt och understreck';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    setServerError(null);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await updateProfile({
        username: formData.username.trim().toLowerCase()
      });

      if (result.ok) {
        // Success - notify parent
        onComplete?.(result.user);
      } else {
        // Handle specific errors from backend
        if (result.error?.code === 'USERNAME_TAKEN' || result.error?.message?.includes('username')) {
          setErrors({ username: 'Användarnamnet är redan taget' });
        } else if (result.error?.code === 'USERNAME_INVALID') {
          setErrors({ username: 'Ogiltigt användarnamn. Endast små bokstäver, siffror, punkt och understreck' });
        } else {
          setServerError(result.error?.message || 'Kunde inte uppdatera profil. Försök igen.');
        }
      }
    } catch (error) {
      console.error('[CompleteProfileModal] Submit error:', error);
      setServerError('Ett fel uppstod. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-[#121715] border-[#223029] sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[#F4F7F5] text-xl">Slutför din profil</DialogTitle>
              <DialogDescription className="text-[#B6C2BC]">
                Välj ett användarnamn för att komma igång
              </DialogDescription>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#18221E] text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[#F4F7F5]">
              Användarnamn <span className="text-[#F4743B]">*</span>
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
              placeholder="dittanvandarnamn"
              className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83]"
              disabled={isSubmitting}
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-[#F4743B] text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.username}
              </p>
            )}
            {!errors.username && (
              <p className="text-[#7B8A83] text-xs">
                3-30 tecken: små bokstäver, siffror, punkt och understreck
              </p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-[#F4743B]/10 border border-[#F4743B]/30 rounded-lg p-3">
              <p className="text-[#F4743B] text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {serverError}
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2">
            {onClose && (
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-transparent border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] h-11"
              >
                Hoppa över
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Slutför
                </>
              )}
            </Button>
          </div>
        </form>

        <p className="text-[#7B8A83] text-xs text-center mt-4">
          Du kan alltid ändra ditt användarnamn senare i inställningarna
        </p>
      </DialogContent>
    </Dialog>
  );
}
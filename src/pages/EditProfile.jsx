/**
 * Edit Profile Page
 * 
 * Allows users to update their profile information
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/components/supabase';
import { updateProfile } from '@/components/supabase/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/;

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialData, setInitialData] = useState({ full_name: '', username: '' });

  // Load current values
  useEffect(() => {
    if (user) {
      const data = {
        full_name: user.full_name || '',
        username: user.username || ''
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [user]);

  const hasChanges = formData.full_name !== initialData.full_name || formData.username !== initialData.username;

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Namn måste vara minst 2 tecken';
    } else if (formData.full_name.length > 80) {
      newErrors.full_name = 'Namn får vara max 80 tecken';
    }

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProfile({
        full_name: formData.full_name.trim(),
        username: formData.username.trim().toLowerCase()
      });

      if (result.ok) {
        setSaved(true);
        toast.success('Profil uppdaterad!');
        
        // Update will be reflected via auth state
        setTimeout(() => {
          navigate(-1);
        }, 1000);
      } else {
        if (result.error?.code === 'USERNAME_TAKEN' || result.error?.message?.includes('username')) {
          setErrors({ username: 'Användarnamnet är redan taget' });
        } else if (result.error?.code === 'USERNAME_INVALID') {
          setErrors({ username: 'Ogiltigt användarnamn' });
        } else {
          toast.error(result.error?.message || 'Kunde inte uppdatera profil');
        }
      }
    } catch (error) {
      console.error('[EditProfile] Submit error:', error);
      toast.error('Ett fel uppstod. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131816] pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-[#F4F7F5] hover:bg-[#18221E]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-[#F4F7F5]">Redigera profil</h1>
        </div>

        {/* Form Card */}
        <Card className="bg-[#121715] border-[#223029]">
          <CardHeader>
            <CardTitle className="text-[#F4F7F5]">Profilinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-[#F4F7F5]">
                  Namn <span className="text-[#F4743B]">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Ditt fullständiga namn"
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83]"
                  disabled={isSubmitting}
                />
                {errors.full_name && (
                  <p className="text-[#F4743B] text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.full_name}
                  </p>
                )}
              </div>

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

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 border-[#223029] text-[#F4F7F5] hover:bg-[#18221E]"
                  disabled={isSubmitting}
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || saved || !hasChanges}
                  className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sparar...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Sparat!
                    </>
                  ) : (
                    'Spara ändringar'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
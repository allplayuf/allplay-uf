/**
 * Edit Profile Page
 * 
 * Full profile editor with all fields, validation, profanity filter,
 * avatar upload, optimistic UI and rollback on error.
 * 
 * Reads/writes to Supabase `profiles` table via REST + Edge Function.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/components/supabase';
import { getMyProfile, updateProfile } from '@/components/supabase/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AvatarUpload from '@/components/profile/AvatarUpload';
import { validateField, validateAllFields, FIELD_LIMITS, SKILL_LEVELS } from '@/components/profile/ProfileFieldValidation';
import { CACHE_STRATEGIES } from '@/components/providers/QueryProvider';

const EMPTY_FORM = {
  display_name: '',
  username: '',
  bio: '',
  skill_level: '',
  city: '',
  birth_year: '',
  avatar_url: '',
};

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser, isAuthenticated } = useSupabaseAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [initialData, setInitialData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch profile from Supabase
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id,
  });

  // Populate form when profile loads
  useEffect(() => {
    if (!profile && !authUser) return;

    const src = profile || authUser || {};
    const data = {
      display_name: src.display_name || src.full_name || authUser?.full_name || '',
      username: src.username || '',
      bio: src.bio || '',
      skill_level: src.skill_level || '',
      city: src.city || '',
      birth_year: src.birth_year ? String(src.birth_year) : '',
      avatar_url: src.avatar_url || src.profile_image_url || authUser?.avatar_url || '',
    };
    setFormData(data);
    setInitialData(data);
    setSaved(false);
  }, [profile, authUser]);

  // Compute whether anything changed
  const hasChanges = useMemo(() => {
    return Object.keys(EMPTY_FORM).some(key => formData[key] !== initialData[key]);
  }, [formData, initialData]);

  // Field change handler with inline validation
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);

    // Clear error for this field as user types
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Validate single field on blur
  const handleBlur = (field) => {
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const allErrors = validateAllFields(formData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setIsSubmitting(true);

    // Build payload — only send changed fields
    const payload = {};
    if (formData.display_name !== initialData.display_name) {
      payload.full_name = formData.display_name.trim();
    }
    if (formData.username !== initialData.username) {
      payload.username = formData.username.trim().toLowerCase() || undefined;
    }
    if (formData.bio !== initialData.bio) {
      payload.bio = formData.bio.trim();
    }
    if (formData.skill_level !== initialData.skill_level) {
      payload.skill_level = formData.skill_level || undefined;
    }
    if (formData.city !== initialData.city) {
      payload.city = formData.city.trim() || undefined;
    }
    if (formData.birth_year !== initialData.birth_year) {
      payload.birth_year = formData.birth_year ? parseInt(formData.birth_year, 10) : null;
    }
    if (formData.avatar_url !== initialData.avatar_url) {
      payload.avatar_url = formData.avatar_url || null;
      // Sync to localStorage for offline/instant display
      if (formData.avatar_url) {
        localStorage.setItem('allplay_profile_image', formData.avatar_url);
      } else {
        localStorage.removeItem('allplay_profile_image');
      }
    }

    // Optimistic update — snapshot for rollback
    const prevProfile = queryClient.getQueryData(['supabase-userProfile', authUser?.id]);
    queryClient.setQueryData(['supabase-userProfile', authUser?.id], old => ({
      ...old,
      ...payload,
      display_name: payload.full_name || old?.display_name,
      profile_image_url: payload.avatar_url !== undefined ? payload.avatar_url : old?.profile_image_url,
    }));

    try {
      // updateProfile sends to Supabase update_profile edge function
      const result = await updateProfile(payload);

      if (result?.ok !== false) {
        setSaved(true);
        setInitialData({ ...formData });
        toast.success('Profil uppdaterad!');

        // Invalidate profile queries
        queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] });

        setTimeout(() => navigate(-1), 800);
      } else {
        // Rollback
        queryClient.setQueryData(['supabase-userProfile', authUser?.id], prevProfile);

        const errMsg = result?.error?.message || '';
        if (errMsg.includes('username')) {
          setErrors({ username: 'Användarnamnet är redan taget' });
        } else {
          toast.error(errMsg || 'Kunde inte uppdatera profil');
        }
      }
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(['supabase-userProfile', authUser?.id], prevProfile);
      console.error('[EditProfile] Submit error:', error);
      toast.error('Ett fel uppstod. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#131816] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2BA84A] animate-spin" />
      </div>
    );
  }

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <Card className="bg-[#121715] border-[#223029]">
            <CardContent className="py-6 flex justify-center">
              <AvatarUpload
                currentImageUrl={formData.avatar_url}
                onUploaded={(url) => handleChange('avatar_url', url)}
              />
            </CardContent>
          </Card>

          {/* Core Fields */}
          <Card className="bg-[#121715] border-[#223029]">
            <CardHeader>
              <CardTitle className="text-[#F4F7F5] text-base">Profilinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-[#F4F7F5]">
                  Visningsnamn <span className="text-[#F4743B]">*</span>
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleChange('display_name', e.target.value)}
                  onBlur={() => handleBlur('display_name')}
                  placeholder="Ditt namn"
                  maxLength={FIELD_LIMITS.display_name.max}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83]"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between">
                  {errors.display_name ? (
                    <p className="text-[#F4743B] text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.display_name}
                    </p>
                  ) : <span />}
                  <span className="text-xs text-[#7B8A83]">{formData.display_name.length}/{FIELD_LIMITS.display_name.max}</span>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#F4F7F5]">
                  Användarnamn
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                  onBlur={() => handleBlur('username')}
                  placeholder="dittanvandarnamn"
                  maxLength={FIELD_LIMITS.username.max}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83]"
                  disabled={isSubmitting}
                />
                {errors.username ? (
                  <p className="text-[#F4743B] text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.username}
                  </p>
                ) : (
                  <p className="text-[#7B8A83] text-xs">
                    3–30 tecken: små bokstäver, siffror, punkt och understreck
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-[#F4F7F5]">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  onBlur={() => handleBlur('bio')}
                  placeholder="Berätta lite om dig själv..."
                  maxLength={FIELD_LIMITS.bio.max}
                  rows={3}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between">
                  {errors.bio ? (
                    <p className="text-[#F4743B] text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.bio}
                    </p>
                  ) : <span />}
                  <span className="text-xs text-[#7B8A83]">{formData.bio.length}/{FIELD_LIMITS.bio.max}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optional Fields */}
          <Card className="bg-[#121715] border-[#223029]">
            <CardHeader>
              <CardTitle className="text-[#F4F7F5] text-base">Spelarinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Skill Level */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5]">Nivå</Label>
                <Select
                  value={formData.skill_level}
                  onValueChange={(val) => handleChange('skill_level', val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                    <SelectValue placeholder="Välj din nivå" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18221E] border-[#223029]">
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="text-[#F4F7F5]">
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.skill_level && (
                  <p className="text-[#F4743B] text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.skill_level}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-[#F4F7F5]">Stad / Område</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  onBlur={() => handleBlur('city')}
                  placeholder="T.ex. Stockholm"
                  maxLength={FIELD_LIMITS.city.max}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83]"
                  disabled={isSubmitting}
                />
                {errors.city && (
                  <p className="text-[#F4743B] text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.city}
                  </p>
                )}
              </div>

              {/* Birth Year */}
              <div className="space-y-2">
                <Label htmlFor="birth_year" className="text-[#F4F7F5]">
                  Födelseår <span className="text-[#7B8A83] text-xs font-normal">(frivilligt)</span>
                </Label>
                <Input
                  id="birth_year"
                  type="number"
                  value={formData.birth_year}
                  onChange={(e) => handleChange('birth_year', e.target.value)}
                  onBlur={() => handleBlur('birth_year')}
                  placeholder="T.ex. 2000"
                  min={1930}
                  max={new Date().getFullYear() - 5}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83]"
                  disabled={isSubmitting}
                />
                {errors.birth_year && (
                  <p className="text-[#F4743B] text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.birth_year}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1 border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] h-12"
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || saved || !hasChanges}
              className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-12 font-semibold disabled:opacity-40"
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
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Spara ändringar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
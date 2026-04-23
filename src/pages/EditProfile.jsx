/**
 * Edit Profile Page — premium redesign
 *
 * Changes vs. previous:
 *   • Sticky top bar with avatar preview + save-state indicator
 *   • Two clean sections: Identity / Spelarinformation
 *   • Dirty-state aware sticky save bar at bottom (mobile + desktop)
 *   • Inline character counters, live validation, clean typography
 *   • Unchanged business logic (same services, optimistic update, rollback)
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Save,
  User,
  Target,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarUpload from '@/components/profile/AvatarUpload';
import {
  validateField,
  validateAllFields,
  FIELD_LIMITS,
  SKILL_LEVELS
} from '@/components/profile/ProfileFieldValidation';
import { CACHE_STRATEGIES } from '@/components/providers/QueryProvider';

const EMPTY_FORM = {
  display_name: '',
  username: '',
  bio: '',
  skill_level: '',
  city: '',
  date_of_birth: '',
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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id,
  });

  useEffect(() => {
    if (!profile && !authUser) return;
    const src = profile || authUser || {};
    const data = {
      display_name: src.display_name || src.full_name || authUser?.full_name || '',
      username: src.username || '',
      bio: src.bio || '',
      skill_level: src.skill_level || '',
      city: src.city || '',
      date_of_birth: src.date_of_birth || '',
      avatar_url: src.avatar_url || src.profile_image_url || authUser?.avatar_url || '',
    };
    setFormData(data);
    setInitialData(data);
    setSaved(false);
  }, [profile, authUser]);

  const hasChanges = useMemo(
    () => Object.keys(EMPTY_FORM).some((k) => formData[k] !== initialData[k]),
    [formData, initialData]
  );

  // Completeness — light nudge, not gating
  const completeness = useMemo(() => {
    const fields = ['display_name', 'username', 'bio', 'skill_level', 'city', 'avatar_url'];
    const filled = fields.filter((f) => (formData[f] || '').toString().trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setSaved(false);
    if (errors[field]) {
      setErrors((p) => {
        const u = { ...p };
        delete u[field];
        return u;
      });
    }
  };

  const handleBlur = (field) => {
    const err = validateField(field, formData[field]);
    if (err) setErrors((p) => ({ ...p, [field]: err }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const allErrors = validateAllFields(formData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(allErrors)[0];
      const el = document.getElementById(firstErrorKey);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    const payload = {};
    if (formData.display_name !== initialData.display_name)
      payload.full_name = formData.display_name.trim();
    if (formData.username !== initialData.username)
      payload.username = formData.username.trim().toLowerCase() || undefined;
    if (formData.bio !== initialData.bio) payload.bio = formData.bio.trim();
    if (formData.skill_level !== initialData.skill_level)
      payload.skill_level = formData.skill_level || undefined;
    if (formData.city !== initialData.city) payload.city = formData.city.trim() || undefined;
    if (formData.date_of_birth !== initialData.date_of_birth)
      payload.date_of_birth = formData.date_of_birth || null;
    if (formData.avatar_url !== initialData.avatar_url) {
      payload.avatar_url = formData.avatar_url || null;
      if (formData.avatar_url) {
        localStorage.setItem('allplay_profile_image', formData.avatar_url);
      } else {
        localStorage.removeItem('allplay_profile_image');
      }
    }

    const prevProfile = queryClient.getQueryData(['supabase-userProfile', authUser?.id]);
    queryClient.setQueryData(['supabase-userProfile', authUser?.id], (old) => ({
      ...old,
      ...payload,
      display_name: payload.full_name || old?.display_name,
      profile_image_url:
        payload.avatar_url !== undefined ? payload.avatar_url : old?.profile_image_url,
    }));

    try {
      const result = await updateProfile(payload);
      if (result?.ok !== false) {
        setSaved(true);
        setInitialData({ ...formData });
        toast.success('Profil uppdaterad!');
        queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] });
        setTimeout(() => navigate(-1), 650);
      } else {
        queryClient.setQueryData(['supabase-userProfile', authUser?.id], prevProfile);
        const errMsg = result?.error?.message || '';
        if (errMsg.includes('username')) {
          setErrors({ username: 'Användarnamnet är redan taget' });
        } else {
          toast.error(errMsg || 'Kunde inte uppdatera profil');
        }
      }
    } catch (error) {
      queryClient.setQueryData(['supabase-userProfile', authUser?.id], prevProfile);
      console.error('[EditProfile] Submit error:', error);
      toast.error('Ett fel uppstod. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2BA84A] animate-spin" />
      </div>
    );
  }

  const firstName = (formData.display_name || '').trim().split(' ')[0] || 'Du';

  return (
    <div className="min-h-screen bg-[#0F1513] pb-28 lg:pb-8">
      {/* ── Sticky header ─────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0F1513]/92 backdrop-blur-xl border-b border-[#223029]/70">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-[#F4F7F5] hover:bg-[#18221E] flex-shrink-0 h-10 w-10"
            aria-label="Gå tillbaka"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86EFAC]/85 leading-none">
              Redigera profil
            </div>
            <div className="mt-1 text-[15px] font-bold text-[#F4F7F5] leading-none truncate">
              {firstName}
            </div>
          </div>
          <AnimatePresence>
            {hasChanges && !saved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#F4743B]/15 ring-1 ring-[#F4743B]/30 text-[11px] font-semibold text-[#FDBA74]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4743B] animate-pulse" />
                Osparade ändringar
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        {/* ── Hero card: Avatar + completeness ───────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-gradient-to-br from-[#0F2A18] to-[#0A1C10] p-5 sm:p-6"
          style={{
            boxShadow:
              '0 20px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Ambient */}
          <div
            aria-hidden
            className="absolute -top-24 -right-16 w-[280px] h-[280px] rounded-full blur-[90px] pointer-events-none opacity-60"
            style={{
              background:
                'radial-gradient(circle, rgba(52,194,87,0.35) 0%, transparent 70%)',
            }}
          />
          <div className="relative flex flex-col items-center text-center gap-4">
            <AvatarUpload
              currentImageUrl={formData.avatar_url}
              onUploaded={(url) => handleChange('avatar_url', url)}
            />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Profilkomplett
              </div>
              <div className="mt-1.5 flex items-center gap-2 justify-center">
                <div className="w-40 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, #86EFAC 0%, #34C257 55%, #22C55E 100%)',
                      boxShadow: '0 0 12px rgba(52,194,87,0.5)',
                    }}
                  />
                </div>
                <span className="text-[12px] font-black tabular-nums text-white/90">
                  {completeness}%
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Identity section ──────────────────────── */}
        <Section icon={User} title="Identitet" subtitle="Så ser andra dig i appen">
          <FieldGroup>
            <Field
              id="display_name"
              label="Visningsnamn"
              required
              error={errors.display_name}
              counter={`${formData.display_name.length}/${FIELD_LIMITS.display_name.max}`}
            >
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                onBlur={() => handleBlur('display_name')}
                placeholder="Ditt namn"
                maxLength={FIELD_LIMITS.display_name.max}
                className="bg-[#0F1513] border-[#243029] text-[#F4F7F5] placeholder:text-[#7B8A83] h-11 focus-visible:ring-[#2BA84A]/50 focus-visible:border-[#2BA84A]/40"
                disabled={isSubmitting}
              />
            </Field>

            <Field
              id="username"
              label="Användarnamn"
              error={errors.username}
              hint="3–30 tecken: små bokstäver, siffror, punkt och understreck"
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8A83] text-sm font-semibold pointer-events-none">
                  @
                </span>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                  onBlur={() => handleBlur('username')}
                  placeholder="dittanvandarnamn"
                  maxLength={FIELD_LIMITS.username.max}
                  className="bg-[#0F1513] border-[#243029] text-[#F4F7F5] placeholder:text-[#7B8A83] h-11 pl-7 focus-visible:ring-[#2BA84A]/50 focus-visible:border-[#2BA84A]/40"
                  disabled={isSubmitting}
                />
              </div>
            </Field>

            <Field
              id="bio"
              label="Bio"
              error={errors.bio}
              counter={`${formData.bio.length}/${FIELD_LIMITS.bio.max}`}
            >
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                onBlur={() => handleBlur('bio')}
                placeholder="Berätta lite om dig själv..."
                maxLength={FIELD_LIMITS.bio.max}
                rows={3}
                className="bg-[#0F1513] border-[#243029] text-[#F4F7F5] placeholder:text-[#7B8A83] resize-none focus-visible:ring-[#2BA84A]/50 focus-visible:border-[#2BA84A]/40"
                disabled={isSubmitting}
              />
            </Field>
          </FieldGroup>
        </Section>

        {/* ── Player section ────────────────────────── */}
        <Section icon={Target} title="Spelarinformation" subtitle="Hjälper oss matcha dig rätt">
          <FieldGroup>
            <Field id="skill_level" label="Nivå" error={errors.skill_level}>
              <Select
                value={formData.skill_level}
                onValueChange={(v) => handleChange('skill_level', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-[#0F1513] border-[#243029] text-[#F4F7F5] h-11 focus:ring-[#2BA84A]/50">
                  <SelectValue placeholder="Välj din nivå" />
                </SelectTrigger>
                <SelectContent className="bg-[#141917] border-[#243029]">
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem
                      key={level.value}
                      value={level.value}
                      className="text-[#F4F7F5] focus:bg-[#2BA84A]/15"
                    >
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field id="city" label="Stad / Område" error={errors.city}>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                placeholder="T.ex. Stockholm"
                maxLength={FIELD_LIMITS.city.max}
                className="bg-[#0F1513] border-[#243029] text-[#F4F7F5] placeholder:text-[#7B8A83] h-11 focus-visible:ring-[#2BA84A]/50 focus-visible:border-[#2BA84A]/40"
                disabled={isSubmitting}
              />
            </Field>

            <Field
              id="date_of_birth"
              label="Födelsedatum"
              hintInline="frivilligt"
              error={errors.date_of_birth}
            >
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                max={new Date(new Date().getFullYear() - 5, 11, 31).toISOString().split('T')[0]}
                className="bg-[#0F1513] border-[#243029] text-[#F4F7F5] h-11 focus-visible:ring-[#2BA84A]/50 focus-visible:border-[#2BA84A]/40"
                disabled={isSubmitting}
              />
            </Field>
          </FieldGroup>
        </Section>

        {/* Desktop-only inline save row */}
        <div className="hidden lg:flex gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 border-[#243029] text-[#F4F7F5] hover:bg-[#18221E] h-11"
            disabled={isSubmitting}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || saved || !hasChanges}
            className="flex-1 bg-[#2BA84A] hover:bg-[#34C257] text-white h-11 font-semibold disabled:opacity-40"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sparar...</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Sparat!</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Spara ändringar</>
            )}
          </Button>
        </div>
      </form>

      {/* ── Sticky bottom save bar (mobile) ─────────── */}
      <AnimatePresence>
        {(hasChanges || isSubmitting || saved) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="lg:hidden fixed left-0 right-0 bottom-0 z-40 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0F1513] via-[#0F1513]/95 to-transparent"
          >
            <div className="max-w-2xl mx-auto flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                className="flex-1 border-[#243029] bg-[#141917] text-[#F4F7F5] hover:bg-[#18221E] h-12 rounded-xl"
              >
                Avbryt
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || saved || !hasChanges}
                className="flex-[2] bg-[#2BA84A] hover:bg-[#34C257] text-white h-12 rounded-xl font-bold disabled:opacity-40 shadow-[0_10px_24px_rgba(43,168,74,0.4)]"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sparar...</>
                ) : saved ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Sparat!</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Spara ändringar</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small layout primitives ─────────────────────────
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[20px] border border-[#223029] bg-[#121715] overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#223029]/70">
        <div className="w-9 h-9 rounded-xl bg-[#2BA84A]/14 ring-1 ring-[#2BA84A]/25 flex items-center justify-center flex-shrink-0">
          <Icon className="w-[18px] h-[18px] text-[#86EFAC]" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[#F4F7F5] leading-tight">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[12px] text-[#9EAAA4] leading-tight">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

function FieldGroup({ children }) {
  return <div className="space-y-4">{children}</div>;
}

function Field({ id, label, required, hint, hintInline, counter, error, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[13px] font-semibold text-[#F4F7F5]">
          {label}
          {required && <span className="text-[#F4743B] ml-1">*</span>}
          {hintInline && (
            <span className="ml-1.5 text-[11px] text-[#7B8A83] font-normal">({hintInline})</span>
          )}
        </Label>
        {counter && <span className="text-[11px] text-[#7B8A83] tabular-nums">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="text-[#FDBA74] text-[12px] flex items-center gap-1.5 pt-0.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[11px] text-[#7B8A83] leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}
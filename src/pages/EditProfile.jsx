import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/components/supabase';
import { getMyProfile, updateProfile } from '@/components/supabase/services';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Save,
  User,
  MapPin,
  Calendar,
  AtSign,
  FileText,
  Sprout,
  Flame,
  Zap,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AvatarUpload from '@/components/profile/AvatarUpload';
import {
  validateField,
  validateAllFields,
  FIELD_LIMITS,
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

const SKILL_CARDS = [
  {
    value: 'beginner',
    label: 'Nybörjare',
    desc: 'Lär sig grunderna',
    Icon: Sprout,
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.3)',
    ring: 'rgba(74,222,128,0.5)',
    bg: 'rgba(74,222,128,0.08)',
    activeBg: 'rgba(74,222,128,0.14)',
  },
  {
    value: 'intermediate',
    label: 'Medel',
    desc: 'Bekväm med spelet',
    Icon: Flame,
    color: '#60A5FA',
    glow: 'rgba(96,165,250,0.3)',
    ring: 'rgba(96,165,250,0.5)',
    bg: 'rgba(96,165,250,0.08)',
    activeBg: 'rgba(96,165,250,0.14)',
  },
  {
    value: 'advanced',
    label: 'Avancerad',
    desc: 'Starka färdigheter',
    Icon: Zap,
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.3)',
    ring: 'rgba(251,191,36,0.5)',
    bg: 'rgba(251,191,36,0.08)',
    activeBg: 'rgba(251,191,36,0.14)',
  },
  {
    value: 'elite',
    label: 'Elit',
    desc: 'Toppnivå',
    Icon: Crown,
    color: '#C084FC',
    glow: 'rgba(192,132,252,0.3)',
    ring: 'rgba(192,132,252,0.5)',
    bg: 'rgba(192,132,252,0.08)',
    activeBg: 'rgba(192,132,252,0.14)',
  },
];

const GLASS = {
  background: 'rgba(18,23,20,0.55)',
  backdropFilter: 'saturate(180%) blur(26px)',
  WebkitBackdropFilter: 'saturate(180%) blur(26px)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)',
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
      avatar_url: src.avatar_url || authUser?.avatar_url || '',
    };
    setFormData(data);
    setInitialData(data);
    setSaved(false);
  }, [profile, authUser]);

  const hasChanges = useMemo(
    () => Object.keys(EMPTY_FORM).some((k) => formData[k] !== initialData[k]),
    [formData, initialData]
  );

  const completeness = useMemo(() => {
    const fields = ['display_name', 'username', 'bio', 'skill_level', 'city', 'avatar_url'];
    const filled = fields.filter((f) => (formData[f] || '').toString().trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setSaved(false);
    if (errors[field]) setErrors((p) => { const u = { ...p }; delete u[field]; return u; });
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
      document.getElementById(Object.keys(allErrors)[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    const payload = {};
    if (formData.display_name !== initialData.display_name) payload.full_name = formData.display_name.trim();
    if (formData.username !== initialData.username) payload.username = formData.username.trim().toLowerCase() || undefined;
    if (formData.bio !== initialData.bio) payload.bio = formData.bio.trim();
    if (formData.skill_level !== initialData.skill_level) payload.skill_level = formData.skill_level || undefined;
    if (formData.city !== initialData.city) payload.city = formData.city.trim() || undefined;
    if (formData.date_of_birth !== initialData.date_of_birth) payload.date_of_birth = formData.date_of_birth || null;
    if (formData.avatar_url !== initialData.avatar_url) {
      payload.avatar_url = formData.avatar_url || null;
      if (formData.avatar_url) localStorage.setItem('allplay_profile_image', formData.avatar_url);
      else localStorage.removeItem('allplay_profile_image');
    }

    const prevProfile = queryClient.getQueryData(['supabase-userProfile', authUser?.id]);
    queryClient.setQueryData(['supabase-userProfile', authUser?.id], (old) => ({
      ...old, ...payload,
      display_name: payload.full_name || old?.display_name,
      avatar_url: payload.avatar_url !== undefined ? payload.avatar_url : old?.avatar_url,
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
        const msg = result?.error?.message || '';
        if (msg.includes('username')) setErrors({ username: 'Användarnamnet är redan taget' });
        else toast.error(msg || 'Kunde inte uppdatera profil');
      }
    } catch {
      queryClient.setQueryData(['supabase-userProfile', authUser?.id], prevProfile);
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

  return (
    <div className="min-h-screen bg-[#0F1513] pb-[11rem] lg:pb-10">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-3">

        {/* ── Hero ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[26px] border border-white/[0.06] p-6"
          style={{
            background: 'linear-gradient(150deg, #0D2318 0%, #091610 55%, #050F0A 100%)',
            boxShadow: '0 28px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(43,168,74,0.20) 0%, transparent 65%)', filter: 'blur(36px)' }} />
          <div aria-hidden className="absolute -bottom-10 -left-8 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(52,194,87,0.10) 0%, transparent 65%)', filter: 'blur(28px)' }} />

          <div className="relative flex flex-col items-center gap-4">
            <AvatarUpload
              currentImageUrl={formData.avatar_url}
              onUploaded={(url) => handleChange('avatar_url', url)}
            />

            <div className="text-center">
              <p className="text-[18px] font-bold text-[#F4F7F5] leading-tight">
                {formData.display_name || <span className="text-white/30">Ditt namn</span>}
              </p>
              {formData.username
                ? <p className="mt-0.5 text-[13px] text-[#86EFAC]/70 font-medium">@{formData.username}</p>
                : <p className="mt-0.5 text-[12px] text-white/20">@användarnamn</p>
              }
            </div>

            {/* Progress */}
            <div className="w-full max-w-[240px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Profil</span>
                <span className="text-[11px] font-black tabular-nums" style={{ color: completeness === 100 ? '#4ADE80' : '#9CA3AF' }}>
                  {completeness}%
                </span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-white/[0.07] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: completeness === 100
                      ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
                      : 'linear-gradient(90deg, #86EFAC 0%, #34C257 60%, #22C55E 100%)',
                    boxShadow: '0 0 8px rgba(52,194,87,0.5)',
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Identitet ───────────────────────────────── */}
        <Section icon={User} title="Identitet" subtitle="Hur du syns för andra" delay={0.06}>

          <Field id="display_name" label="Visningsnamn" required error={errors.display_name}
            counter={`${formData.display_name.length}/${FIELD_LIMITS.display_name.max}`}>
            <IconInput icon={User} error={errors.display_name}>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                onBlur={() => handleBlur('display_name')}
                placeholder="Ditt namn"
                maxLength={FIELD_LIMITS.display_name.max}
                className={inputCls(errors.display_name)}
                disabled={isSubmitting}
              />
            </IconInput>
          </Field>

          <Field id="username" label="Användarnamn" error={errors.username}
            hint="3–30 tecken · små bokstäver, siffror, punkt, understreck">
            <IconInput icon={AtSign} prefix="@" error={errors.username}>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                onBlur={() => handleBlur('username')}
                placeholder="dittanvandarnamn"
                maxLength={FIELD_LIMITS.username.max}
                className={inputCls(errors.username)}
                disabled={isSubmitting}
              />
            </IconInput>
          </Field>

          <Field id="bio" label="Bio" error={errors.bio}
            counter={`${formData.bio.length}/${FIELD_LIMITS.bio.max}`}>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-[15px] h-[15px] text-[#3A5042] pointer-events-none" strokeWidth={2} />
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                onBlur={() => handleBlur('bio')}
                placeholder="Berätta lite om dig själv..."
                maxLength={FIELD_LIMITS.bio.max}
                rows={3}
                className={inputCls(errors.bio) + ' resize-none h-auto pl-10 pt-2.5'}
                disabled={isSubmitting}
              />
            </div>
          </Field>

        </Section>

        {/* ── Spelarinformation ───────────────────────── */}
        <Section icon={Zap} title="Spelarinformation" subtitle="Hjälper oss matcha dig rätt" delay={0.10}>

          {/* Skill level card picker */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6A8A72] mb-2.5 block">
              Nivå
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SKILL_CARDS.map((card) => {
                const active = formData.skill_level === card.value;
                return (
                  <motion.button
                    key={card.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleChange('skill_level', card.value)}
                    disabled={isSubmitting}
                    className="relative flex flex-col items-start gap-1.5 p-3.5 rounded-[16px] border text-left transition-all overflow-hidden"
                    style={{
                      background: active ? card.activeBg : card.bg,
                      borderColor: active ? card.ring : 'rgba(255,255,255,0.06)',
                      boxShadow: active ? `0 0 0 1px ${card.ring}, 0 8px 24px ${card.glow}` : undefined,
                    }}
                  >
                    {/* subtle inner glow when active */}
                    {active && (
                      <div
                        aria-hidden
                        className="absolute inset-0 pointer-events-none rounded-[16px]"
                        style={{ background: `radial-gradient(ellipse at 50% 0%, ${card.glow} 0%, transparent 70%)` }}
                      />
                    )}

                    <div className="relative flex items-center gap-2 w-full">
                      <div
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{
                          background: active ? `${card.color}22` : 'rgba(255,255,255,0.04)',
                          boxShadow: active ? `inset 0 0 0 1px ${card.color}44` : undefined,
                        }}
                      >
                        <card.Icon
                          className="w-[16px] h-[16px]"
                          style={{ color: active ? card.color : '#4A6358' }}
                          strokeWidth={2.2}
                        />
                      </div>
                      {active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: card.color }}
                        >
                          <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>

                    <div className="relative">
                      <p className="text-[13px] font-bold leading-tight" style={{ color: active ? card.color : '#C8D8CC' }}>
                        {card.label}
                      </p>
                      <p className="text-[11px] leading-tight mt-0.5" style={{ color: active ? `${card.color}99` : '#4A6358' }}>
                        {card.desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {errors.skill_level && (
              <p className="text-[#FDBA74] text-[11px] flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.skill_level}
              </p>
            )}
          </div>

          <Field id="city" label="Stad / Område" error={errors.city}>
            <IconInput icon={MapPin} error={errors.city}>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                placeholder="T.ex. Stockholm"
                maxLength={FIELD_LIMITS.city.max}
                className={inputCls(errors.city)}
                disabled={isSubmitting}
              />
            </IconInput>
          </Field>

          <Field id="date_of_birth" label="Födelsedatum" hintInline="frivilligt" error={errors.date_of_birth}>
            <IconInput icon={Calendar} error={errors.date_of_birth}>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                max={new Date(new Date().getFullYear() - 5, 11, 31).toISOString().split('T')[0]}
                className={inputCls(errors.date_of_birth)}
                disabled={isSubmitting}
              />
            </IconInput>
          </Field>

        </Section>

        {/* Desktop save */}
        <div className="hidden lg:flex gap-3 pt-1 pb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-xl border border-[#1E2D24] bg-[#111916] text-[#8FA897] hover:bg-[#18221E] hover:text-[#F4F7F5] font-semibold text-[14px] transition-all disabled:opacity-40"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={isSubmitting || saved || !hasChanges}
            className="flex-[2] h-11 rounded-xl font-bold text-white text-[14px] transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #2BA84A 0%, #22C55E 100%)',
              boxShadow: hasChanges && !saved ? '0 6px 20px rgba(43,168,74,0.35)' : undefined,
            }}
          >
            {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Sparar...</span>
              : saved ? <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Sparat!</span>
              : <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" />Spara ändringar</span>}
          </button>
        </div>

      </form>

      {/* ── Floating save bar above bottom nav ───── */}
      <div
        className="lg:hidden fixed left-0 right-0 z-[99] pointer-events-none"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 84px)',
          paddingLeft: 'calc(env(safe-area-inset-left) + 12px)',
          paddingRight: 'calc(env(safe-area-inset-right) + 12px)',
        }}
      >
        <div
          className="pointer-events-auto relative mx-auto max-w-3xl overflow-hidden rounded-[22px] border border-white/[0.08]"
          style={GLASS}
        >
          <div aria-hidden className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }} />

          <div className="flex items-center gap-2.5 p-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="flex items-center justify-center h-11 px-5 rounded-[16px] bg-white/[0.05] text-[#8FA897] text-[14px] font-semibold ring-1 ring-white/[0.07] hover:bg-white/[0.09] transition-colors flex-shrink-0 disabled:opacity-40"
            >
              Avbryt
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || saved || !hasChanges}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-[16px] text-white text-[14px] font-bold transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #2BA84A 0%, #22C55E 100%)',
                boxShadow: hasChanges && !saved && !isSubmitting
                  ? '0 6px 20px rgba(43,168,74,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : undefined,
              }}
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Sparar...</>
                : saved ? <><CheckCircle2 className="w-4 h-4" />Sparat!</>
                : <><Save className="w-4 h-4" />Spara ändringar</>}
            </button>

            {hasChanges && !saved && !isSubmitting && (
              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#F97316] animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────

function inputCls(hasError) {
  return [
    'bg-[#0A1410] border text-[#E2EDE6] placeholder:text-[#2E4238] h-11',
    'focus-visible:ring-1 focus-visible:ring-[#2BA84A]/55 focus-visible:border-[#2BA84A]/45 transition-colors',
    hasError ? 'border-[#F97316]/50' : 'border-[#182420]',
  ].join(' ');
}

function IconInput({ icon: Icon, prefix, error, children }) {
  return (
    <div className="relative">
      {prefix ? (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3A5042] text-[13px] font-bold pointer-events-none select-none z-10">
          {prefix}
        </span>
      ) : (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none z-10"
          style={{ color: error ? '#F97316' : '#3A5042' }} strokeWidth={2} />
      )}
      <div className="[&_input]:pl-10 [&_textarea]:pl-10">{children}</div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-[22px] border border-white/[0.05] overflow-hidden"
      style={{ background: 'rgba(11,17,13,0.90)' }}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(43,168,74,0.10)', boxShadow: 'inset 0 0 0 1px rgba(43,168,74,0.18)' }}>
          <Icon className="w-[13px] h-[13px] text-[#86EFAC]" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-[13px] font-bold text-[#E8F0EA] leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-[#4A6358] mt-0.5 leading-tight">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({ id, label, required, hint, hintInline, counter, error, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#5A7A66]">
          {label}
          {required && <span className="text-[#F97316] ml-1">*</span>}
          {hintInline && <span className="ml-1.5 text-[10px] text-[#3A5042] font-normal normal-case">({hintInline})</span>}
        </Label>
        {counter && <span className="text-[10px] text-[#2E4238] tabular-nums">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="text-[#FDBA74] text-[11px] flex items-center gap-1.5 pt-0.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      ) : hint ? (
        <p className="text-[10px] text-[#2E4238] leading-snug mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

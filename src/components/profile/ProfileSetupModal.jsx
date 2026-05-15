import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Camera, Loader2, AtSign, User, MapPin, Check } from 'lucide-react';
import { useSupabaseAuth } from '@/components/supabase';
import { getMyProfile, updateProfile } from '@/components/supabase/services';
import { UploadFile } from '@/components/supabase/integrations';
import { CACHE_STRATEGIES } from '@/components/providers/QueryProvider';

const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/;

const SKILL_CARDS = [
  { value: 'beginner',     label: 'Nybörjare',  desc: 'Lär sig grunderna',    color: '#4ADE80', bg: 'rgba(74,222,128,0.10)'  },
  { value: 'intermediate', label: 'Medel',       desc: 'Bekväm med spelet',    color: '#60A5FA', bg: 'rgba(96,165,250,0.10)'  },
  { value: 'advanced',     label: 'Avancerad',   desc: 'Starka färdigheter',   color: '#FBBF24', bg: 'rgba(251,191,36,0.10)'  },
  { value: 'elite',        label: 'Elit',        desc: 'Toppnivå',             color: '#C084FC', bg: 'rgba(192,132,252,0.10)' },
];

const STEP_COUNT = 3;

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

// ─── Step 1: Identity ────────────────────────────────────────────────────────

function StepIdentity({ formData, setFormData, errors, setErrors }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#2BA84A] mb-3">
          Steg 1
        </p>
        <h1 className="text-[32px] font-black text-[#F4F7F5] leading-[1.1] mb-2">
          Vem är du?
        </h1>
        <p className="text-[#8FA097] text-[15px] leading-relaxed">
          Välj ett namn och ett unikt spelarnamn
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Full name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase text-[#8FA097]">
            <User className="w-3.5 h-3.5" />
            Namn
          </label>
          <input
            value={formData.full_name}
            onChange={(e) => {
              setFormData((p) => ({ ...p, full_name: e.target.value }));
              if (errors.full_name) setErrors((p) => { const u = { ...p }; delete u.full_name; return u; });
            }}
            placeholder="Ditt fullständiga namn"
            autoComplete="name"
            autoCapitalize="words"
            className="w-full h-14 rounded-xl bg-[#0D1611] border border-[#1E2D24] px-4 text-[16px] text-[#F4F7F5] placeholder:text-[#2A3D32] outline-none focus:border-[#2BA84A]/60 transition-colors"
          />
          {errors.full_name && (
            <p className="text-[#F4743B] text-[13px]">{errors.full_name}</p>
          )}
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase text-[#8FA097]">
            <AtSign className="w-3.5 h-3.5" />
            Användarnamn
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2A3D32] text-[16px] select-none pointer-events-none">
              @
            </span>
            <input
              value={formData.username}
              onChange={(e) => {
                setFormData((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') }));
                if (errors.username) setErrors((p) => { const u = { ...p }; delete u.username; return u; });
              }}
              placeholder="dittanvandarnamn"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              className="w-full h-14 rounded-xl bg-[#0D1611] border border-[#1E2D24] pl-8 pr-4 text-[16px] text-[#F4F7F5] placeholder:text-[#2A3D32] outline-none focus:border-[#2BA84A]/60 transition-colors"
            />
          </div>
          {errors.username ? (
            <p className="text-[#F4743B] text-[13px]">{errors.username}</p>
          ) : (
            <p className="text-[#2A3D32] text-[12px]">
              3–30 tecken — a–z, 0–9, punkt, understreck
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Photo ───────────────────────────────────────────────────────────

function StepPhoto({ formData, avatarPreview, isUploading, fileRef, initials, onFileSelect }) {
  const hasPhoto = !!(avatarPreview || formData.avatar_url);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#2BA84A] mb-3">
          Steg 2
        </p>
        <h1 className="text-[32px] font-black text-[#F4F7F5] leading-[1.1] mb-2">
          Lägg till ett foto
        </h1>
        <p className="text-[#8FA097] text-[15px] leading-relaxed">
          Valfritt — hjälper andra spelare känna igen dig
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 mt-2">
        <div className="relative">
          {/* Avatar ring glow when photo is set */}
          {hasPhoto && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: '0 0 0 3px rgba(43,168,74,0.5), 0 0 32px rgba(43,168,74,0.25)',
                borderRadius: '50%',
              }}
            />
          )}

          <button
            type="button"
            onClick={() => !isUploading && fileRef.current?.click()}
            className="relative w-[136px] h-[136px] rounded-full overflow-hidden flex items-center justify-center transition-all"
            style={{
              background: hasPhoto ? 'transparent' : 'rgba(43,168,74,0.06)',
              border: hasPhoto ? '2px solid rgba(43,168,74,0.4)' : '2px dashed rgba(43,168,74,0.3)',
            }}
          >
            {avatarPreview || formData.avatar_url ? (
              <img
                src={avatarPreview || formData.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[42px] font-black text-[#2BA84A]/40 select-none">
                {initials}
              </span>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-[#0F1513]/75 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#2BA84A] animate-spin" />
              </div>
            )}
          </button>

          {/* Camera FAB */}
          <button
            type="button"
            onClick={() => !isUploading && fileRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0.5 right-0.5 w-10 h-10 rounded-full bg-[#2BA84A] flex items-center justify-center text-white ring-[3px] ring-[#0F1513] hover:bg-[#248232] transition-colors disabled:opacity-50"
          >
            <Camera className="w-[18px] h-[18px]" />
          </button>
        </div>

        <p className="text-[#2A3D32] text-[13px] text-center leading-relaxed max-w-[220px]">
          Tryck för att välja ett foto från ditt bibliotek
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
}

// ─── Step 3: Level + City ────────────────────────────────────────────────────

function StepLevel({ formData, setFormData }) {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#2BA84A] mb-3">
          Steg 3
        </p>
        <h1 className="text-[32px] font-black text-[#F4F7F5] leading-[1.1] mb-2">
          Din spelarnivå
        </h1>
        <p className="text-[#8FA097] text-[15px] leading-relaxed">
          Hjälper oss matcha rätt matcher för dig
        </p>
      </div>

      {/* Skill level cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {SKILL_CARDS.map((card) => {
          const active = formData.skill_level === card.value;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => setFormData((p) => ({ ...p, skill_level: card.value }))}
              className="flex flex-col items-start gap-1.5 p-4 rounded-2xl border text-left transition-all"
              style={{
                background:     active ? card.bg : 'rgba(18,23,20,0.7)',
                borderColor:    active ? card.color : '#1E2D24',
                boxShadow:      active ? `0 0 0 1px ${card.color}50` : 'none',
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[15px] font-bold" style={{ color: card.color }}>
                  {card.label}
                </span>
                {active && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: card.color }}
                  >
                    <Check className="w-3 h-3 text-[#0F1513]" strokeWidth={3} />
                  </span>
                )}
              </div>
              <span className="text-[12px] text-[#8FA097]">{card.desc}</span>
            </button>
          );
        })}
      </div>

      {/* City */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase text-[#8FA097]">
          <MapPin className="w-3.5 h-3.5" />
          Stad
          <span className="text-[#2A3D32] font-normal normal-case tracking-normal">(valfritt)</span>
        </label>
        <input
          value={formData.city}
          onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
          placeholder="T.ex. Stockholm"
          autoCapitalize="words"
          className="w-full h-14 rounded-xl bg-[#0D1611] border border-[#1E2D24] px-4 text-[16px] text-[#F4F7F5] placeholder:text-[#2A3D32] outline-none focus:border-[#2BA84A]/60 transition-colors"
        />
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function ProfileSetupModal() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['supabase-userProfile', user?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!user?.id,
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    avatar_url: '',
    city: '',
    skill_level: '',
  });
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  // Pre-fill from profile or auth metadata once loaded
  useEffect(() => {
    if (authLoading || profileLoading) return;
    const src = profile || {};
    const authMeta = user?.user_metadata || {};
    const name = src.full_name || src.display_name || authMeta.full_name || authMeta.name || '';
    const avatar = src.avatar_url || authMeta.avatar_url || authMeta.picture || '';

    if (name && !formData.full_name) {
      setFormData((p) => ({ ...p, full_name: name }));
    }
    if (avatar && !formData.avatar_url) {
      setFormData((p) => ({ ...p, avatar_url: avatar }));
    }
    // Auto-suggest username from email if not set
    if (!formData.username && user?.email) {
      const prefix = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);
      const suffix = Math.floor(1000 + Math.random() * 9000);
      setFormData((p) => ({ ...p, username: prefix ? `${prefix}${suffix}` : `spelare${suffix}` }));
    }
  }, [user?.id, profileLoading]);

  const shouldShow = isAuthenticated && !authLoading && !profileLoading && !profile?.username && !done;
  if (!shouldShow) return null;

  // ── navigation ────────────────────────────────────────────────────────────

  const advance = () => { setDirection(1); setStep((s) => s + 1); };
  const retreat = () => { setDirection(-1); setStep((s) => s - 1); };

  const validateStep0 = () => {
    const errs = {};
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      errs.full_name = 'Namn måste vara minst 2 tecken';
    }
    if (!formData.username || !USERNAME_REGEX.test(formData.username)) {
      errs.username = 'Ogiltigt användarnamn — 3–30 tecken: a–z, 0–9, punkt, understreck';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePrimary = () => {
    if (step === 0 && !validateStep0()) return;
    if (step < STEP_COUNT - 1) {
      advance();
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: formData.full_name.trim(),
        username:  formData.username.trim().toLowerCase(),
        ...(formData.avatar_url                 && { avatar_url:   formData.avatar_url }),
        ...(formData.city.trim()                && { city:         formData.city.trim() }),
        ...(formData.skill_level                && { skill_level:  formData.skill_level }),
      });
      queryClient.invalidateQueries({ queryKey: ['supabase-userProfile', user?.id] });
      setDone(true);
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('username') || msg.includes('unique')) {
        setErrors({ username: 'Användarnamnet är redan taget — välj ett annat' });
        setDirection(-1);
        setStep(0);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── avatar upload ─────────────────────────────────────────────────────────

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData((p) => ({ ...p, avatar_url: file_url }));
    } catch {
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── computed ──────────────────────────────────────────────────────────────

  const initials = formData.full_name
    ? formData.full_name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const progressPct = ((step + 1) / STEP_COUNT) * 100;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#0F1513]"
      style={{
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Progress bar */}
      <div className="h-[3px] bg-[#1A2820]">
        <motion.div
          className="h-full bg-[#2BA84A]"
          initial={{ width: `${(1 / STEP_COUNT) * 100}%` }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Top bar: step label + back */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#2BA84A]">
          AllPlay
        </span>
        {step > 0 ? (
          <button
            onClick={retreat}
            className="text-[14px] text-[#8FA097] hover:text-[#F4F7F5] transition-colors"
          >
            ← Tillbaka
          </button>
        ) : (
          <span className="text-[13px] text-[#2A3D32]">
            Välkommen!
          </span>
        )}
      </div>

      {/* Scrollable step content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="h-full overflow-y-auto px-6 pt-6 pb-4"
          >
            {step === 0 && (
              <StepIdentity
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
              />
            )}
            {step === 1 && (
              <StepPhoto
                formData={formData}
                avatarPreview={avatarPreview}
                isUploading={isUploading}
                fileRef={fileRef}
                initials={initials}
                onFileSelect={handleFileSelect}
              />
            )}
            {step === 2 && (
              <StepLevel
                formData={formData}
                setFormData={setFormData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-6 pt-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePrimary}
          disabled={isSaving || isUploading}
          className="w-full h-14 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
          style={{
            background:  'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)',
            boxShadow:   '0 4px 20px rgba(43,168,74,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step === STEP_COUNT - 1 ? (
            'Kom igång'
          ) : (
            <>
              Fortsätt
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

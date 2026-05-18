import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, X, Upload, Image as ImageIcon, Check, Loader2, MapPin, Lock, Globe, Hash, Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { feedback } from "@/components/ui/feedback-toast";
import ImageCropPicker from "@/components/ui/ImageCropPicker";
import { UploadFile } from "@/components/supabase/integrations";

/**
 * CreateTeamForm v2 — premium creation flow
 *
 * Design principles:
 *   • Live preview header that reflects chosen color/logo/name
 *   • Clear sectioning: Identitet · Utseende · Inställningar
 *   • 8-color palette with animated ring on selection
 *   • Disabled submit state always legible (never hidden)
 *   • Mobile-first — sticky footer CTA inside form body
 *
 * Business logic is unchanged. Same payload shape as before.
 */

const TEAM_COLORS = [
  { value: '#2BA84A', name: 'Grön' },
  { value: '#F4743B', name: 'Orange' },
  { value: '#4169E1', name: 'Blå' },
  { value: '#9370DB', name: 'Lila' },
  { value: '#FFD700', name: 'Guld' },
  { value: '#DC2626', name: 'Röd' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#EC4899', name: 'Rosa' },
];

export default function CreateTeamForm({ user, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: user?.city || '',
    logo_url: '',
    captain_id: user?.id,
    is_public: true,
    max_members: 20,
    current_members: 1,
    elo_rating: 1000,
    rank_tier: 'brons',
    teamColor: '#2BA84A',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [cropLogoFile, setCropLogoFile] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      feedback.error('Vänligen välj en bild');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      feedback.error('Bilden är för stor. Max 5 MB tillåten.');
      return;
    }
    setCropLogoFile(file);
    e.target.value = '';
  };

  const handleLogoCropConfirm = async (blob) => {
    setCropLogoFile(null);
    const previewUrl = URL.createObjectURL(blob);
    setLogoPreview(previewUrl);
    setIsUploading(true);
    try {
      const croppedFile = new File([blob], 'team-logo.jpg', { type: 'image/jpeg' });
      const { file_url } = await UploadFile({ file: croppedFile });
      if (file_url) {
        setFormData((p) => ({ ...p, logo_url: file_url }));
      }
      // Don't save blob: URLs — they're temporary and won't persist across sessions.
    } catch (err) {
      console.error('Error uploading logo:', err);
      feedback.error('Logotypen kunde inte laddas upp. Försök igen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    formData.name.trim().length > 0 &&
    formData.city.trim().length > 0 &&
    !isSubmitting;

  const accent = formData.teamColor;

  return (
    <>
    <AnimatePresence>
      {cropLogoFile && (
        <ImageCropPicker
          file={cropLogoFile}
          shape="square"
          onCrop={handleLogoCropConfirm}
          onCancel={() => setCropLogoFile(null)}
        />
      )}
    </AnimatePresence>
    <div className="flex flex-col h-full max-h-[85vh] bg-[#0F1513] rounded-t-[20px] lg:rounded-[22px] overflow-hidden">
      {/* ── Live preview header ─────────────────── */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          background: `radial-gradient(120% 110% at 0% 0%, ${accent}38 0%, ${accent}14 30%, #0A100C 70%)`,
        }}
      >
        {/* Noise */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
        {/* Top hairline */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)',
          }}
        />

        <div className="relative flex items-center gap-3 px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-5">
          {/* Logo tile */}
          <div
            className="relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 ring-1 ring-white/20"
            style={{
              background: logoPreview || formData.logo_url
                ? 'transparent'
                : `linear-gradient(135deg, ${accent}, ${accent}66)`,
              boxShadow: `0 8px 22px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
            }}
          >
            {logoPreview || formData.logo_url ? (
              <img src={logoPreview || formData.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-6 h-6 text-white drop-shadow" strokeWidth={2.4} />
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65 leading-none">
              Skapa lag
            </div>
            <div className="mt-1 text-[18px] sm:text-[22px] font-black text-white tracking-[-0.02em] leading-tight truncate">
              {formData.name || 'Nytt lag'}
            </div>
            <div className="mt-0.5 text-[11.5px] text-white/60 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {formData.city || 'Välj stad'}
              <span className="text-white/30">•</span>
              <span>Max {formData.max_members}</span>
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white/85 ring-1 ring-white/10 transition-colors flex-shrink-0"
            aria-label="Stäng"
          >
            <X className="w-4 h-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────── */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5 space-y-5">

          {/* Section: Identity */}
          <Section title="Identitet" hint="Ge ditt lag ett namn och en hemstad">
            <FieldGroup>
              <Field
                label="Lagnamn"
                required
                counter={`${formData.name.length}/32`}
              >
                <Input
                  placeholder="t.ex. Gnesta Warriors"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="bg-[#0F1513] border border-[#243029] text-[#F4F7F5] placeholder:text-[#6B7A73] focus-visible:border-[#2BA84A]/45 focus-visible:ring-2 focus-visible:ring-[#2BA84A]/20 h-11 rounded-xl"
                  maxLength={32}
                />
              </Field>

              <Field label="Stad" required>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83] pointer-events-none" />
                  <Input
                    placeholder="t.ex. Stockholm"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    className="pl-9 bg-[#0F1513] border border-[#243029] text-[#F4F7F5] placeholder:text-[#6B7A73] focus-visible:border-[#2BA84A]/45 focus-visible:ring-2 focus-visible:ring-[#2BA84A]/20 h-11 rounded-xl"
                  />
                </div>
              </Field>

              <Field
                label="Beskrivning"
                hintInline="frivilligt"
                counter={`${formData.description.length}/500`}
              >
                <Textarea
                  placeholder="Vad söker ni? Vilka är ni?"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="bg-[#0F1513] border border-[#243029] text-[#F4F7F5] placeholder:text-[#6B7A73] focus-visible:border-[#2BA84A]/45 focus-visible:ring-2 focus-visible:ring-[#2BA84A]/20 min-h-[84px] rounded-xl resize-none"
                  maxLength={500}
                />
              </Field>
            </FieldGroup>
          </Section>

          {/* Section: Appearance */}
          <Section title="Utseende" hint="Färg och logotyp visas på matcher och profiler">
            {/* Color palette */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9EAAA4] mb-2">
                Lagfärg
              </div>
              <div className="grid grid-cols-8 gap-2">
                {TEAM_COLORS.map((c) => {
                  const isActive = formData.teamColor === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, teamColor: c.value }))}
                      className="relative aspect-square rounded-full transition-transform"
                      style={{
                        background: c.value,
                        transform: isActive ? 'scale(1.06)' : 'scale(1)',
                        boxShadow: isActive
                          ? `0 0 0 2px #0F1513, 0 0 0 4px ${c.value}, 0 4px 10px ${c.value}55`
                          : `0 2px 6px rgba(0,0,0,0.35)`,
                      }}
                      aria-label={c.name}
                    >
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={3} />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9EAAA4] mb-2">
                Logotyp <span className="text-[#6B7A73] normal-case tracking-normal font-normal">(frivilligt)</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="relative w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-[#243029] bg-[#0F1513] flex items-center justify-center flex-shrink-0"
                >
                  {logoPreview || formData.logo_url ? (
                    <img src={logoPreview || formData.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#6B7A73]" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    id="team-logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label htmlFor="team-logo-upload" className="block">
                    <button
                      type="button"
                      onClick={() => document.getElementById('team-logo-upload').click()}
                      disabled={isUploading}
                      className="w-full h-11 rounded-xl bg-[#121715] hover:bg-[#18221E] ring-1 ring-[#243029] text-[#F4F7F5] text-[13px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    >
                      {isUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Laddar upp…</>
                      ) : (
                        <><Upload className="w-4 h-4" strokeWidth={2.4} /> {formData.logo_url ? 'Byt logotyp' : 'Ladda upp'}</>
                      )}
                    </button>
                  </label>
                  <p className="mt-1.5 text-[11px] text-[#6B7A73]">Max 5 MB · PNG, JPG eller GIF</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Section: Settings */}
          <Section title="Inställningar">
            {/* Public / Private */}
            <div className="rounded-xl bg-[#121715] ring-1 ring-[#243029] p-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: formData.is_public ? '#2BA84A1E' : '#9370DB1E',
                    boxShadow: `inset 0 0 0 1px ${formData.is_public ? '#2BA84A44' : '#9370DB44'}`,
                  }}
                >
                  {formData.is_public ? (
                    <Globe className="w-4 h-4 text-[#86EFAC]" strokeWidth={2.4} />
                  ) : (
                    <Lock className="w-4 h-4 text-[#C4B5FD]" strokeWidth={2.4} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold text-[#F4F7F5] leading-tight">
                    {formData.is_public ? 'Öppet lag' : 'Privat lag'}
                  </div>
                  <div className="text-[11.5px] text-[#9EAAA4] mt-0.5 leading-snug">
                    {formData.is_public
                      ? 'Vem som helst kan hitta laget och ansöka'
                      : 'Endast via inbjudan från kapten'}
                  </div>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_public: checked }))}
                  className="data-[state=checked]:bg-[#2BA84A] flex-shrink-0"
                />
              </div>
            </div>

            {/* Max members */}
            <div className="mt-3 rounded-xl bg-[#121715] ring-1 ring-[#243029] p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#18221E] flex items-center justify-center flex-shrink-0">
                  <Hash className="w-4 h-4 text-[#9EAAA4]" strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold text-[#F4F7F5] leading-tight">
                    Max antal medlemmar
                  </div>
                  <div className="text-[11.5px] text-[#9EAAA4] mt-0.5">
                    Mellan 5 och 50 spelare
                  </div>
                </div>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={formData.max_members}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, max_members: parseInt(e.target.value) || 5 }))
                  }
                  className="w-20 h-11 text-center tabular-nums bg-[#0F1513] border border-[#243029] text-[#F4F7F5] focus-visible:border-[#2BA84A]/45 focus-visible:ring-2 focus-visible:ring-[#2BA84A]/20 rounded-xl text-[14px] font-bold"
                />
              </div>
            </div>

            {/* Info banner */}
            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#4169E1]/8 ring-1 ring-[#4169E1]/25">
              <Info className="w-4 h-4 text-[#A5B4FC] flex-shrink-0 mt-0.5" strokeWidth={2.3} />
              <p className="text-[11.5px] text-[#B0C4DE] leading-snug">
                Du blir automatiskt kapten. Du kan utse vice-kaptener efter att laget skapats.
              </p>
            </div>
          </Section>
        </div>
      </form>

      {/* ── Sticky footer CTA ──────────────────── */}
      <div
        className="flex-shrink-0 p-3 sm:p-4 border-t border-[#223029] bg-[#0F1513]"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-12 px-5 rounded-xl bg-[#121715] hover:bg-[#18221E] text-[#F4F7F5] text-[14px] font-bold ring-1 ring-[#243029] transition-colors disabled:opacity-60"
          >
            Avbryt
          </button>
          <motion.button
            type="submit"
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 relative overflow-hidden h-12 rounded-xl text-white text-[14px] font-black tracking-[-0.005em] transition-opacity disabled:opacity-40"
            style={{
              background: canSubmit
                ? `linear-gradient(180deg, ${accent} 0%, ${accent}DD 55%, ${accent}99 100%)`
                : '#18221E',
              boxShadow: canSubmit
                ? `0 10px 24px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`
                : 'none',
            }}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Skapar lag…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Shield className="w-4 h-4" strokeWidth={2.6} />
                Skapa lag
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Primitives ────────────────────────────────
function Section({ title, hint, children }) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7B8A83] leading-none">
          {title}
        </h3>
        {hint && (
          <p className="mt-1.5 text-[12px] text-[#9EAAA4] leading-snug">{hint}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function FieldGroup({ children }) {
  return <div className="space-y-3">{children}</div>;
}

function Field({ label, required, hintInline, counter, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-[12.5px] font-semibold text-[#F4F7F5]">
          {label}
          {required && <span className="text-[#FDBA74] ml-1">*</span>}
          {hintInline && (
            <span className="ml-1.5 text-[11px] text-[#6B7A73] font-normal">({hintInline})</span>
          )}
        </Label>
        {counter && <span className="text-[11px] text-[#6B7A73] tabular-nums">{counter}</span>}
      </div>
      {children}
    </div>
  );
}
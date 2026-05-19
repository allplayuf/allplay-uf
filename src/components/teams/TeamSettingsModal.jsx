import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Shield, Camera, Loader2, Users, Globe, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import feedback from "@/components/ui/feedback-toast";
import { updateTeam } from "@/components/supabase/services/teamsService";
import { UploadFile } from "@/components/supabase/integrations";

export default function TeamSettingsModal({ team, onClose, onDeleted }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: team.name || "",
    description: team.description || "",
    city: team.city || "",
    max_members: team.max_members || 20,
    is_public: team.is_public !== false, // default true
    logo_url: team.logo_url || "",
  });
  const [logoPreview, setLogoPreview] = useState(team.logo_url || null);
  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let logo_url = form.logo_url;

      if (logoFile) {
        setIsUploadingLogo(true);
        try {
          const result = await UploadFile({ file: logoFile });
          logo_url = result.file_url;
        } finally {
          setIsUploadingLogo(false);
        }
      }

      return updateTeam(team.id, {
        name: data.name.trim(),
        description: data.description.trim() || null,
        city: data.city.trim(),
        max_members: Number(data.max_members),
        is_public: data.is_public,
        logo_url: logo_url || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-detail", team.id] });
      feedback.success("Lagsinställningar sparade");
      onClose();
    },
    onError: (err) => {
      feedback.error(err.message || "Kunde inte spara");
    },
  });

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      feedback.error("Välj en bildfil");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      feedback.error("Max 5 MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      feedback.error("Lagnamnet måste vara minst 2 tecken");
      return;
    }
    if (!form.city.trim() || form.city.trim().length < 2) {
      feedback.error("Ange en stad");
      return;
    }
    const maxM = Number(form.max_members);
    if (isNaN(maxM) || maxM < 2 || maxM > 50) {
      feedback.error("Max spelare måste vara 2–50");
      return;
    }
    saveMutation.mutate(form);
  };

  const isSaving = saveMutation.isPending || isUploadingLogo;

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="relative z-10 w-full sm:max-w-lg mx-auto bg-[#121715] rounded-t-[22px] sm:rounded-[22px] border border-[#223029] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#223029]">
          <div>
            <div className="inline-flex items-center gap-1.5 mb-0.5 px-1.5 py-0.5 rounded-full bg-[#F4743B]/10 ring-1 ring-[#F4743B]/25">
              <span className="text-[9px] font-bold text-[#F4743B] uppercase tracking-wider">Kapten</span>
            </div>
            <h2 className="text-[18px] font-black text-white tracking-tight">Lagsinställningar</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] ring-1 ring-white/10 text-[#C2CEC8] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <form onSubmit={handleSubmit} id="team-settings-form" className="space-y-5">

            {/* Logo */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm">Lagslogga</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-[#18221E] border border-[#223029] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-8 h-8 text-[#4B5A52]" />
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-[#18221E] border border-[#223029] text-[#F4F7F5] hover:border-[#2BA84A]/50 hover:bg-[#1E2724] transition-all text-sm font-medium"
                  >
                    <Camera className="w-4 h-4 text-[#2BA84A]" />
                    {logoPreview ? "Byt logga" : "Ladda upp logga"}
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => { setLogoPreview(null); setLogoFile(null); setForm(p => ({ ...p, logo_url: "" })); }}
                      className="text-[11px] text-[#F4743B] hover:text-[#FF8A4D] transition-colors"
                    >
                      Ta bort logga
                    </button>
                  )}
                  <p className="text-[11px] text-[#9EAAA4]">JPG, PNG eller GIF · max 5 MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm">Lagnamn *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                maxLength={50}
                placeholder="Lagets namn..."
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#9EAAA4] h-11 rounded-[12px]"
              />
              <p className="text-[11px] text-[#9EAAA4] text-right">{form.name.length}/50</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm">Beskrivning</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                maxLength={300}
                placeholder="Berätta om laget..."
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#9EAAA4] h-24 rounded-[12px] resize-none"
              />
              <p className="text-[11px] text-[#9EAAA4] text-right">{form.description.length}/300</p>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm">Stad *</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))}
                maxLength={50}
                placeholder="t.ex. Stockholm"
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#9EAAA4] h-11 rounded-[12px]"
              />
            </div>

            {/* Max members + public toggle */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold text-sm flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2BA84A]" />
                  Max spelare
                </Label>
                <Input
                  type="number"
                  min={2}
                  max={50}
                  value={form.max_members}
                  onChange={(e) => setForm(p => ({ ...p, max_members: e.target.value }))}
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 h-11 rounded-[12px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold text-sm flex items-center gap-1.5">
                  {form.is_public
                    ? <Globe className="w-3.5 h-3.5 text-[#2BA84A]" />
                    : <Lock className="w-3.5 h-3.5 text-[#9EAAA4]" />
                  }
                  {form.is_public ? "Öppet lag" : "Privat lag"}
                </Label>
                <div className="h-11 flex items-center px-3 bg-[#18221E] border border-[#223029] rounded-[12px]">
                  <Switch
                    checked={form.is_public}
                    onCheckedChange={(v) => setForm(p => ({ ...p, is_public: v }))}
                  />
                  <span className="ml-3 text-[12px] text-[#9EAAA4]">
                    {form.is_public ? "Vem som helst kan ansöka" : "Bara inbjudna"}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="pt-2 border-t border-[#223029]">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-[13px] text-[#F4743B]/70 hover:text-[#F4743B] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Ta bort lag
                </button>
              ) : (
                <div className="p-3 rounded-[12px] bg-[#DC2626]/10 border border-[#DC2626]/30 space-y-3">
                  <p className="text-[13px] text-[#FCA5A5] font-semibold">
                    Är du säker? Detta går inte att ångra.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 h-9 rounded-[10px] border border-[#223029] text-[#F4F7F5] text-sm font-medium hover:bg-[#18221E] transition-colors"
                    >
                      Avbryt
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { deleteTeamRest } = await import("@/components/supabase/services/teamsService");
                          await deleteTeamRest(team.id);
                          feedback.success("Laget har tagits bort");
                          onClose();
                          onDeleted?.();
                        } catch (err) {
                          feedback.error(err.message || "Kunde inte ta bort laget");
                        }
                      }}
                      className="flex-1 h-9 rounded-[10px] bg-[#DC2626] text-white text-sm font-bold hover:bg-[#B91C1C] transition-colors"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 py-4 border-t border-[#223029] flex gap-3"
          style={{ paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-[14px] border border-[#223029] text-[#F4F7F5] font-semibold hover:bg-[#18221E] transition-all"
          >
            Avbryt
          </button>
          <button
            type="submit"
            form="team-settings-form"
            disabled={isSaving}
            className="flex-2 flex-grow-[2] h-12 rounded-[14px] bg-[#2BA84A] text-white font-bold hover:bg-[#248232] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? "Sparar..." : "Spara ändringar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

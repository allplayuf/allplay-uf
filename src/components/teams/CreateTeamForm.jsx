import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Shield, X, Upload, Image as ImageIcon, Palette, Check, Loader2, Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { callEdgeFunction } from "@/components/supabase/callEdgeFunction";

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
    teamColor: '#2BA84A'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vänligen välj en bild');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Bilden är för stor. Max 5MB tillåten.');
      return;
    }

    setIsUploading(true);
    try {
      // Create a local preview and use it; actual upload done via form data
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      
      // Upload via edge function (upload_file) or just store preview for now
      // The CreateTeamForm doesn't need base44 SDK for file upload
      // We'll use a FormData approach via a generic upload endpoint if available
      // For now, store local preview - the logo_url will be set by the parent
      setFormData(prev => ({ ...prev, logo_url: previewUrl }));
      
      // Note: If Supabase storage upload is available, we'd use that instead
      console.log('[CreateTeamForm] Logo preview set locally');
    } catch (error) {
      console.error("Error uploading logo:", error);
      window.alert("Kunde inte ladda upp logotyp. Försök igen.");
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

  const canSubmit = formData.name.trim().length > 0 && formData.city.trim().length > 0 && !isSubmitting;

  return (
    <>
      <Card className="bg-[#121715] border-0 shadow-none rounded-t-[20px] lg:rounded-[20px] flex flex-col max-h-[85vh] lg:max-h-[85vh] overflow-hidden">
        {/* Header with team color preview */}
        <div className="relative overflow-hidden rounded-t-[20px] lg:rounded-t-[16px] flex-shrink-0">
          <div 
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(135deg, ${formData.teamColor}, transparent)` }}
          />
          <div className="relative border-b border-[#223029] p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${formData.teamColor}, ${formData.teamColor}88)` }}
                >
                  {logoPreview || formData.logo_url ? (
                    <img src={logoPreview || formData.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">
                    {formData.name || 'Nytt lag'}
                  </h2>
                  <p className="text-xs text-[#7B8A83]">
                    {formData.city || 'Välj stad'} • {formData.max_members} spelare max
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#7B8A83] hover:bg-[#18221E] hover:text-[#F4F7F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

            {/* Team Color */}
            <div className="space-y-3 p-3 bg-[#18221E] rounded-[14px] border border-[#223029]">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#9B59B6]" />
                Lagfärg
              </Label>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '#2BA84A', // Green
                  '#F4743B', // Orange
                  '#4169E1', // Blue
                  '#9370DB', // Purple
                  '#FFD700', // Gold
                  '#DC2626', // Red
                  '#14B8A6', // Teal
                  '#EC4899'  // Pink
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, teamColor: color }))}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      formData.teamColor === color 
                        ? 'ring-2 ring-[#F4F7F5] scale-110' 
                        : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formData.teamColor === color && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Laglogotyp</Label>
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 bg-[#18221E] border-2 border-[#223029] rounded-xl flex items-center justify-center overflow-hidden">
                  {logoPreview || formData.logo_url ? (
                    <img 
                      src={logoPreview || formData.logo_url} 
                      alt="Team Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-[#9B59B6]" />
                  )}
                </div>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label htmlFor="logo-upload" className="w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-[#9B59B6] text-[#9B59B6] hover:bg-[#9B59B6] hover:text-[#FFFFFF] font-semibold transition-all"
                    disabled={isUploading}
                    onClick={() => document.getElementById('logo-upload').click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Laddar upp...' : 'Ladda upp logotyp'}
                  </Button>
                </label>
                <p className="text-xs text-[#7B8A83] text-center">
                  Max 5MB. PNG, JPG eller GIF
                </p>
              </div>
            </div>

            {/* Team Name */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Lagnamn *</Label>
              <Input
                placeholder="t.ex. Gnesta Warriors"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 placeholder:text-[#7B8A83] h-11 sm:h-12 text-sm sm:text-base rounded-[14px]"
                maxLength={32}
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Stad *</Label>
              <Input
                placeholder="t.ex. Stockholm"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 placeholder:text-[#7B8A83] h-11 sm:h-12 text-sm sm:text-base rounded-[14px]"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Beskrivning</Label>
              <Textarea
                placeholder="Beskriv ditt lag och vad ni letar efter..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 placeholder:text-[#7B8A83] h-20 text-sm sm:text-base rounded-[14px]"
                maxLength={500}
              />
              <p className="text-xs text-[#7B8A83] text-right">
                {formData.description.length}/500
              </p>
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Max antal medlemmar</Label>
              <Input
                type="number"
                min="5"
                max="50"
                value={formData.max_members}
                onChange={(e) => setFormData(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 h-11 sm:h-12 text-sm sm:text-base rounded-[14px]"
              />
            </div>

            {/* Public/Private */}
            <div className="space-y-3 p-3 bg-[#18221E] rounded-[14px] border border-[#223029]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Öppet lag</Label>
                  <p className="text-xs sm:text-sm text-[#7B8A83]">Vem som helst kan ansöka om medlemskap</p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                  className="data-[state=checked]:bg-[#9B59B6]"
                />
              </div>
            </div>

            {/* Submit Button - always visible */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full h-12 rounded-[14px] font-bold text-base flex items-center justify-center gap-2 transition-all ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#2BA84A] to-[#248232] text-white shadow-[0_4px_16px_rgba(43,168,74,0.4)] hover:shadow-[0_6px_24px_rgba(43,168,74,0.5)] hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-[#18221E] text-[#7B8A83] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Skapar lag...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Skapa lag
                </>
              )}
            </button>
          </form>
        </CardContent>
      </Card>

    </>
  );
}
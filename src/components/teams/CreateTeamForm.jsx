import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Shield, X, Upload, Image as ImageIcon, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

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
    rank_tier: 'brons'
  });
  const [isUploading, setIsUploading] = useState(false);
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
      setLogoPreview(URL.createObjectURL(file));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Kunde inte ladda upp logotyp. Försök igen.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.city) {
      alert("Fyll i lagnamn och stad!");
      return;
    }
    onSubmit(formData);
  };

  return (
    <>
      <Card className="bg-[#121715] border-0 shadow-none rounded-t-[20px] lg:rounded-[20px] flex flex-col h-full overflow-hidden">
        <CardHeader className="border-b border-[#223029] bg-gradient-to-br from-[#9B59B6]/10 to-[#8E44AD]/10 rounded-t-[20px] lg:rounded-t-[16px] p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#F4F7F5] flex items-center gap-2 sm:gap-3">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#9B59B6]" />
              <span>Skapa nytt lag</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] rounded-xl min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] font-semibold transition-all min-h-[44px]"
              >
                Avbryt
              </button>
              
              <motion.button
                type="submit"
                animate={{
                  boxShadow: [
                    '0 4px 16px rgba(155, 89, 182, 0.3)',
                    '0 4px 20px rgba(155, 89, 182, 0.5)',
                    '0 4px 16px rgba(155, 89, 182, 0.3)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: '0 6px 24px rgba(155, 89, 182, 0.6)'
                }}
                whileTap={{ 
                  scale: 0.98,
                  boxShadow: '0 2px 12px rgba(155, 89, 182, 0.4)'
                }}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white font-bold text-[13px] tracking-wide uppercase ring-2 ring-[#9B59B6]/30 transition-all relative overflow-hidden min-h-[44px]"
              >
                <span className="relative z-10">Skapa lag</span>
                <Shield className="w-4 h-4 relative z-10" />
                
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 4
                  }}
                />
              </motion.button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Prevent body scroll when modal is open */}
      <style jsx global>{`
        body {
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
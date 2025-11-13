import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, Trophy, Save, Upload, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../dashboard/CupsWidget";

export default function EditCupModal({ cup, onClose }) {
  const { alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: cup.name || '',
    description: cup.description || '',
    location: cup.location || '',
    logo_url: cup.logo_url || '',
    start_date: cup.start_date || '',
    end_date: cup.end_date || '',
    start_time: cup.start_time || '',
    rules: cup.rules || '',
    prize: cup.prize || '',
    entry_fee: cup.entry_fee || 0,
    max_participants: cup.max_participants || 16,
    is_public: cup.is_public !== false,
  });

  const [logoPreview, setLogoPreview] = useState(cup.logo_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Ogiltigt filformat', 'Vänligen välj en bildfil.', { type: 'alert' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Filen är för stor', 'Loggan måste vara mindre än 5MB.', { type: 'alert' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploadingLogo(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: uploadResult.file_url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Uppladdning misslyckades', 'Kunde inte ladda upp loggan.', { type: 'alert' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateCupMutation = useMutation({
    mutationFn: async (updates) => {
      const response = await base44.functions.invoke('cups/updateCup', {
        cup_id: cup.id,
        updates
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      alert('Turnering uppdaterad! ✅', 'Ändringarna har sparats.', { type: 'success' });
      onClose();
    },
    onError: (error) => {
      alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte uppdatera turneringen.', { type: 'alert' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.start_date || !formData.start_time) {
      alert('Saknade fält', 'Vänligen fyll i alla obligatoriska fält.', { type: 'alert' });
      return;
    }

    updateCupMutation.mutate(formData);
  };

  return (
    <>
      <DialogContainer />
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end lg:items-center justify-center z-[60] p-0">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1F2937] rounded-t-[20px] lg:rounded-2xl w-full lg:max-w-2xl border border-[#374151] shadow-2xl h-[90vh] lg:h-auto lg:max-h-[90vh] mb-16 lg:mb-0 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#374151] bg-gradient-to-r from-[#FF7A3D]/10 to-[#F97316]/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FF7A3D]/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#FF7A3D]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#FFFFFF]">Redigera Turnering</h2>
                <p className="text-xs text-[#9CA3AF]">Uppdatera turneringsinformation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#374151] transition-colors text-[#9CA3AF] hover:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Logo */}
            <div className="space-y-3">
              <Label className="text-[#FFFFFF] font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF7A3D]" />
                Turneringslogga
              </Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#FF7A3D]/30 flex-shrink-0">
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload-edit"
                  />
                  <label htmlFor="logo-upload-edit">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-[#FF7A3D]/50 text-[#FF7A3D] hover:bg-[#FF7A3D]/10 gap-2 font-semibold"
                      disabled={uploadingLogo}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('logo-upload-edit').click();
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? 'Laddar upp...' : logoPreview ? 'Ändra logga' : 'Ladda upp logga'}
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-[#FFFFFF] font-semibold">Turneringsnamn *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[#FFFFFF] font-semibold">Beskrivning</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-24 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-[#FFFFFF] font-semibold">Plats *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                required
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#FFFFFF] font-semibold">Startdatum *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#FFFFFF] font-semibold">Starttid *</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                  required
                />
              </div>
            </div>

            {/* Max Participants & Entry Fee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#FFFFFF] font-semibold">Max deltagare</Label>
                <Input
                  type="number"
                  min="4"
                  max="64"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#FFFFFF] font-semibold">Avgift (kr)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: parseInt(e.target.value) }))}
                  className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
                />
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <Label className="text-[#FFFFFF] font-semibold">Regler</Label>
              <Textarea
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                className="h-32 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
              />
            </div>

            {/* Prize */}
            <div className="space-y-2">
              <Label className="text-[#FFFFFF] font-semibold">Priser</Label>
              <Input
                value={formData.prize}
                onChange={(e) => setFormData(prev => ({ ...prev, prize: e.target.value }))}
                className="h-11 bg-[#0E0F10] border-[#374151] text-[#FFFFFF] focus:border-[#FF7A3D] focus:ring-1 focus:ring-[#FF7A3D]/30"
              />
            </div>

            {/* Public Switch */}
            <div className="flex items-center justify-between p-4 bg-[#0E0F10] rounded-xl border border-[#374151]">
              <div>
                <Label className="text-[#FFFFFF] font-semibold">Publik turnering</Label>
                <p className="text-sm text-[#9CA3AF]">Synlig för alla användare</p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                className="data-[state=checked]:bg-[#FF7A3D]"
              />
            </div>
          </form>

          {/* Footer Buttons */}
          <div className="flex gap-3 p-6 border-t border-[#374151] flex-shrink-0 bg-[#1F2937]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-[#374151] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#FFFFFF] font-semibold"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateCupMutation.isPending || uploadingLogo}
              className="flex-1 h-12 bg-[#FF7A3D] hover:bg-[#F97316] text-[#FFFFFF] gap-2 font-semibold shadow-lg"
            >
              <Save className="w-4 h-4" />
              {updateCupMutation.isPending ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
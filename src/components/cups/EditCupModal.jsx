import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Trophy, Save, Upload, ImageIcon, MapPin } from "lucide-react";
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
    venue_ids: cup.venue_ids || [],
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

  // Fetch venues
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
    staleTime: 5 * 60 * 1000,
  });

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

    if (formData.venue_ids.length === 0) {
      alert('Ingen plan vald', 'Du måste välja minst en plan för turneringen.', { type: 'alert' });
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
          className="bg-[#121715] rounded-t-[20px] lg:rounded-2xl w-full lg:max-w-2xl border border-[#223029] shadow-2xl h-[90vh] lg:h-auto lg:max-h-[90vh] mb-16 lg:mb-0 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#223029] bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F4F7F5]">Redigera Turnering</h2>
                <p className="text-xs text-[#B6C2BC]">Uppdatera turneringsinformation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#18221E] transition-colors text-[#B6C2BC] hover:text-[#F4F7F5]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Logo */}
            <div className="space-y-3">
              <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#F59E0B]" />
                Turneringslogga
              </Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#F59E0B]/30 flex-shrink-0">
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
                      className="w-full h-11 border-[#F59E0B]/50 text-[#FCD34D] hover:bg-[#F59E0B]/10 gap-2 font-semibold"
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
              <Label className="text-[#F4F7F5] font-semibold">Turneringsnamn *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold">Beskrivning</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-24 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold">Plats *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                required
              />
            </div>

            {/* NYTT: Venue Selection */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F59E0B]" />
                Plan för matcher *
              </Label>
              <Select 
                value={formData.venue_ids[0] || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, venue_ids: [value] }))}
              >
                <SelectTrigger className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30">
                  <SelectValue placeholder="Välj en plan..." />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name} - {venue.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#B6C2BC]">Välj vilken plan matcherna ska spelas på</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Startdatum *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Starttid *</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                  required
                />
              </div>
            </div>

            {/* Max Participants & Entry Fee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Max deltagare</Label>
                <Input
                  type="number"
                  min="4"
                  max="64"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Avgift (kr)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: parseInt(e.target.value) }))}
                  className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                />
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold">Regler</Label>
              <Textarea
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                className="h-32 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
              />
            </div>

            {/* Prize */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold">Priser</Label>
              <Input
                value={formData.prize}
                onChange={(e) => setFormData(prev => ({ ...prev, prize: e.target.value }))}
                className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
              />
            </div>

            {/* Public Switch */}
            <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029]">
              <div>
                <Label className="text-[#F4F7F5] font-semibold">Publik turnering</Label>
                <p className="text-sm text-[#B6C2BC]">Synlig för alla användare</p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                className="data-[state=checked]:bg-[#F59E0B]"
              />
            </div>
          </form>

          {/* Footer Buttons */}
          <div className="flex gap-3 p-6 border-t border-[#223029] flex-shrink-0 bg-[#121715]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] font-semibold"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateCupMutation.isPending || uploadingLogo}
              className="flex-1 h-12 bg-[#F59E0B] hover:bg-[#D97706] text-[#FFFFFF] gap-2 font-semibold shadow-lg"
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
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trophy, ArrowLeft, Calendar, MapPin, Users, Target, Sparkles, Upload, Image as ImageIcon } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";

export default function CreateCupPage() {
  const navigate = useNavigate();
  const { alert, DialogContainer } = useCustomDialog();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    venue_ids: [],
    logo_url: '',
    start_date: '',
    end_date: '',
    start_time: '',
    format: '5v5',
    signup_type: 'team',
    skill_level: 'mixed',
    age_group: 'Open',
    max_participants: 16,
    rules: '',
    prize: '',
    entry_fee: 0,
    has_group_stage: true,
    has_playoffs: true,
    number_of_groups: 4,
    teams_advance_per_group: 2,
    enable_mvp_voting: true,
    is_public: true
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch venues
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
    staleTime: 5 * 60 * 1000,
  });

  // Handle logo upload
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Ogiltigt filformat', 'Vänligen välj en bildfil.', { type: 'alert' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Filen är för stor', 'Loggan måste vara mindre än 5MB.', { type: 'alert' });
      return;
    }

    setLogoFile(file);
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
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

  // Create cup mutation
  const createCupMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('cups/createCup', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        alert('Turnering skapad! 🏆', 'Din turnering har skapats framgångsrikt!', { type: 'success' });
        navigate(`${createPageUrl("CupDetail")}?cup_id=${data.cup.id}`);
      }
    },
    onError: (error) => {
      console.error('Error creating cup:', error);
      alert('Ett fel uppstod', error.response?.data?.error || error.message || 'Kunde inte skapa turneringen.', { type: 'alert' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.location || !formData.start_date || !formData.start_time) {
      alert('Saknade fält', 'Vänligen fyll i alla obligatoriska fält.', { type: 'alert' });
      return;
    }

    if (formData.max_participants < 4 || formData.max_participants > 64) {
      alert('Ogiltigt antal', 'Antal deltagare måste vara mellan 4 och 64.', { type: 'alert' });
      return;
    }

    createCupMutation.mutate(formData);
  };

  const formatMaxParticipants = {
    '5v5': 16,
    '7v7': 20,
    '11v11': 32
  };

  const handleFormatChange = (format) => {
    setFormData(prev => ({
      ...prev,
      format,
      max_participants: formatMaxParticipants[format]
    }));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Back Button */}
        <Link to={createPageUrl("Community") + "?tab=cups"}>
          <Button variant="ghost" className="text-[#B6C2BC] hover:text-[#F4F7F5] gap-2">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Button>
        </Link>

        {/* Header with Enhanced Golden Theme */}
        <Card className="bg-gradient-to-br from-[#F59E0B]/12 to-[#D97706]/8 border border-[#F59E0B]/40 rounded-[20px] p-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 flex items-center justify-center border border-[#F59E0B]/30">
              <Trophy className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F4F7F5] flex items-center gap-2">
                Skapa Turnering
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
              </h1>
              <p className="text-sm text-[#B6C2BC]">Organisera en ny turnering eller cup</p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info */}
          <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#F4F7F5]">Grundläggande Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#F59E0B]" />
                  Turneringslogga
                </Label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#F59E0B]/30 flex-shrink-0">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10 gap-2"
                        disabled={uploadingLogo}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('logo-upload').click();
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingLogo ? 'Laddar upp...' : logoPreview ? 'Ändra logga' : 'Ladda upp logga'}
                      </Button>
                    </label>
                    <p className="text-xs text-[#B6C2BC] mt-2">Max 5MB, PNG/JPG/GIF</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Turneringsnamn *</Label>
                <Input
                  placeholder="t.ex. Stockholm Summer Cup 2025"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Beskrivning</Label>
                <Textarea
                  placeholder="Beskriv turneringen..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-24 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#F59E0B]" />
                  Plats *
                </Label>
                <Input
                  placeholder="t.ex. Stockholm"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                  required
                />
              </div>

              {/* Date and Time */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F59E0B]" />
                  Startdatum och tid *
                </Label>
                <DateTimePicker
                  date={formData.start_date}
                  time={formData.start_time}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, start_date: date }))}
                  onTimeChange={(time) => setFormData(prev => ({ ...prev, start_time: time }))}
                  minDate={today}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tournament Settings */}
          <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#F4F7F5]">Turneringsinställningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Format */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#F59E0B]" />
                  Matchformat *
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {['5v5', '7v7', '11v11'].map(format => (
                    <Button
                      key={format}
                      type="button"
                      onClick={() => handleFormatChange(format)}
                      className={`h-14 font-bold transition-all ${
                        formData.format === format
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-lg'
                          : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029]'
                      }`}
                    >
                      {format}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Signup Type */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Anmälningstyp *</Label>
                <Select value={formData.signup_type} onValueChange={(value) => setFormData(prev => ({ ...prev, signup_type: value }))}>
                  <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">👥 Lag</SelectItem>
                    <SelectItem value="solo">⚽ Solo (spelare)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Skill Level */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#F59E0B]" />
                  Nivå *
                </Label>
                <Select value={formData.skill_level} onValueChange={(value) => setFormData(prev => ({ ...prev, skill_level: value }))}>
                  <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Nybörjare</SelectItem>
                    <SelectItem value="intermediate">Medel</SelectItem>
                    <SelectItem value="advanced">Avancerad</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="mixed">Blandad nivå</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Max antal deltagare *</Label>
                <Input
                  type="number"
                  min="4"
                  max="64"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                />
              </div>

              {/* Entry Fee */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Anmälningsavgift (kr)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: parseInt(e.target.value) }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                />
              </div>
            </CardContent>
          </Card>

          {/* Structure */}
          <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#F4F7F5]">Turneringsstruktur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Group Stage */}
              <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                <div>
                  <Label className="text-[#F4F7F5] font-semibold">Gruppspel</Label>
                  <p className="text-sm text-[#B6C2BC]">Inkludera gruppspel före slutspel</p>
                </div>
                <Switch
                  checked={formData.has_group_stage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_group_stage: checked }))}
                  className="data-[state=checked]:bg-[#F59E0B]"
                />
              </div>

              {formData.has_group_stage && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div className="space-y-2">
                    <Label className="text-[#F4F7F5] font-semibold">Antal grupper</Label>
                    <Input
                      type="number"
                      min="2"
                      max="8"
                      value={formData.number_of_groups}
                      onChange={(e) => setFormData(prev => ({ ...prev, number_of_groups: parseInt(e.target.value) }))}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[#F4F7F5] font-semibold">Lag vidare per grupp</Label>
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      value={formData.teams_advance_per_group}
                      onChange={(e) => setFormData(prev => ({ ...prev, teams_advance_per_group: parseInt(e.target.value) }))}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                    />
                  </div>
                </div>
              )}

              {/* Playoffs */}
              <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                <div>
                  <Label className="text-[#F4F7F5] font-semibold">Slutspel</Label>
                  <p className="text-sm text-[#B6C2BC]">Inkludera slutspel (bracket)</p>
                </div>
                <Switch
                  checked={formData.has_playoffs}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_playoffs: checked }))}
                  className="data-[state=checked]:bg-[#F59E0B]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#F4F7F5]">Ytterligare Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Rules */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Regler</Label>
                <Textarea
                  placeholder="Beskriv turneringens regler..."
                  value={formData.rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-32 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                />
              </div>

              {/* Prize */}
              <div className="space-y-2">
                <Label className="text-[#F4F7F5] font-semibold">Priser</Label>
                <Input
                  placeholder="t.ex. 10 000 kr till vinnaren"
                  value={formData.prize}
                  onChange={(e) => setFormData(prev => ({ ...prev, prize: e.target.value }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
                />
              </div>

              {/* Public */}
              <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
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
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Link to={createPageUrl("Community") + "?tab=cups"} className="flex-1">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-[#223029] text-[#B6C2BC] hover:bg-[#18221E]"
              >
                Avbryt
              </Button>
            </Link>
            
            <Button 
              type="submit" 
              disabled={createCupMutation.isPending || uploadingLogo}
              className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white gap-2 font-semibold shadow-lg"
            >
              <Trophy className="w-4 h-4" />
              {createCupMutation.isPending ? 'Skapar...' : 'Skapa Turnering'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trophy, ArrowLeft, Calendar, MapPin, Users, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useCustomDialog } from "../components/ui/custom-dialog";

export default function CreateCupPage() {
  const navigate = useNavigate();
  const { alert } = useCustomDialog();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    start_time: '10:00',
    format: '5v5',
    signup_type: 'team',
    skill_level: 'mixed',
    age_group: '',
    max_participants: 16,
    rules: '',
    prize: '',
    entry_fee: 0,
    registration_deadline: '',
    has_group_stage: true,
    has_playoffs: true,
    number_of_groups: 4,
    teams_advance_per_group: 2,
    enable_mvp_voting: true,
    notifications_enabled: true,
    is_public: true,
    venue_ids: []
  });

  const [selectedVenues, setSelectedVenues] = useState([]);

  // Fetch venues
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
    staleTime: 15 * 60 * 1000,
  });

  const createCupMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('cups/createCup', data);
      return response.data;
    },
    onSuccess: (data) => {
      alert('Turnering skapad! 🏆', 'Din turnering har skapats!', { type: 'success' });
      navigate(`${createPageUrl("CupDetail")}?cup_id=${data.cup.id}`);
    },
    onError: (error) => {
      alert('Fel', error.message || 'Kunde inte skapa turnering.', { type: 'alert' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.start_date) {
      alert('Fyll i alla fält', 'Namn, plats och startdatum är obligatoriska.', { type: 'alert' });
      return;
    }

    createCupMutation.mutate({
      ...formData,
      venue_ids: selectedVenues.map(v => v.id)
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Back Button */}
        <Link to={createPageUrl("Cups")}>
          <Button variant="ghost" className="text-[#B6C2BC] hover:text-[#F4F7F5] gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Button>
        </Link>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
            <CardHeader className="border-b border-[#223029] bg-gradient-to-r from-[#F4743B]/10 to-[#FF8652]/5 p-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Trophy className="w-7 h-7 text-[#F4743B]" />
                Skapa turnering
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#F4F7F5]">Grundläggande information</h3>
                  
                  <div>
                    <Label className="text-[#F4F7F5]">Turneringsnamn *</Label>
                    <Input
                      placeholder="t.ex. Stockholm Cup 2025"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#F4F7F5]">Beskrivning</Label>
                    <Textarea
                      placeholder="Beskriv turneringen..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-24"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#F4F7F5]">Plats *</Label>
                      <Input
                        placeholder="t.ex. Stockholm"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>

                    <div>
                      <Label className="text-[#F4F7F5]">Åldersgrupp</Label>
                      <Input
                        placeholder="t.ex. 16+, 18-25, Öppen"
                        value={formData.age_group}
                        onChange={(e) => setFormData(prev => ({ ...prev, age_group: e.target.value }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#F4F7F5]">Datum och tid</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#F4F7F5]">Startdatum *</Label>
                      <Input
                        type="date"
                        min={today}
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>

                    <div>
                      <Label className="text-[#F4F7F5]">Slutdatum</Label>
                      <Input
                        type="date"
                        min={formData.start_date || today}
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#F4F7F5]">Starttid</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>

                    <div>
                      <Label className="text-[#F4F7F5]">Sista anmälningsdag</Label>
                      <Input
                        type="date"
                        min={today}
                        max={formData.start_date}
                        value={formData.registration_deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Tournament Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#F4F7F5]">Inställningar</h3>
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-[#F4F7F5]">Format *</Label>
                      <Select value={formData.format} onValueChange={(v) => setFormData(prev => ({ ...prev, format: v }))}>
                        <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5v5">5v5</SelectItem>
                          <SelectItem value="7v7">7v7</SelectItem>
                          <SelectItem value="11v11">11v11</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[#F4F7F5]">Anmälningstyp *</Label>
                      <Select value={formData.signup_type} onValueChange={(v) => setFormData(prev => ({ ...prev, signup_type: v }))}>
                        <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="team">Lag</SelectItem>
                          <SelectItem value="solo">Solo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[#F4F7F5]">Nivå</Label>
                      <Select value={formData.skill_level} onValueChange={(v) => setFormData(prev => ({ ...prev, skill_level: v }))}>
                        <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mixed">Blandad</SelectItem>
                          <SelectItem value="beginner">Nybörjare</SelectItem>
                          <SelectItem value="intermediate">Medel</SelectItem>
                          <SelectItem value="advanced">Avancerad</SelectItem>
                          <SelectItem value="elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-[#F4F7F5]">Max deltagare *</Label>
                      <Input
                        type="number"
                        min="4"
                        max="64"
                        step="4"
                        value={formData.max_participants}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>

                    <div>
                      <Label className="text-[#F4F7F5]">Antal grupper</Label>
                      <Input
                        type="number"
                        min="2"
                        max="8"
                        value={formData.number_of_groups}
                        onChange={(e) => setFormData(prev => ({ ...prev, number_of_groups: parseInt(e.target.value) }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                        disabled={!formData.has_group_stage}
                      />
                    </div>

                    <div>
                      <Label className="text-[#F4F7F5]">Anmälningsavgift (kr)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.entry_fee}
                        onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: parseFloat(e.target.value) }))}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Tournament Structure */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#F4F7F5]">Turneringsstruktur</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                      <div>
                        <Label className="text-[#F4F7F5] font-semibold">Gruppspel</Label>
                        <p className="text-xs text-[#B6C2BC]">Lag spelar mot varandra i grupper</p>
                      </div>
                      <Switch
                        checked={formData.has_group_stage}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_group_stage: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                      <div>
                        <Label className="text-[#F4F7F5] font-semibold">Slutspel</Label>
                        <p className="text-xs text-[#B6C2BC]">Bracket med kvarter, semi och final</p>
                      </div>
                      <Switch
                        checked={formData.has_playoffs}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_playoffs: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                      <div>
                        <Label className="text-[#F4F7F5] font-semibold">MVP-röstning</Label>
                        <p className="text-xs text-[#B6C2BC]">Spelare kan rösta på MVP</p>
                      </div>
                      <Switch
                        checked={formData.enable_mvp_voting}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_mvp_voting: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                      <div>
                        <Label className="text-[#F4F7F5] font-semibold">Offentlig</Label>
                        <p className="text-xs text-[#B6C2BC]">Synlig för alla användare</p>
                      </div>
                      <Switch
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Rules and Prize */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#F4F7F5]">Regler</Label>
                    <Textarea
                      placeholder="Beskriv reglerna för turneringen..."
                      value={formData.rules}
                      onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-32"
                    />
                  </div>

                  <div>
                    <Label className="text-[#F4F7F5]">Priser</Label>
                    <Textarea
                      placeholder="Beskriv priser och utmärkelser..."
                      value={formData.prize}
                      onChange={(e) => setFormData(prev => ({ ...prev, prize: e.target.value }))}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-24"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Cups"))}
                    className="flex-1 border-[#223029] text-[#B6C2BC]"
                  >
                    Avbryt
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={createCupMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-[#F4743B] to-[#FF8652] hover:from-[#E5683A] hover:to-[#F4743B] text-white font-bold"
                  >
                    {createCupMutation.isPending ? 'Skapar...' : 'Skapa turnering'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
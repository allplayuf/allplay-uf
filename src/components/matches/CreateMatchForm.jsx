
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar, MapPin, Users, Trophy, Target, X, Info, Zap, Timer } from "lucide-react";
import { motion } from 'framer-motion'; // Import motion for animations
import { DateTimePicker } from "@/components/ui/date-time-picker";

export default function CreateMatchForm({ venues, user, onSubmit, onCancel, preselectedVenueId }) {
  const [formData, setFormData] = useState({
    title: '',
    venue_id: preselectedVenueId || '',
    date: '',
    time: '',
    format: '5v5',
    max_players: 16,
    is_spontaneous: false,
    is_team_match: false,
    skill_bracket: 'mixed',
    is_ranked: false,
    is_open: true,
    is_private: false,
    notes: '',
    organizer_id: user.id,
    current_players: 1,
    status: 'upcoming'
  });
  const [venueSearch, setVenueSearch] = useState('');
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.city.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.address.toLowerCase().includes(venueSearch.toLowerCase())
  );

  const selectedVenue = venues.find(v => v.id === formData.venue_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.venue_id || !formData.date || !formData.time) {
      alert("Fyll i alla obligatoriska fält!");
      return;
    }

    if (!formData.skill_bracket) {
      alert("Välj en matchnivå!");
      return;
    }

    const submitData = {
      ...formData,
      max_players: formData.is_spontaneous ? null : formData.max_players,
      is_team_match: false, // Ensure this is explicitly set if the UI doesn't allow changing it
      is_ranked: false // Ensure this is explicitly set if the UI doesn't allow changing it
    };

    onSubmit(submitData);
  };

  const formatMaxPlayers = {
    '5v5': 16,
    '7v7': 20,
    '11v11': 32
  };

  const handleFormatChange = (format) => {
    setFormData(prev => ({
      ...prev,
      format,
      max_players: formData.is_spontaneous ? null : formatMaxPlayers[format]
    }));
  };

  const skillBracketLabels = {
    beginner: 'Nybörjare',
    intermediate: 'Medel',
    advanced: 'Avancerad',
    elite: 'Elite',
    mixed: 'Blandad nivå'
  };

  const handleVenueSelect = (venue) => {
    setFormData(prev => ({ ...prev, venue_id: venue.id }));
    setVenueSearch('');
    setShowVenueDropdown(false);
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Card className="bg-[#121715] border-0 shadow-none rounded-t-[20px] lg:rounded-[20px] flex flex-col h-full overflow-hidden">
        <CardHeader className="border-b border-[#223029] bg-gradient-to-br from-[#2BA84A]/10 to-[#0F2917]/10 rounded-t-[20px] lg:rounded-t-[16px] p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#F4F7F5] flex items-center gap-2 sm:gap-3">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#2BA84A]" />
              <span>Skapa ny match</span>
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

            {/* Plan Search */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Välj plan *</Label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Sök efter plan eller område..."
                  value={selectedVenue ? `${selectedVenue.name} - ${selectedVenue.city}` : venueSearch}
                  onChange={(e) => {
                    setVenueSearch(e.target.value);
                    setShowVenueDropdown(true);
                    if (selectedVenue && e.target.value !== `${selectedVenue.name} - ${selectedVenue.city}`) {
                      setFormData(prev => ({ ...prev, venue_id: '' }));
                    }
                  }}
                  onFocus={() => setShowVenueDropdown(true)}
                  onBlur={() => setTimeout(() => setShowVenueDropdown(false), 100)}
                  className="w-full h-11 sm:h-12 px-4 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 rounded-[14px] text-sm sm:text-base outline-none transition-all"
                />

                {showVenueDropdown && (venueSearch || !selectedVenue) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#121715] border border-[#223029] rounded-[14px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] max-h-64 overflow-y-auto z-50">
                    {filteredVenues.length > 0 ? (
                      filteredVenues.slice(0, 5).map(venue => (
                        <button
                          key={venue.id}
                          type="button"
                          onClick={() => handleVenueSelect(venue)}
                          className="w-full px-4 py-3 text-left hover:bg-[#18221E] transition-colors border-b border-[#223029] last:border-b-0"
                        >
                          <div className="font-semibold text-[#F4F7F5] text-sm mb-1">{venue.name}</div>
                          <div className="text-[13px] leading-[18px] text-[#B6C2BC] flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {venue.address}, {venue.city}
                          </div>
                          {venue.formats_supported && venue.formats_supported.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {venue.formats_supported.map(format => (
                                <span key={format} className="inline-flex h-5 items-center rounded-full bg-[#2BA84A]/18 px-2 text-[11px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                                  {format}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-[13px] leading-[18px] text-[#7B8A83]">
                        Inga planer hittades
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] leading-[16px] text-[#7B8A83]">
                Sök efter planens namn, stad eller adress
              </p>
            </div>

            {/* Match Type Selection - ADJUSTED ICON POSITIONING */}
            <div className="p-3 sm:p-4 bg-[#18221E] rounded-[14px] border border-[#223029]">
              <Label className="text-[#F4F7F5] font-semibold text-base sm:text-lg mb-3 block">Matchtyp</Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_spontaneous: false, max_players: formatMaxPlayers[prev.format] }))}
                  className={`h-20 sm:h-24 flex-col gap-2 rounded-[12px] text-sm sm:text-base ${
                    !formData.is_spontaneous
                      ? 'bg-gradient-to-r from-[#2BA84A] to-[#248232] text-[#FFFFFF] border border-[#2BA84A] shadow-lg shadow-[#2BA84A]/30'
                      : 'bg-[#121715] text-[#B6C2BC] border border-[#223029] hover:border-[#2BA84A] hover:text-[#F4F7F5]'
                  }`}
                >
                  <Timer className="w-5 h-5 sm:w-6 sm:h-6 mt-2" />
                  <div className="text-center">
                    <div className="font-bold text-sm sm:text-base">Standard</div>
                    <div className="text-[10px] sm:text-xs font-normal">Fast antal</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_spontaneous: true, max_players: null }))}
                  className={`h-20 sm:h-24 flex-col gap-2 rounded-[12px] text-sm sm:text-base ${
                    formData.is_spontaneous
                      ? 'bg-gradient-to-r from-[#F4743B] to-[#E5683A] text-[#FFFFFF] border border-[#F4743B] shadow-lg shadow-[#F4743B]/30'
                      : 'bg-[#121715] text-[#B6C2BC] border border-[#223029] hover:border-[#F4743B] hover:text-[#F4F7F5]'
                  }`}
                >
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 mt-2" />
                  <div className="text-center">
                    <div className="font-bold text-sm sm:text-base">Spontan</div>
                    <div className="text-[10px] sm:text-xs font-normal">Obegränsat</div>
                  </div>
                </Button>
              </div>
              <div className="mt-3 p-2 sm:p-3 bg-[#2BA84A]/10 rounded-lg border border-[#2BA84A]/30">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#2BA84A] mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] sm:text-xs text-[#CFE8D6]">
                    {formData.is_spontaneous
                      ? 'Spontana matcher har obegränsat antal spelare. Perfekt för casual spel!'
                      : 'Standard matcher har fast antal spelare och resultat rapporteras.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Matchnamn *</Label>
              <Input
                placeholder="t.ex. Kvällsmatch på Östermalm"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#7B8A83] text-sm sm:text-base h-11 sm:h-12 rounded-[14px]"
              />
            </div>

            {/* Date and Time - NEW COMPONENT */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4 text-[#2BA84A]" />
                Datum och tid *
              </Label>
              <DateTimePicker
                date={formData.date}
                time={formData.time}
                onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
                onTimeChange={(time) => setFormData(prev => ({ ...prev, time }))}
                minDate={today}
              />
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4 text-[#2BA84A]" />
                Matchformat *
              </Label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {['5v5', '7v7', '11v11'].map(format => (
                  <Button
                    key={format}
                    type="button"
                    onClick={() => handleFormatChange(format)}
                    className={`h-14 sm:h-16 font-bold text-sm sm:text-base lg:text-lg transition-all rounded-[12px] ${
                      formData.format === format
                        ? 'bg-gradient-to-r from-[#2BA84A] to-[#248232] text-[#FFFFFF] border border-[#2BA84A] shadow-lg shadow-[#2BA84A]/30'
                        : 'bg-[#121715] text-[#B6C2BC] border border-[#223029] hover:border-[#2BA84A] hover:text-[#F4F7F5]'
                    }`}
                  >
                    {format}
                    {!formData.is_spontaneous && (
                      <div className="text-[10px] sm:text-xs font-normal mt-1">
                        ({formatMaxPlayers[format]} spelare)
                      </div>
                    )}
                  </Button>
                ))}
              </div>
              {!formData.is_spontaneous && (
                <p className="text-[11px] leading-[16px] text-[#7B8A83]">
                  Inkluderar avbytare
                </p>
              )}
            </div>

            {/* Skill Bracket */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Target className="w-4 h-4 text-[#2BA84A]" />
                Matchnivå *
              </Label>
              <div className="flex items-start gap-2 p-2 sm:p-3 bg-[#2BA84A]/10 rounded-lg border border-[#2BA84A]/30 mb-3">
                <Info className="w-4 h-4 text-[#2BA84A] mt-0.5 flex-shrink-0" />
                <p className="text-[11px] sm:text-xs lg:text-sm text-[#CFE8D6]">
                  Nivån styr vem som ser matchen som mest relevant. "Blandad nivå" välkomnar alla spelare.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {Object.entries(skillBracketLabels).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, skill_bracket: value }))}
                    className={`h-12 sm:h-14 font-bold text-[11px] sm:text-xs lg:text-sm transition-all rounded-[12px] ${
                      formData.skill_bracket === value
                        ? 'bg-gradient-to-r from-[#F4743B] to-[#E5683A] text-[#FFFFFF] border border-[#F4743B] shadow-lg shadow-[#F4743B]/30'
                        : 'bg-[#121715] text-[#B6C2BC] border border-[#223029] hover:border-[#F4743B] hover:text-[#F4F7F5]'
                    }`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Options */}
            {!formData.is_spontaneous && (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-[#18221E] rounded-[14px] border border-[#223029]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Privat match</Label>
                    <p className="text-[11px] sm:text-xs lg:text-sm text-[#B6C2BC]">Endast inbjudna kan gå med</p>
                  </div>
                  <Switch
                    checked={formData.is_private}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private: checked }))}
                    className="data-[state=checked]:bg-[#2BA84A]"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Anteckningar (valfritt)</Label>
              <Textarea
                placeholder="Extra information om matchen..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#7B8A83] h-20 text-sm sm:text-base rounded-[14px]"
              />
            </div>

            {/* Actions - STARK CTA */}
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
                    '0 4px 16px rgba(244, 116, 59, 0.3)',
                    '0 4px 20px rgba(244, 116, 59, 0.5)',
                    '0 4px 16px rgba(244, 116, 59, 0.3)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 6px 24px rgba(244, 116, 59, 0.6)'
                }}
                whileTap={{ 
                  scale: 0.98,
                  boxShadow: '0 2px 12px rgba(244, 116, 59, 0.4)'
                }}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#F4743B] to-[#FF8652] text-white font-bold text-[13px] tracking-wide uppercase ring-2 ring-[#F4743B]/30 transition-all relative overflow-hidden min-h-[44px]"
              >
                <span className="relative z-10">Skapa match</span>
                <Trophy className="w-4 h-4 relative z-10" />
                
                {/* Subtle shine effect */}
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

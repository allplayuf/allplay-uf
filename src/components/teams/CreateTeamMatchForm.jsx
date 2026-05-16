import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, Trophy, X, Info, Shield, Swords } from "lucide-react";
import { Venue } from "@/entities/Venue";
import { Team } from "@/entities/Team";
import { feedback } from "@/components/ui/feedback-toast";

export default function CreateTeamMatchForm({ currentTeam, onSubmit, onCancel }) {
  const [venues, setVenues] = useState([]);
  const [otherTeams, setOtherTeams] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    venue_id: '',
    date: '',
    time: '',
    format: '5v5',
    team_b_id: '',
    notes: ''
  });
  const [venueSearch, setVenueSearch] = useState('');
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [venuesData, teamsData] = await Promise.all([
        Venue.list(),
        Team.list()
      ]);
      
      setVenues(venuesData);
      const otherTeamsFiltered = teamsData.filter(t => t.id !== currentTeam.id);
      setOtherTeams(otherTeamsFiltered);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.city.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.address.toLowerCase().includes(venueSearch.toLowerCase())
  );

  const selectedVenue = venues.find(v => v.id === formData.venue_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.venue_id || !formData.date || !formData.time || !formData.team_b_id) {
      feedback.error("Fyll i alla obligatoriska fält.");
      return;
    }

    const formatMaxPlayers = {
      '5v5': 16,
      '7v7': 20,
      '11v11': 32
    };

    const submitData = {
      title: formData.title,
      venue_id: formData.venue_id,
      organizer_id: currentTeam.captain_id,
      date: formData.date,
      time: formData.time,
      duration_minutes: 90,
      format: formData.format,
      max_players: formatMaxPlayers[formData.format],
      current_players: 0,
      is_spontaneous: false,
      is_team_match: true,
      is_ranked: true,
      status: 'upcoming',
      is_private: false,
      is_open: true,
      team_a_id: currentTeam.id,
      team_b_id: formData.team_b_id,
      notes: formData.notes
    };

    onSubmit(submitData);
  };

  const handleVenueSelect = (venue) => {
    setFormData(prev => ({ ...prev, venue_id: venue.id }));
    setVenueSearch('');
    setShowVenueDropdown(false);
  };

  return (
    <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
      <CardHeader className="border-b border-[#223029] bg-gradient-to-br from-[#9B59B6]/10 to-[#4A0E29]/10 rounded-t-[16px]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-[#F4F7F5] flex items-center gap-3">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-[#9B59B6]" />
            Skapa rankad lagmatch
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] rounded-xl min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="p-3 bg-[#9B59B6]/10 rounded-lg border border-[#9B59B6]/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#9B59B6] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#DDA5E8]">
              Rankade matcher påverkar ditt lags ELO-rating. Endast lagkaptener kan acceptera utmaningar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Match Title */}
          <div className="space-y-2">
            <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Matchnamn *</Label>
            <Input
              placeholder="t.ex. Derby mellan lokalrivaler"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 placeholder:text-[#7B8A83] text-sm sm:text-base h-12 rounded-[14px]"
            />
          </div>

          {/* Opponent Team */}
          <div className="space-y-2">
            <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Swords className="w-4 h-4 text-[#9B59B6]" />
              Motståndare *
            </Label>
            <Select value={formData.team_b_id} onValueChange={(value) => setFormData(prev => ({ ...prev, team_b_id: value }))}>
              <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] h-12">
                <SelectValue placeholder="Välj motståndare" />
              </SelectTrigger>
              <SelectContent>
                {otherTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} - {team.city} (ELO: {team.elo_rating})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Venue Search */}
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
                className="w-full h-12 px-4 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 rounded-[14px] text-sm sm:text-base outline-none transition-all"
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
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4 text-[#9B59B6]" />
                Datum *
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 text-sm sm:text-base h-12 rounded-[14px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Tid *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 text-sm sm:text-base h-12 rounded-[14px]"
              />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-[#F4F7F5] font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Users className="w-4 h-4 text-[#9B59B6]" />
              Matchformat *
            </Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {['5v5', '7v7', '11v11'].map(format => (
                <Button
                  key={format}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, format }))}
                  className={`h-14 sm:h-16 font-bold text-base sm:text-lg transition-all rounded-[12px] ${
                    formData.format === format
                      ? 'bg-gradient-to-r from-[#9B59B6] to-[#7C3AED] text-[#FFFFFF] border border-[#9B59B6] shadow-lg shadow-[#9B59B6]/30'
                      : 'bg-[#121715] text-[#B6C2BC] border border-[#223029] hover:border-[#9B59B6] hover:text-[#F4F7F5]'
                  }`}
                >
                  {format}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-[#F4F7F5] font-semibold text-sm sm:text-base">Anteckningar (valfritt)</Label>
            <Textarea
              placeholder="Extra information om matchen..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#9B59B6] focus:ring-1 focus:ring-[#9B59B6]/30 placeholder:text-[#7B8A83] h-20 sm:h-24 text-sm sm:text-base rounded-[14px]"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] font-semibold transition-all min-h-[44px]"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#9B59B6]/16 px-6 text-[#DDA5E8] ring-1 ring-[#9B59B6]/30 transition-all hover:bg-[#9B59B6]/24 hover:ring-[#9B59B6]/45 hover:scale-[1.02] font-semibold min-h-[44px]"
            >
              <Shield className="w-5 h-5" />
              Skapa rankad match
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
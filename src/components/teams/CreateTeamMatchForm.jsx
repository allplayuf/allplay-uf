import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, X, Info, Swords, Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import feedback from "@/components/ui/feedback-toast";
import { getVenues, createTeamMatch } from "@/components/supabase/services";

export default function CreateTeamMatchForm({ currentTeam, onSuccess, onCancel }) {
  const [form, setForm] = useState({ title: '', venue_id: '', venue_external_id: '', date: '', time: '', format: '5v5', notes: '' });
  const [venueSearch, setVenueSearch] = useState('');
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: venues = [] } = useQuery({
    queryKey: ['venues-list'],
    queryFn: getVenues,
    staleTime: 300_000,
  });

  const selectedVenue = venues.find(v => v.id === form.venue_id);

  const filteredVenues = venues.filter(v => {
    if (selectedVenue) return false;
    const q = venueSearch.toLowerCase();
    return v.name?.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q) || v.address?.toLowerCase().includes(q);
  });

  const handleVenueSelect = (venue) => {
    setForm(f => ({ ...f, venue_id: venue.id, venue_external_id: venue.external_id || '' }));
    setVenueSearch('');
    setShowVenueDropdown(false);
  };

  const handleVenueInputChange = (e) => {
    setVenueSearch(e.target.value);
    setShowVenueDropdown(true);
    if (selectedVenue) {
      setForm(f => ({ ...f, venue_id: '', venue_external_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.venue_id) { feedback.error('Välj en plan'); return; }
    if (!form.date || !form.time) { feedback.error('Datum och tid krävs'); return; }

    setIsSubmitting(true);
    try {
      await createTeamMatch({
        team: currentTeam,
        venueId: form.venue_id,
        venueExternalId: form.venue_external_id,
        title: form.title || `${currentTeam.name} söker motståndare`,
        date: form.date,
        time: form.time,
        format: form.format,
        notes: form.notes,
      });
      feedback.success('Lagmatch skapad!', { description: 'Matchen syns nu i matchflödet.' });
      onSuccess?.();
    } catch (err) {
      feedback.error(err.message || 'Kunde inte skapa match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#223029] px-5 py-4 bg-gradient-to-r from-[#2BA84A]/8 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[18px] font-bold text-[#F4F7F5] flex items-center gap-2.5">
            <Swords className="w-5 h-5 text-[#2BA84A]" />
            Skapa lagmatch
          </CardTitle>
          <button onClick={onCancel} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#18221E] text-[#9EAAA4] hover:text-[#F4F7F5] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
        {/* Info banner */}
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-[#2BA84A]/8 border border-[#2BA84A]/25 rounded-xl">
          <Info className="w-4 h-4 text-[#2BA84A] mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-[#CFE8D6] leading-relaxed">
            Matchen visas i matchflödet. Endast lagkaptener och vice-kaptener kan ansluta sitt lag som motståndare.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Titel (valfritt)</Label>
            <Input
              placeholder={`${currentTeam.name} söker motståndare`}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] rounded-xl focus:border-[#2BA84A]/60"
            />
          </div>

          {/* Venue */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Plan *
            </Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Sök planer..."
                  value={selectedVenue ? `${selectedVenue.name} — ${selectedVenue.city}` : venueSearch}
                  onChange={handleVenueInputChange}
                  onFocus={() => setShowVenueDropdown(true)}
                  onBlur={() => setTimeout(() => setShowVenueDropdown(false), 150)}
                  className="w-full h-11 pl-9 pr-4 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] rounded-xl focus:border-[#2BA84A]/60 outline-none text-sm transition-colors"
                />
                {selectedVenue && (
                  <button type="button" onClick={() => { setForm(f => ({ ...f, venue_id: '', venue_external_id: '' })); setVenueSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8A83] hover:text-[#F4F7F5]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showVenueDropdown && !selectedVenue && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#121715] border border-[#223029] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] max-h-52 overflow-y-auto z-50">
                  {filteredVenues.length > 0 ? filteredVenues.slice(0, 8).map(v => (
                    <button key={v.id} type="button" onMouseDown={() => handleVenueSelect(v)}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#18221E] transition-colors border-b border-[#223029]/50 last:border-0">
                      <div className="text-[13px] font-semibold text-[#F4F7F5]">{v.name}</div>
                      <div className="text-[11px] text-[#9EAAA4] mt-0.5">{v.address}, {v.city}</div>
                    </button>
                  )) : (
                    <div className="px-4 py-5 text-center text-[13px] text-[#7B8A83]">Inga planer hittades</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Datum *
              </Label>
              <Input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl focus:border-[#2BA84A]/60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Tid *</Label>
              <Input type="time" value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl focus:border-[#2BA84A]/60" />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Format
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {['5v5', '7v7', '11v11'].map(fmt => (
                <button key={fmt} type="button" onClick={() => setForm(f => ({ ...f, format: fmt }))}
                  className={`h-11 rounded-xl font-bold text-sm transition-all ${
                    form.format === fmt
                      ? 'bg-[#2BA84A] text-white shadow-lg shadow-[#2BA84A]/30'
                      : 'bg-[#18221E] border border-[#223029] text-[#B6C2BC] hover:border-[#2BA84A]/40'
                  }`}
                >{fmt}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Anteckningar</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Extra information om matchen..."
              className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] rounded-xl h-20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onCancel}
              className="flex-1 h-11 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E]">
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className="flex-1 h-11 bg-[#2BA84A] hover:bg-[#248232] text-white font-semibold shadow-lg shadow-[#2BA84A]/25">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><Swords className="w-4 h-4 mr-1.5" /> Skapa match</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

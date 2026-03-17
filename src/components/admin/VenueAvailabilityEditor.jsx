import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock, X, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7); // Monday
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export default function VenueAvailabilityEditor({ venue, onClose }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '08:00',
    end_time: '22:00',
    slot_type: 'available',
    booked_by: '',
    notes: ''
  });
  const queryClient = useQueryClient();
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['venue-availability', venue.id, weekOffset],
    queryFn: async () => {
      const startDate = formatDate(weekDates[0]);
      const endDate = formatDate(weekDates[6]);
      return base44.entities.VenueAvailability.filter(
        { venue_id: venue.id, date: { $gte: startDate, $lte: endDate } },
        'date',
        100
      );
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VenueAvailability.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-availability', venue.id] });
      setShowAddForm(false);
      setNewSlot({ date: '', start_time: '08:00', end_time: '22:00', slot_type: 'available', booked_by: '', notes: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VenueAvailability.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venue-availability', venue.id] }),
  });

  const handleCreate = () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) return;
    createMutation.mutate({
      venue_id: venue.id,
      ...newSlot,
    });
  };

  const slotsByDate = useMemo(() => {
    const map = {};
    weekDates.forEach(d => { map[formatDate(d)] = []; });
    slots.forEach(s => {
      if (map[s.date]) map[s.date].push(s);
    });
    // Sort each day's slots by time
    Object.values(map).forEach(arr => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return map;
  }, [slots, weekDates]);

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} – ${weekDates[6].getDate()}/${weekDates[6].getMonth() + 1}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <Card className="bg-[#121715] border-2 border-[#2BA84A]/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#223029]">
          <div>
            <h3 className="text-lg font-bold text-[#F4F7F5]">Tillgänglighetsschema</h3>
            <p className="text-sm text-[#9EAAA4]">{venue.name}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-[#18221E] hover:bg-[#223029] flex items-center justify-center text-[#B6C2BC]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => setWeekOffset(w => w - 1)} className="w-9 h-9 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center text-[#B6C2BC]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#2BA84A]" />
              <span className="text-sm font-semibold text-[#F4F7F5]">{weekLabel}</span>
            </div>
            <button onClick={() => setWeekOffset(w => w + 1)} className="w-9 h-9 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center text-[#B6C2BC]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#2BA84A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {weekDates.map((date, i) => {
                const dateStr = formatDate(date);
                const daySlots = slotsByDate[dateStr] || [];
                const isToday = formatDate(new Date()) === dateStr;

                return (
                  <div key={dateStr} className={`rounded-xl border p-3 ${isToday ? 'border-[#2BA84A]/40 bg-[#2BA84A]/5' : 'border-[#223029] bg-[#18221E]/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${isToday ? 'text-[#2BA84A]' : 'text-[#F4F7F5]'}`}>
                        {DAYS[(date.getDay())]} {date.getDate()}/{date.getMonth() + 1}
                      </span>
                      <button
                        onClick={() => {
                          setNewSlot(s => ({ ...s, date: dateStr }));
                          setShowAddForm(true);
                        }}
                        className="text-[10px] font-semibold text-[#2BA84A] hover:text-[#86EFAC] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Lägg till
                      </button>
                    </div>

                    {daySlots.length === 0 ? (
                      <p className="text-xs text-[#7B8A83]">Inget schema</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {daySlots.map(slot => (
                          <div
                            key={slot.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              slot.slot_type === 'available'
                                ? 'bg-[#2BA84A]/15 text-[#86EFAC] border border-[#2BA84A]/25'
                                : 'bg-[#DC2626]/15 text-[#FCA5A5] border border-[#DC2626]/25'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {slot.start_time}–{slot.end_time}
                            {slot.slot_type === 'booked' && slot.booked_by && (
                              <span className="text-[10px] opacity-70">({slot.booked_by})</span>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(slot.id)}
                              className="ml-0.5 hover:text-white"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add slot form */}
          {showAddForm && (
            <Card className="bg-[#18221E] border-2 border-[#2BA84A] rounded-xl">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#F4F7F5]">Nytt tidsblock</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#9EAAA4] text-xs mb-1 block">Datum</Label>
                    <Input
                      type="date"
                      value={newSlot.date}
                      onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))}
                      className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[#9EAAA4] text-xs mb-1 block">Typ</Label>
                    <Select value={newSlot.slot_type} onValueChange={v => setNewSlot(s => ({ ...s, slot_type: v }))}>
                      <SelectTrigger className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121715] border-[#223029]">
                        <SelectItem value="available" className="text-[#86EFAC]">Tillgänglig</SelectItem>
                        <SelectItem value="booked" className="text-[#FCA5A5]">Bokad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#9EAAA4] text-xs mb-1 block">Starttid</Label>
                    <Input
                      type="time"
                      value={newSlot.start_time}
                      onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))}
                      className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[#9EAAA4] text-xs mb-1 block">Sluttid</Label>
                    <Input
                      type="time"
                      value={newSlot.end_time}
                      onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))}
                      className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                    />
                  </div>
                </div>
                {newSlot.slot_type === 'booked' && (
                  <div>
                    <Label className="text-[#9EAAA4] text-xs mb-1 block">Bokad av</Label>
                    <Input
                      placeholder="t.ex. Djurgårdens IF"
                      value={newSlot.booked_by}
                      onChange={e => setNewSlot(s => ({ ...s, booked_by: e.target.value }))}
                      className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="border-[#223029] text-[#B6C2BC]">Avbryt</Button>
                  <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending} className="bg-[#2BA84A] hover:bg-[#248232] text-white">
                    {createMutation.isPending ? 'Sparar...' : 'Spara'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-[#223029] flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#2BA84A]/30 border border-[#2BA84A]/50" />
            <span className="text-xs text-[#9EAAA4]">Tillgänglig</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#DC2626]/30 border border-[#DC2626]/50" />
            <span className="text-xs text-[#9EAAA4]">Bokad</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
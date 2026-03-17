import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock, X, CalendarDays, ChevronLeft, ChevronRight, Copy, AlertCircle } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 to 23:00

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
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

function SlotBlock({ slot, onDelete, isDeleting }) {
  const startHour = parseInt(slot.start_time.split(':')[0]);
  const startMin = parseInt(slot.start_time.split(':')[1] || 0);
  const endHour = parseInt(slot.end_time.split(':')[0]);
  const endMin = parseInt(slot.end_time.split(':')[1] || 0);
  
  const topPercent = ((startHour - 7) * 60 + startMin) / (16 * 60) * 100;
  const heightPercent = ((endHour - startHour) * 60 + (endMin - startMin)) / (16 * 60) * 100;
  
  const isAvailable = slot.slot_type === 'available';
  
  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 text-[9px] leading-tight font-medium cursor-pointer group border transition-all ${
        isAvailable 
          ? 'bg-[#2BA84A]/20 border-[#2BA84A]/40 text-[#86EFAC] hover:bg-[#2BA84A]/30' 
          : 'bg-[#DC2626]/20 border-[#DC2626]/40 text-[#FCA5A5] hover:bg-[#DC2626]/30'
      }`}
      style={{ top: `${topPercent}%`, height: `${Math.max(heightPercent, 3)}%` }}
      title={`${slot.start_time}–${slot.end_time}${slot.booked_by ? ` (${slot.booked_by})` : ''}`}
    >
      <div className="flex items-start justify-between">
        <span className="truncate">{slot.start_time}–{slot.end_time}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(slot.id); }}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-white flex-shrink-0"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
      {slot.booked_by && <span className="truncate block opacity-70">{slot.booked_by}</span>}
    </div>
  );
}

export default function VenueAvailabilityEditor({ venue, onClose }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '08:00',
    end_time: '10:00',
    slot_type: 'booked',
    booked_by: '',
    notes: ''
  });
  const [copyWeekLoading, setCopyWeekLoading] = useState(false);
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
        200
      );
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VenueAvailability.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-availability', venue.id] });
      setShowAddForm(false);
      setNewSlot(s => ({ ...s, start_time: '08:00', end_time: '10:00', booked_by: '', notes: '' }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VenueAvailability.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venue-availability', venue.id] }),
  });

  const handleCreate = () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) return;
    if (newSlot.start_time >= newSlot.end_time) {
      window.alert('Starttid måste vara före sluttid');
      return;
    }
    createMutation.mutate({
      venue_id: venue.id,
      ...newSlot,
    });
  };

  const handleCopyToNextWeek = async () => {
    if (slots.length === 0) return;
    setCopyWeekLoading(true);
    const nextWeekDates = getWeekDates(weekOffset + 1);
    
    const newSlots = slots.map(slot => {
      const slotDate = new Date(slot.date);
      const dayOfWeek = slotDate.getDay();
      // Map to next week's same day
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday-based index
      const targetDate = formatDate(nextWeekDates[adjustedDay]);
      return {
        venue_id: venue.id,
        date: targetDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_type: slot.slot_type,
        booked_by: slot.booked_by || '',
        notes: slot.notes || '',
      };
    });

    await base44.entities.VenueAvailability.bulkCreate(newSlots);
    queryClient.invalidateQueries({ queryKey: ['venue-availability', venue.id] });
    setCopyWeekLoading(false);
  };

  const slotsByDate = useMemo(() => {
    const map = {};
    weekDates.forEach(d => { map[formatDate(d)] = []; });
    slots.forEach(s => {
      if (map[s.date]) map[s.date].push(s);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return map;
  }, [slots, weekDates]);

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} – ${weekDates[6].getDate()}/${weekDates[6].getMonth() + 1}`;
  const todayStr = formatDate(new Date());

  // Stats
  const bookedCount = slots.filter(s => s.slot_type === 'booked').length;
  const availableCount = slots.filter(s => s.slot_type === 'available').length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <Card className="bg-[#121715] border-2 border-[#2BA84A]/40 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#223029]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#F4F7F5]">Bokningsschema</h3>
              <Badge className="text-[10px] bg-[#2BA84A]/20 text-[#2BA84A] border border-[#2BA84A]/30">AllPlay</Badge>
            </div>
            <p className="text-sm text-[#9EAAA4]">{venue.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyToNextWeek}
              disabled={copyWeekLoading || slots.length === 0}
              className="h-8 text-xs border-[#223029] text-[#B6C2BC] hover:text-[#F4F7F5]"
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              {copyWeekLoading ? 'Kopierar...' : 'Kopiera till nästa vecka'}
            </Button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-[#18221E] hover:bg-[#223029] flex items-center justify-center text-[#B6C2BC]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Week navigation + stats */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#223029]">
            <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center text-[#B6C2BC]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#2BA84A]" />
                <span className="text-sm font-semibold text-[#F4F7F5]">{weekLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#FCA5A5]">{bookedCount} bokade</span>
                <span className="text-[#86EFAC]">{availableCount} lediga</span>
              </div>
            </div>
            <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center text-[#B6C2BC]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Schedule Grid */}
          <div className="flex-1 overflow-auto p-2 sm:p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#2BA84A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex gap-1 min-w-[700px]">
                {/* Time labels */}
                <div className="w-10 flex-shrink-0 pt-7">
                  {HOURS.map(hour => (
                    <div key={hour} className="h-10 flex items-start justify-end pr-1">
                      <span className="text-[10px] text-[#7B8A83] font-mono">{hour.toString().padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDates.map((date, i) => {
                  const dateStr = formatDate(date);
                  const isToday = todayStr === dateStr;
                  const daySlots = slotsByDate[dateStr] || [];

                  return (
                    <div key={dateStr} className="flex-1 min-w-[80px]">
                      {/* Day header */}
                      <button
                        onClick={() => {
                          setNewSlot(s => ({ ...s, date: dateStr }));
                          setShowAddForm(true);
                        }}
                        className={`w-full text-center py-1.5 rounded-t-lg text-xs font-bold mb-0.5 transition-colors ${
                          isToday 
                            ? 'bg-[#2BA84A]/20 text-[#2BA84A] border border-[#2BA84A]/30' 
                            : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:border-[#2BA84A]/30 hover:text-[#F4F7F5]'
                        }`}
                      >
                        <div>{DAYS[i]}</div>
                        <div className="text-[10px] font-normal opacity-70">{date.getDate()}/{date.getMonth() + 1}</div>
                      </button>

                      {/* Time grid */}
                      <div className={`relative border rounded-b-lg ${isToday ? 'border-[#2BA84A]/20' : 'border-[#223029]'}`}>
                        {/* Hour lines */}
                        {HOURS.map(hour => (
                          <div key={hour} className="h-10 border-b border-[#223029]/30" />
                        ))}

                        {/* Slot blocks */}
                        {daySlots.map(slot => (
                          <SlotBlock 
                            key={slot.id} 
                            slot={slot} 
                            onDelete={(id) => deleteMutation.mutate(id)}
                            isDeleting={deleteMutation.isPending}
                          />
                        ))}

                        {/* Click to add overlay */}
                        {daySlots.length === 0 && (
                          <button
                            onClick={() => {
                              setNewSlot(s => ({ ...s, date: dateStr }));
                              setShowAddForm(true);
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-[#2BA84A]/5"
                          >
                            <Plus className="w-4 h-4 text-[#2BA84A]/50" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add slot form */}
          {showAddForm && (
            <div className="border-t border-[#223029] p-4 bg-[#18221E]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#F4F7F5]">Lägg till tidsblock</h4>
                <button onClick={() => setShowAddForm(false)} className="text-[#9EAAA4] hover:text-[#F4F7F5]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-36">
                  <Label className="text-[#9EAAA4] text-xs mb-1 block">Datum</Label>
                  <Input
                    type="date"
                    value={newSlot.date}
                    onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))}
                    className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-[#9EAAA4] text-xs mb-1 block">Från</Label>
                  <Input
                    type="time"
                    value={newSlot.start_time}
                    onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))}
                    className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-[#9EAAA4] text-xs mb-1 block">Till</Label>
                  <Input
                    type="time"
                    value={newSlot.end_time}
                    onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))}
                    className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-[#9EAAA4] text-xs mb-1 block">Typ</Label>
                  <Select value={newSlot.slot_type} onValueChange={v => setNewSlot(s => ({ ...s, slot_type: v }))}>
                    <SelectTrigger className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121715] border-[#223029]">
                      <SelectItem value="booked" className="text-[#FCA5A5]">Bokad/Upptagen</SelectItem>
                      <SelectItem value="available" className="text-[#86EFAC]">Ledig för AllPlay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newSlot.slot_type === 'booked' && (
                  <div className="w-40">
                    <Label className="text-[#9EAAA4] text-xs mb-1 block">Bokad av</Label>
                    <Input
                      placeholder="t.ex. Djurgårdens IF"
                      value={newSlot.booked_by}
                      onChange={e => setNewSlot(s => ({ ...s, booked_by: e.target.value }))}
                      className="bg-[#121715] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)} className="h-9 border-[#223029] text-[#B6C2BC]">
                    Avbryt
                  </Button>
                  <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending} className="h-9 bg-[#2BA84A] hover:bg-[#248232] text-white">
                    {createMutation.isPending ? 'Sparar...' : 'Lägg till'}
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-[#9EAAA4]">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>"Bokad/Upptagen" = planen är redan bokad av annan. "Ledig för AllPlay" = öppen tid som AllPlay-spelare kan boka.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer legend */}
        <div className="p-3 border-t border-[#223029] flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#DC2626]/30 border border-[#DC2626]/50" />
            <span className="text-xs text-[#9EAAA4]">Bokad/Upptagen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#2BA84A]/30 border border-[#2BA84A]/50" />
            <span className="text-xs text-[#9EAAA4]">Ledig för AllPlay</span>
          </div>
          <span className="text-[10px] text-[#7B8A83] ml-auto">Klicka på en dag för att lägga till tid</span>
        </div>
      </Card>
    </div>
  );
}
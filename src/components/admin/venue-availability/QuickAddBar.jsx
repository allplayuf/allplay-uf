import React from 'react';
import { Button } from "@/components/ui/button";
import { Zap, Moon, Sun, Coffee } from "lucide-react";

/**
 * Quick-add presets for common "booked" time slots — 1 tap to block common hours
 * on the currently selected day.
 */
const PRESETS = [
  { id: 'morning', label: 'Morgon', sub: '07–09', icon: Coffee, color: '#F59E0B', start: '07:00', end: '09:00' },
  { id: 'day', label: 'Dag', sub: '09–17', icon: Sun, color: '#F4743B', start: '09:00', end: '17:00' },
  { id: 'evening', label: 'Kväll', sub: '17–22', icon: Moon, color: '#9370DB', start: '17:00', end: '22:00' },
  { id: 'fullday', label: 'Hela dagen', sub: '07–23', icon: Zap, color: '#DC2626', start: '07:00', end: '23:00' },
];

export default function QuickAddBar({ selectedDate, onQuickAdd, disabled }) {
  if (!selectedDate) return null;
  return (
    <div className="px-4 sm:px-5 py-3 border-b border-[#223029] bg-[#0F1513]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-[#9EAAA4] uppercase tracking-wider font-semibold">
          Snabbmarkera som upptaget
        </span>
        <span className="text-[11px] text-[#7B8A83]">{selectedDate}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {PRESETS.map(p => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              disabled={disabled}
              onClick={() => onQuickAdd({ start_time: p.start, end_time: p.end, slot_type: 'booked' })}
              className="p-2 rounded-lg border flex flex-col items-center gap-0.5 transition-colors disabled:opacity-50"
              style={{
                background: `${p.color}15`,
                borderColor: `${p.color}40`,
                color: p.color,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold leading-tight">{p.label}</span>
              <span className="text-[9px] opacity-70 tabular-nums leading-tight">{p.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
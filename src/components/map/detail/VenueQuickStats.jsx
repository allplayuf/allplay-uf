import React from 'react';
import { Calendar, LayoutGrid, Sparkles } from 'lucide-react';

export default function VenueQuickStats({ upcomingCount, pitchCount, pitchLabel, facilityCount }) {
  const stats = [
    { icon: Calendar, value: upcomingCount, label: 'Matcher', color: '#2BA84A', bg: '#2BA84A22' },
    { icon: LayoutGrid, value: pitchCount, label: pitchLabel, color: '#C4B5FD', bg: '#9370DB22' },
    { icon: Sparkles, value: facilityCount, label: 'Faciliteter', color: '#FDBA74', bg: '#F4743B22' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s, i) => (
        <div
          key={i}
          className="p-3 bg-[#18221E] rounded-2xl border border-[#223029] flex flex-col items-center justify-center"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center mb-1.5"
            style={{ background: s.bg }}
          >
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
          </div>
          <div className="text-lg font-black text-[#F4F7F5] tabular-nums leading-none">{s.value}</div>
          <div className="text-[10px] font-semibold text-[#9EAAA4] uppercase tracking-wider mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
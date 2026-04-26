import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Users, Clock, Calendar } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { sv } from 'date-fns/locale';

const FORMAT_COLORS = {
  '5v5': { bg: '#2BA84A22', text: '#86EFAC', ring: '#2BA84A40' },
  '7v7': { bg: '#F4743B22', text: '#FDBA74', ring: '#F4743B40' },
  '11v11': { bg: '#9370DB22', text: '#C4B5FD', ring: '#9370DB40' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Idag';
    if (isTomorrow(d)) return 'Imorgon';
    return format(d, 'd MMM', { locale: sv });
  } catch {
    return dateStr;
  }
}

export default function VenueMatchRow({ match, onClose }) {
  const fmtColor = FORMAT_COLORS[match.format] || FORMAT_COLORS['5v5'];
  const current = match.current_players || 0;
  const max = match.max_players || 0;
  const progressPct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isFull = max > 0 && current >= max;

  return (
    <Link
      to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
      onClick={onClose}
      className="block p-3 bg-[#18221E] rounded-2xl border border-[#223029] hover:border-[#2BA84A]/40 hover:bg-[#1E2724] transition-all group active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {/* Date pill */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#0F1513] border border-[#223029] flex flex-col items-center justify-center">
          <Calendar className="w-3 h-3 text-[#9EAAA4] mb-0.5" />
          <span className="text-[10px] font-bold text-[#F4F7F5] leading-none tabular-nums">
            {formatDate(match.date)}
          </span>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-flex h-[18px] items-center px-1.5 rounded-md text-[10px] font-black uppercase tracking-wider"
              style={{ background: fmtColor.bg, color: fmtColor.text, boxShadow: `inset 0 0 0 1px ${fmtColor.ring}` }}
            >
              {match.format}
            </span>
            <div className="flex items-center gap-0.5 text-[11px] text-[#9EAAA4] tabular-nums">
              <Clock className="w-3 h-3" />
              {match.time}
            </div>
            {isFull && (
              <span className="inline-flex h-[18px] items-center px-1.5 rounded-md text-[10px] font-black bg-[#DC2626]/20 text-[#FCA5A5] ring-1 ring-[#DC2626]/40">
                FULLT
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-[#F4F7F5] truncate leading-tight">
            {match.title}
          </p>

          {/* Progress bar */}
          {!match.is_spontaneous && max > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-[#0F1513] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPct}%`,
                    background: isFull
                      ? '#DC2626'
                      : progressPct >= 75
                      ? '#F4743B'
                      : '#2BA84A',
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#9EAAA4] tabular-nums flex-shrink-0">
                <Users className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                {current}/{max}
              </span>
            </div>
          )}
          {match.is_spontaneous && (
            <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-[#86EFAC]">
              <Users className="w-3 h-3" />
              {current} anmälda · Spontant
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-[#7B8A83] group-hover:text-[#2BA84A] flex-shrink-0 transition-colors" />
      </div>
    </Link>
  );
}
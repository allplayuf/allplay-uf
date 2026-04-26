import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronRight, MapPin } from 'lucide-react';
import { getSubPitches } from '@/components/supabase/services/subPitchesService';

/**
 * Lists sub-pitches for a parent venue. Returns one of:
 *  - "no parent" (nothing to show, returns null)
 *  - loading state
 *  - empty (no sub-pitches found — returns null so parent itself can be used)
 *  - list of sub-pitches as selectable cards (calls onSelect with sub venue)
 *
 * Designed to be used inline inside CreateMatchForm or VenueDetailModal.
 */
export default function SubPitchPicker({ parentVenueId, selectedSubId, onSelect, formatFilter, compact = false }) {
  const { data: subPitches = [], isLoading } = useQuery({
    queryKey: ['sub-pitches', parentVenueId],
    queryFn: () => getSubPitches(parentVenueId),
    enabled: !!parentVenueId,
    staleTime: 60_000,
  });

  if (!parentVenueId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3 text-[#9EAAA4] text-xs gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Laddar planer...
      </div>
    );
  }

  if (!subPitches || subPitches.length === 0) return null;

  // Optional format filter (e.g. only show 5v5 if user selected 5v5)
  const visible = formatFilter
    ? subPitches.filter(s => !s.formats_supported || s.formats_supported.length === 0 || s.formats_supported.includes(formatFilter))
    : subPitches;

  if (visible.length === 0) {
    return (
      <div className="text-xs text-[#9EAAA4] py-2 px-3 rounded-lg bg-[#18221E] border border-[#223029]">
        Inga underplaner stöder {formatFilter}. Välj annat format eller använd huvudplan.
      </div>
    );
  }

  return (
    <div className={`space-y-${compact ? '1.5' : '2'}`}>
      {visible.map(sub => {
        const isSelected = selectedSubId === sub.id;
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub)}
            className={`w-full flex items-center justify-between gap-2 ${compact ? 'p-2.5' : 'p-3'} rounded-[12px] border transition-all text-left ${
              isSelected
                ? 'bg-[#2BA84A]/15 border-[#2BA84A]/50 ring-1 ring-[#2BA84A]/30'
                : 'bg-[#18221E] border-[#223029] hover:border-[#2BA84A]/35 hover:bg-[#1E2724]'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className={`${compact ? 'text-[12px]' : 'text-[13px]'} font-bold ${isSelected ? 'text-[#86EFAC]' : 'text-[#F4F7F5]'} truncate`}>
                {sub.name.replace(/^.+?–\s*/, '')}
              </div>
              {sub.formats_supported?.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {sub.formats_supported.map(f => (
                    <span key={f} className="inline-flex h-[18px] items-center rounded-md px-1.5 text-[10px] font-bold bg-[#0F1513] text-[#B6C2BC] ring-1 ring-[#223029]">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#2BA84A]' : 'text-[#7B8A83]'}`} />
          </button>
        );
      })}
    </div>
  );
}
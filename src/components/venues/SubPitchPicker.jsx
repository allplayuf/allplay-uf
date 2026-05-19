import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Check } from 'lucide-react';
import { getSubPitches } from '@/components/supabase/services/subPitchesService';

/**
 * Lists sub-pitches for a parent venue and lets the user pick one.
 * Returns null when there are no sub-pitches so the parent venue can be used directly.
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
      <div className="flex items-center gap-2 py-3 text-[#9EAAA4] text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Laddar underplaner...
      </div>
    );
  }

  if (!subPitches || subPitches.length === 0) return null;

  // Filter by format — pitches with no formats_supported accept any format
  const visible = formatFilter
    ? subPitches.filter(s => !s.formats_supported?.length || s.formats_supported.includes(formatFilter))
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
        // Strip leading "ParentName – " prefix so only the pitch label shows
        const label = sub.name.replace(/^.+?[–-]\s*/, '');
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub)}
            className={`w-full flex items-center gap-3 ${compact ? 'p-2.5' : 'p-3'} rounded-[12px] border transition-all text-left ${
              isSelected
                ? 'bg-[#2BA84A]/12 border-[#2BA84A]/50 ring-1 ring-[#2BA84A]/25'
                : 'bg-[#18221E] border-[#223029] hover:border-[#2BA84A]/30 hover:bg-[#1A2520]'
            }`}
          >
            {/* Icon */}
            <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-[#2BA84A]/20' : 'bg-[#0F1513] ring-1 ring-[#223029]'
            }`}>
              {isSelected
                ? <Check className="w-3.5 h-3.5 text-[#2BA84A]" strokeWidth={2.5} />
                : <MapPin className="w-3 h-3 text-[#7B8A83]" />
              }
            </div>

            {/* Label + formats */}
            <div className="flex-1 min-w-0">
              <div className={`${compact ? 'text-[12px]' : 'text-[13px]'} font-bold truncate ${
                isSelected ? 'text-[#86EFAC]' : 'text-[#F4F7F5]'
              }`}>
                {label}
              </div>
              {sub.formats_supported?.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {sub.formats_supported.map(f => (
                    <span
                      key={f}
                      className={`inline-flex h-[18px] items-center rounded-md px-1.5 text-[10px] font-bold ring-1 ${
                        f === formatFilter
                          ? 'bg-[#2BA84A]/15 text-[#86EFAC] ring-[#2BA84A]/30'
                          : 'bg-[#0F1513] text-[#B6C2BC] ring-[#223029]'
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <span className="text-[10px] font-bold text-[#2BA84A] flex-shrink-0">Vald</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

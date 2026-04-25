import React, { useMemo } from 'react';
import { MapPin, Calendar, Users, ArrowRight, CheckCircle2, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getUsersByIds } from "@/components/supabase/services";
import AvatarImage from "@/components/ui/avatar-image";

/**
 * Premium venue card with rich match preview.
 * Uses pre-loaded `allParticipants` for accurate player counts (no per-card fetching).
 */
export default function VenueCard({ venue, matches = [], isSelected, onClick, onMatchClick, userMatchIds = [], allParticipants = [] }) {
  const hasUserMatch = matches.some(m => userMatchIds.includes(m.id));
  const hasMatches = matches.length > 0;
  const topMatch = matches[0];

  // Count participants for the top match using pre-loaded data — O(n), no fetch
  const topMatchParticipants = useMemo(() => {
    if (!topMatch) return [];
    return allParticipants.filter(p => p.match_id === topMatch.id);
  }, [topMatch, allParticipants]);

  // Fetch user details for the first few avatars (shared cache via React Query)
  const topUserIds = topMatchParticipants.slice(0, 4).map(p => p.user_id).filter(Boolean);
  const { data: topUsers = [] } = useQuery({
    queryKey: ['venueCardUsers', ...topUserIds.sort()],
    queryFn: () => getUsersByIds(topUserIds),
    enabled: topUserIds.length > 0,
    staleTime: 60_000,
  });

  // Status config
  const status = useMemo(() => {
    if (hasUserMatch) return {
      label: 'Du spelar här',
      icon: CheckCircle2,
      bg: 'bg-[#4169E1]/14', ring: 'ring-[#4169E1]/30', text: 'text-[#B0C4DE]',
    };
    if (hasMatches) return {
      label: `${matches.length} aktiv${matches.length === 1 ? '' : 'a'}`,
      icon: Flame,
      bg: 'bg-[#F4743B]/14', ring: 'ring-[#F4743B]/30', text: 'text-[#FDE3D2]',
    };
    return {
      label: 'Tillgänglig',
      icon: null,
      bg: 'bg-[#2BA84A]/12', ring: 'ring-[#2BA84A]/25', text: 'text-[#CFE8D6]',
    };
  }, [hasMatches, hasUserMatch, matches.length]);

  const StatusIcon = status.icon;

  const topMatchFull = topMatch && !topMatch.is_spontaneous
    && topMatchParticipants.length >= (topMatch.max_players || 0);

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`group cursor-pointer rounded-[18px] border overflow-hidden transition-all ${
        isSelected
          ? 'bg-[#151B18] border-[#2BA84A]/60 ring-1 ring-[#2BA84A]/20 shadow-[0_12px_30px_rgba(43,168,74,0.15)]'
          : 'bg-[#121715] border-[#223029] hover:border-[#2BA84A]/35 hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="text-[15px] font-bold text-white truncate tracking-tight">{venue.name}</h4>
              {venue.is_allplay && (
                <span className="flex-shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-md bg-[#2BA84A]/18 ring-1 ring-[#2BA84A]/35 text-[9px] font-black uppercase tracking-wider text-[#86EFAC]">
                  ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-[#9EAAA4]">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{venue.city}</span>
              {typeof venue.distance === 'number' && venue.distance !== Infinity && (
                <>
                  <span className="text-[#4a5550]">·</span>
                  <span className="tabular-nums font-medium text-[#B6C2BC]">{venue.distance.toFixed(1)} km</span>
                </>
              )}
            </div>
          </div>

          {/* Status pill */}
          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ${status.bg} ${status.ring} ${status.text}`}
          >
            {StatusIcon && <StatusIcon className="w-3 h-3" strokeWidth={2.5} />}
            {status.label}
          </span>
        </div>

        {/* Formats */}
        {venue.formats_supported?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {venue.formats_supported.map(format => (
              <span key={format} className="inline-flex items-center h-[22px] rounded-md px-1.5 text-[10px] font-bold bg-[#18221E] border border-[#223029] text-[#B6C2BC]">
                {format}
              </span>
            ))}
          </div>
        )}

        {/* Match preview OR "available" state */}
        {topMatch ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onMatchClick?.(topMatch.id);
            }}
            className="rounded-[14px] bg-[#18221E] border border-[#223029] hover:border-[#2BA84A]/35 p-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate leading-tight">{topMatch.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#9EAAA4]">
                  <Calendar className="w-3 h-3" />
                  <span className="tabular-nums">{topMatch.date} · {topMatch.time}</span>
                </div>
              </div>
              <div className={`flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-bold tabular-nums flex-shrink-0 ${
                topMatchFull
                  ? 'bg-[#F4743B]/15 text-[#FDE3D2] ring-1 ring-[#F4743B]/30'
                  : 'bg-[#121715] text-[#F4F7F5] ring-1 ring-[#223029]'
              }`}>
                <Users className="w-3 h-3" />
                {topMatch.is_spontaneous
                  ? `${topMatchParticipants.length}`
                  : `${topMatchParticipants.length}/${topMatch.max_players}`}
              </div>
            </div>

            {/* Progress */}
            {!topMatch.is_spontaneous && topMatch.max_players > 0 && (
              <div className="h-1 bg-[#121715] rounded-full overflow-hidden border border-[#223029]/50 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (topMatchParticipants.length / topMatch.max_players) * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    topMatchParticipants.length / topMatch.max_players >= 0.9 ? 'bg-[#F4743B]' : 'bg-[#2BA84A]'
                  }`}
                />
              </div>
            )}

            {/* Avatars + more count */}
            <div className="flex items-center justify-between">
              {topMatchParticipants.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {topUsers.slice(0, 4).map((user, i) => (
                      <div key={user?.id || i} className="ring-[1.5px] ring-[#18221E] rounded-full">
                        <AvatarImage
                          src={user?.avatar_url}
                          name={user?.display_name || user?.full_name || 'S'}
                          className="w-6 h-6"
                          textClassName="text-[9px]"
                        />
                      </div>
                    ))}
                  </div>
                  {topMatchParticipants.length > 4 && (
                    <span className="text-[10px] font-semibold text-[#9EAAA4]">
                      +{topMatchParticipants.length - 4}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-[#8FA097] font-medium">Var först att anmäla dig</span>
              )}

              {matches.length > 1 && (
                <span className="text-[10px] font-bold text-[#F4743B] bg-[#F4743B]/10 ring-1 ring-[#F4743B]/25 rounded-md px-1.5 h-[18px] inline-flex items-center">
                  +{matches.length - 1} till
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-[14px] bg-[#18221E]/50 border border-[#223029]/60 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2BA84A] animate-pulse" />
              <span className="text-[12px] text-[#B6C2BC] font-medium">Inga matcher · Skapa en</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#7B8A83] group-hover:text-[#2BA84A] group-hover:translate-x-0.5 transition-all" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
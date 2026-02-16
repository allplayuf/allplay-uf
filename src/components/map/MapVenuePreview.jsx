import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ChevronRight, Plus, Zap, X, Navigation, UserPlus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MapVenuePreview({ venue, matches = [], allParticipants = [], userMatchIds = [], onClose, onShowDetails, onMatchClick }) {
  if (!venue) return null;

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const ongoingMatch = matches.find(m => m.status === 'ongoing');
  const totalMatches = upcomingMatches.length + (ongoingMatch ? 1 : 0);
  const nextMatch = ongoingMatch || upcomingMatches[0];

  const nextMatchParticipantCount = nextMatch
    ? (allParticipants.filter(p => p.match_id === nextMatch.id).length)
    : 0;

  const isJoined = nextMatch ? userMatchIds.includes(nextMatch.id) : false;
  const isFull = nextMatch && !nextMatch.is_spontaneous && nextMatch.max_players && nextMatchParticipantCount >= nextMatch.max_players;
  const spotsLeft = nextMatch && !nextMatch.is_spontaneous ? (nextMatch.max_players - nextMatchParticipantCount) : null;

  const formatDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Idag';
    if (dateStr === tomorrow) return 'Imorgon';
    return new Date(dateStr).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="absolute bottom-4 left-3 right-3 z-[1000] flex justify-center pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="w-full max-w-md pointer-events-auto"
      >
        <div className="relative bg-[#121715] border border-[#223029] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden">

          {/* Top accent line */}
          <div className={`h-[3px] w-full ${
            ongoingMatch ? 'bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent' :
            totalMatches > 0 ? 'bg-gradient-to-r from-transparent via-[#F4743B] to-transparent' :
            'bg-gradient-to-r from-transparent via-[#2BA84A] to-transparent'
          }`} />

          <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 mr-8">
                <h3 className="text-[15px] font-bold text-white leading-tight mb-1 line-clamp-1">
                  {venue.name}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-[#7B8A83]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#2BA84A]" />
                    {venue.city}
                  </span>
                  {venue.distance && (
                    <span className="flex items-center gap-1 text-[#2BA84A] font-semibold">
                      <Navigation className="w-3 h-3" />
                      {venue.distance < 1 ? `${Math.round(venue.distance * 1000)}m` : `${venue.distance.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              {ongoingMatch ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/25 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                  <Zap className="w-3 h-3 fill-current" />
                  Live
                </span>
              ) : totalMatches > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4743B]/12 border border-[#F4743B]/25 text-[#F4743B] text-[10px] font-bold flex-shrink-0">
                  {totalMatches} {totalMatches === 1 ? 'match' : 'matcher'}
                </span>
              ) : null}
            </div>

            {/* Next Match Preview */}
            {nextMatch ? (
              <div
                onClick={() => onMatchClick(nextMatch.id)}
                className="mb-3 p-3 rounded-xl bg-[#18221E] border border-[#223029] hover:border-[#2BA84A]/30 transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#2BA84A] uppercase tracking-wider">
                      {ongoingMatch ? 'Pågår nu' : 'Nästa match'}
                    </span>
                    <span className="inline-flex h-4 items-center rounded px-1.5 bg-[#223029] text-[9px] font-bold text-[#B6C2BC]">
                      {nextMatch.format}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7B8A83] font-medium">
                    {formatDate(nextMatch.date)} · {nextMatch.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F7F5] group-hover:text-[#2BA84A] transition-colors line-clamp-1 flex-1 mr-2">
                    {nextMatch.title}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 text-[11px] text-[#B6C2BC]">
                      <Users className="w-3 h-3" />
                      {nextMatch.is_spontaneous
                        ? `${nextMatchParticipantCount}`
                        : `${nextMatchParticipantCount}/${nextMatch.max_players}`
                      }
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#7B8A83] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Spots indicator */}
                {!nextMatch.is_spontaneous && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[#0F1513] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? 'bg-[#DC2626]' : spotsLeft <= 2 ? 'bg-[#F59E0B]' : 'bg-[#2BA84A]'}`}
                        style={{ width: `${Math.min(100, (nextMatchParticipantCount / (nextMatch.max_players || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${isFull ? 'text-[#FCA5A5]' : spotsLeft <= 2 ? 'text-[#FCD34D]' : 'text-[#86EFAC]'}`}>
                      {isFull ? 'Full' : `${spotsLeft} kvar`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-3 p-3 rounded-xl bg-[#18221E]/60 border border-[#223029]/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2BA84A]/10 flex items-center justify-center flex-shrink-0 ring-1 ring-[#2BA84A]/20">
                  <MapPin className="w-4 h-4 text-[#2BA84A]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#F4F7F5]">Ingen planerad match</p>
                  <p className="text-[11px] text-[#7B8A83]">Bli först att spela här!</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onShowDetails(venue)}
                className="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[#18221E] hover:bg-[#223029] border border-[#223029] text-[#F4F7F5] text-xs font-bold transition-all active:scale-[0.97]"
              >
                <Eye className="w-3.5 h-3.5 text-[#9EAAA4]" />
                Visa alla
              </button>

              {isJoined ? (
                <button
                  onClick={() => nextMatch && onMatchClick(nextMatch.id)}
                  className="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[#4169E1] hover:bg-[#3558C0] text-white text-xs font-bold transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(65,105,225,0.25)]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  Visa match
                </button>
              ) : isFull ? (
                <Link
                  to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                  className="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[#2BA84A] hover:bg-[#248232] text-white text-xs font-bold transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(43,168,74,0.25)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ny match
                </Link>
              ) : nextMatch ? (
                <button
                  onClick={() => onMatchClick(nextMatch.id)}
                  className="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[#F4743B] hover:bg-[#E5683A] text-white text-xs font-bold transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(244,116,59,0.25)]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Gå med
                </button>
              ) : (
                <Link
                  to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                  className="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[#2BA84A] hover:bg-[#248232] text-white text-xs font-bold transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(43,168,74,0.25)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Skapa match
                </Link>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[#18221E] border border-[#223029] text-[#9EAAA4] hover:text-white hover:bg-[#223029] transition-all active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
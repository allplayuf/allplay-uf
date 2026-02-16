import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, ChevronRight, Plus, Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MapVenuePreview({ venue, matches = [], allParticipants = [], userMatchIds = [], onClose, onShowDetails, onMatchClick }) {
  if (!venue) return null;

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const ongoingMatch = matches.find(m => m.status === 'ongoing');
  const hasUserMatch = matches.some(m => userMatchIds.includes(m.id));
  const nextMatch = upcomingMatches[0];
  const totalMatches = upcomingMatches.length + (ongoingMatch ? 1 : 0);
  
  const nextMatchParticipantCount = nextMatch 
    ? (allParticipants.filter(p => p.match_id === nextMatch.id).length)
    : 0;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-center pointer-events-none" style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-md pointer-events-auto"
      >
        <div className="relative bg-[#121715]/80 backdrop-blur-2xl border border-[#2BA84A]/20 rounded-[20px] shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_24px_rgba(43,168,74,0.08)] overflow-hidden">
          
          {/* Subtle green glow at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#2BA84A]/60 to-transparent" />

          <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 mr-3">
                <h3 className="text-base font-bold text-white leading-tight mb-1 line-clamp-1">
                  {venue.name}
                </h3>
                <div className="flex items-center gap-2 text-[#7B8A83] text-xs">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#2BA84A]" />
                    {venue.city}
                  </span>

                </div>
              </div>
              
              {/* Status Badge */}
              {ongoingMatch ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/25 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider">
                  <Zap className="w-3 h-3 fill-current" />
                  Spelas nu
                </span>
              ) : totalMatches > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#2BA84A]/15 border border-[#2BA84A]/25 text-[#86EFAC] text-[10px] font-bold uppercase tracking-wider">
                  ⚽ {totalMatches} {totalMatches === 1 ? 'match' : 'matcher'}
                </span>
              ) : null}
            </div>

            {/* Next Match Preview */}
            {nextMatch ? (
              <div 
                onClick={() => onMatchClick(nextMatch.id)}
                className="mb-3 p-3 rounded-xl bg-[#18221E]/60 border border-[#223029]/60 hover:border-[#2BA84A]/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#2BA84A] uppercase tracking-wider">Nästa match</span>
                  <span className="text-[10px] text-[#7B8A83]">{nextMatch.date} • {nextMatch.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F7F5] group-hover:text-[#2BA84A] transition-colors line-clamp-1">
                    {nextMatch.title}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-[#B6C2BC]">
                      {nextMatch.is_spontaneous 
                        ? `${nextMatchParticipantCount} anmälda`
                        : `${nextMatchParticipantCount}/${nextMatch.max_players}`
                      }
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#7B8A83] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 p-3 rounded-xl bg-[#18221E]/40 border border-[#223029]/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2BA84A]/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#2BA84A]" />
                </div>
                <div>
                  <p className="text-xs text-[#7B8A83]">Inga matcher</p>
                  <p className="text-xs font-semibold text-[#F4F7F5]">Bli först att spela här!</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onShowDetails(venue)}
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#18221E]/80 hover:bg-[#223029] border border-[#223029]/60 text-[#F4F7F5] text-xs font-bold transition-all active:scale-[0.97]"
              >
                Visa matcher
              </button>
              
              <Link
                to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#2BA84A] hover:bg-[#248232] text-white text-xs font-bold transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(43,168,74,0.3)]"
              >
                <Plus className="w-3.5 h-3.5" />
                Skapa match
              </Link>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
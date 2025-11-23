import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Calendar, Users, Navigation, ChevronRight, Plus, Trophy, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MapVenuePreview({ venue, matches = [], userMatchIds = [], onClose, onShowDetails, onMatchClick }) {
  if (!venue) return null;

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const ongoingMatch = matches.find(m => m.status === 'ongoing');
  const hasUserMatch = matches.some(m => userMatchIds.includes(m.id));
  const nextMatch = upcomingMatches[0];

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-center pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md pointer-events-auto"
      >
        {/* Main Card */}
        <div className="bg-[#121715]/95 backdrop-blur-xl border border-[#223029] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          
          {/* Decorative Top Gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#2BA84A] via-[#4169E1] to-[#F4743B]" />

          <div className="p-5">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-4">
                <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-1">
                  {venue.name}
                </h3>
                <div className="flex items-center gap-2 text-[#B6C2BC] text-xs font-medium">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#2BA84A]" />
                    {venue.city}
                  </span>
                  {venue.rating && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[#223029]" />
                      <span className="flex items-center gap-1 text-[#F4F7F5]">
                        <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                        {venue.rating}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex flex-col items-end gap-1.5">
                {ongoingMatch ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <Zap className="w-3 h-3 fill-current" />
                    Live
                  </span>
                ) : hasUserMatch ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4169E1]/20 border border-[#4169E1]/30 text-[#B0C4DE] text-[10px] font-bold uppercase tracking-wider">
                    <Users className="w-3 h-3" />
                    Du spelar
                  </span>
                ) : upcomingMatches.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2BA84A]/20 border border-[#2BA84A]/30 text-[#CFE8D6] text-[10px] font-bold uppercase tracking-wider">
                    <Trophy className="w-3 h-3" />
                    {upcomingMatches.length} Matcher
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18221E] border border-[#223029] text-[#7B8A83] text-[10px] font-bold uppercase tracking-wider">
                    Ledig
                  </span>
                )}
              </div>
            </div>

            {/* Next Match Preview or Quick Stats */}
            {nextMatch ? (
              <div 
                onClick={() => onMatchClick(nextMatch.id)}
                className="mb-4 p-3 rounded-xl bg-[#18221E]/50 border border-[#223029] hover:border-[#2BA84A]/30 hover:bg-[#18221E] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#2BA84A] uppercase tracking-wider">Nästa match</span>
                  <span className="text-[10px] text-[#7B8A83] font-medium">{nextMatch.date} • {nextMatch.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F7F5] group-hover:text-[#2BA84A] transition-colors">
                    {nextMatch.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#B6C2BC]">
                      {nextMatch.current_players || 0}/{nextMatch.max_players}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#7B8A83] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-[#18221E]/50 border border-[#223029] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2BA84A]/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[#2BA84A]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#B6C2BC]">Inga matcher inbokade</p>
                    <p className="text-xs font-semibold text-[#F4F7F5]">Bli först med att spela här!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onShowDetails(venue)}
                className="h-10 flex items-center justify-center gap-2 rounded-xl bg-[#18221E] hover:bg-[#223029] border border-[#223029] text-[#F4F7F5] text-xs font-bold transition-all active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                Mer info
              </button>
              
              <Link
                to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                className="h-10 flex items-center justify-center gap-2 rounded-xl bg-[#F4743B] hover:bg-[#E5683A] text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-[#F4743B]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Skapa match
              </Link>
            </div>
          </div>

          {/* Close Handle (Mobile visual cue) */}
          <div 
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[#000000]/20 text-white/50 hover:text-white hover:bg-[#000000]/40 cursor-pointer transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Users, ArrowRight, Navigation, UserPlus, Check, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { triggerHaptic } from "@/components/utils/motionTokens";
import AvatarImage from "@/components/ui/avatar-image";

export default function NearbyMatchesWidget({ 
  matches = [], 
  allParticipants = [], 
  userMatchIds = [],
  userId,
  onJoin,
  isGuest 
}) {
  if (matches.length === 0) return null;

  const formatDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Idag';
    if (dateStr === tomorrow) return 'Imorgon';
    return new Date(dateStr).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* Section Header — aligned with Dashboard token scale */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#F4743B]/20 to-[#F4743B]/10 rounded-xl flex items-center justify-center ring-1 ring-[#F4743B]/20">
            <Navigation className="w-5 h-5 text-[#F4743B]" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F4F7F5]">Matcher nära dig</h3>
            <p className="text-[11px] text-[#9EAAA4]">{matches.length} inom 15 km</p>
          </div>
        </div>
        <Link 
          to={createPageUrl("Map")} 
          className="text-xs font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors"
        >
          Se karta
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Match List — 12px gap */}
      <div className="space-y-3">
        {matches.slice(0, 5).map((match, index) => {
          const venue = match.venue;
          const matchParticipants = (allParticipants || []).filter(p => p.match_id === match.id);
          const currentPlayersCount = matchParticipants.length;
          const isJoined = userMatchIds.includes(match.id) || match.organizer_id === userId;
          const isFull = !match.is_spontaneous && match.max_players && currentPlayersCount >= match.max_players;
          const spotsLeft = match.is_spontaneous ? null : (match.max_players - currentPlayersCount);
          const progressPct = match.is_spontaneous ? 0 : (currentPlayersCount / (match.max_players || 1)) * 100;

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.25 }}
            >
              <Card className="bg-[#121715] border border-[#223029] rounded-2xl hover:border-[#2BA84A]/30 transition-all group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Left accent bar */}
                    <div className={`w-1 flex-shrink-0 rounded-l-2xl ${
                      isJoined ? 'bg-[#2BA84A]' : isFull ? 'bg-[#9EAAA4]' : 'bg-[#F4743B]'
                    }`} />

                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between gap-3">
                        {/* Match info */}
                        <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="text-sm font-bold text-[#F4F7F5] truncate group-hover:text-[#2BA84A] transition-colors">
                              {match.title}
                            </h4>
                            <span className="inline-flex h-5 items-center rounded-md bg-[#18221E] px-1.5 text-[10px] font-bold text-[#B6C2BC] border border-[#223029] flex-shrink-0">
                              {match.format}
                            </span>
                            {match.is_spontaneous && (
                              <Zap className="w-3.5 h-3.5 text-[#F4743B] flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Info row */}
                          <div className="flex items-center gap-3 text-[11px] text-[#9EAAA4] mb-2">
                            <span className="flex items-center gap-1 text-[#B6C2BC]">
                              <Clock className="w-3 h-3 text-[#F4743B]" />
                              {formatDate(match.date)} · {match.time}
                            </span>
                            <span className="flex items-center gap-1 text-[#2BA84A] font-semibold">
                              <Navigation className="w-3 h-3" />
                              {match.distance?.toFixed(1)} km
                            </span>
                          </div>

                          {/* Venue + progress */}
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-[#9EAAA4] truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0 text-[#2BA84A]" />
                              {venue?.name || 'Okänd plan'}
                            </span>
                            {!match.is_spontaneous && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-16 h-1.5 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                                  <div 
                                    className={`h-full rounded-full transition-all ${progressPct >= 90 ? 'bg-[#F4743B]' : 'bg-[#2BA84A]'}`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-semibold text-[#B6C2BC]">
                                  {currentPlayersCount}/{match.max_players}
                                </span>
                              </div>
                            )}
                            {match.is_spontaneous && (
                              <span className="text-[10px] font-semibold text-[#F4743B]">
                                {currentPlayersCount} anmälda
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Action button */}
                        <div className="flex-shrink-0 pt-0.5">
                          {isJoined ? (
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2BA84A]/16 ring-1 ring-[#2BA84A]/30">
                              <Check className="w-4 h-4 text-[#2BA84A]" />
                            </div>
                          ) : isFull ? (
                            <div className="inline-flex h-9 items-center rounded-xl bg-[#18221E] px-2.5 text-[10px] font-semibold text-[#9EAAA4] ring-1 ring-[#223029]">
                              Full
                            </div>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                triggerHaptic('success');
                                if (onJoin) onJoin(match.id);
                              }}
                              className="inline-flex h-9 items-center gap-1 rounded-xl bg-[#F4743B] hover:bg-[#E5683A] px-3 text-xs font-bold text-white transition-colors shadow-[0_0_12px_rgba(244,116,59,0.3)]"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Gå med
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick links — pill style */}
      <div className="flex gap-2">
        <Link to={createPageUrl("Matches")} className="flex-1">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-[#18221E] px-4 text-xs font-bold text-[#F4F7F5] border border-[#223029] transition-all hover:border-[#2BA84A]/30 active:bg-[#223029]"
          >
            Utforska matcher
            <ArrowRight className="w-3.5 h-3.5 text-[#9EAAA4]" />
          </motion.button>
        </Link>
        <Link to={createPageUrl("Map")}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2BA84A]/12 ring-1 ring-[#2BA84A]/25 transition-all hover:bg-[#2BA84A]/20 active:ring-[#2BA84A]/40"
          >
            <MapPin className="w-4 h-4 text-[#2BA84A]" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
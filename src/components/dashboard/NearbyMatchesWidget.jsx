import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Users, ArrowRight, Navigation, UserPlus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { triggerHaptic } from "@/components/utils/motionTokens";
import { Badge } from "@/components/ui/badge";

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
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Idag';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Imorgon';
    return date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <Card className="bg-[#121715] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
              <Navigation className="w-4 h-4 text-[#2BA84A]" />
            </div>
            <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">Matcher nära dig</h3>
          </div>
          <Link 
            to={createPageUrl("Map")} 
            className="text-[12px] leading-[18px] font-medium text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors"
          >
            Se karta
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {matches.map((match, index) => {
            const venue = match.venue;
            const currentPlayersCount = allParticipants.filter(p => p.match_id === match.id).length;
            const isJoined = userMatchIds.includes(match.id) || match.organizer_id === userId;
            const isFull = !match.is_spontaneous && match.max_players && currentPlayersCount >= match.max_players;

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
              >
                <div className="bg-[#18221E] rounded-xl border border-[#223029] p-3.5 hover:border-[#2BA84A]/30 transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    {/* Match info */}
                    <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-[#F4F7F5] truncate group-hover:text-[#2BA84A] transition-colors">
                          {match.title}
                        </h4>
                        <span className="inline-flex h-5 items-center rounded-md bg-[#2BA84A]/16 px-2 text-[10px] font-bold text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                          {match.format}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-[#B6C2BC] mb-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{venue?.name || 'Okänd plan'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#2BA84A] font-medium">
                          <Navigation className="w-3 h-3" />
                          {match.distance?.toFixed(1)} km
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#9EAAA4]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(match.date)} · {match.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {match.is_spontaneous 
                            ? `${currentPlayersCount} anmälda` 
                            : `${currentPlayersCount}/${match.max_players}`
                          }
                        </span>
                      </div>
                    </Link>

                    {/* Action button */}
                    <div className="flex-shrink-0 pt-1">
                      {isJoined ? (
                        <div className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#2BA84A]/16 px-3 text-xs font-bold text-[#2BA84A] ring-1 ring-[#2BA84A]/30">
                          <Check className="w-3.5 h-3.5" />
                          Anmäld
                        </div>
                      ) : isFull ? (
                        <div className="inline-flex h-8 items-center rounded-xl bg-[#18221E] px-3 text-xs font-medium text-[#9EAAA4] ring-1 ring-[#223029]">
                          Full
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerHaptic('success');
                            if (onJoin) onJoin(match.id);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#F4743B] hover:bg-[#E5683A] px-3 text-xs font-bold text-white transition-colors shadow-[0_0_12px_rgba(244,116,59,0.3)]"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Gå med
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Link to={createPageUrl("Matches")}>
          <button className="w-full mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#2BA84A]/10 px-4 text-xs font-semibold text-[#2BA84A] ring-1 ring-[#2BA84A]/20 transition-all hover:bg-[#2BA84A]/16 hover:ring-[#2BA84A]/35">
            <MapPin className="w-3.5 h-3.5" />
            Se alla matcher
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}
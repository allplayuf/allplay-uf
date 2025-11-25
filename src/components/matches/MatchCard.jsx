import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Trophy, Target, ChevronRight, Shield, Zap, TrendingUp, Crown, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target },
  intermediate: { label: 'Medel', icon: TrendingUp },
  advanced: { label: 'Avancerad', icon: Shield },
  elite: { label: 'Elite', icon: Crown },
  mixed: { label: 'Blandad nivå', icon: Users }
};

const getSkillBracketLabel = (bracket) => {
  return SKILL_LEVEL_CONFIG[bracket]?.label || bracket;
};

const getSkillBracketIcon = (bracket) => {
  return SKILL_LEVEL_CONFIG[bracket]?.icon || Target;
};

const getSkillBracketColor = (bracket) => {
  const colors = {
    beginner: 'bg-[#10B981]/20 text-[#A7F3D0]',
    intermediate: 'bg-[#14B8A6]/20 text-[#99F6E4]',
    advanced: 'bg-[#8B5CF6]/20 text-[#DDD6FE]',
    elite: 'bg-[#F59E0B]/20 text-[#FDE68A]',
    mixed: 'bg-[#2BA84A]/18 text-[#CFE8D6]'
  };
  return colors[bracket] || 'bg-[#18221E] text-[#CFE8D6]';
};

const getStatusBadge = (status) => {
  const statusConfig = {
    upcoming: { label: 'Kommande', color: 'bg-[#4169E1]/20 text-[#A8C5F5]' },
    ongoing: { label: 'Pågår nu', color: 'bg-[#2BA84A]/20 text-[#CFE8D6] animate-pulse' },
    completed: { label: 'Avslutad', color: 'bg-[#18221E] text-[#7B8A83]' },
    cancelled: { label: 'Inställd', color: 'bg-[#F4743B]/20 text-[#FDE3D2]' }
  };
  return statusConfig[status] || statusConfig.upcoming;
};

export default function MatchCard({ match, venues, user, participants = [], onJoin, onRefresh, index = 0 }) {
  // ALWAYS call hooks first, before any conditional returns
  const [participantUsers, setParticipantUsers] = useState([]);

  useEffect(() => {
    if (participants && participants.length > 0) {
      loadParticipantUsers();
    } else {
      setParticipantUsers([]);
    }
  }, [participants]);

  // NOW we can do null checks after hooks
  if (!match || !user) {
    return null;
  }

  const venue = venues?.find(v => v?.id === match.venue_id);
  const isOrganizer = match.organizer_id === user?.id;
  const hasJoined = participants.some(p => p.user_id === user?.id);
  
  // Calculate actual participant count
  const actualParticipantCount = participants.length;
  const spotsLeft = match.is_spontaneous ? null : (match.max_players - actualParticipantCount);
  const progressPercentage = match.is_spontaneous 
    ? 0 
    : (actualParticipantCount / (match.max_players || 1)) * 100;

  const statusBadge = getStatusBadge(match.status);
  const isJoinable = match.status === 'upcoming' || (match.is_spontaneous && match.status === 'ongoing');
  const SkillIcon = match.skill_bracket ? getSkillBracketIcon(match.skill_bracket) : null;

  const loadParticipantUsers = async () => {
    try {
      const userPromises = participants.slice(0, 5).map(p => {
        if (p?.user_id) {
          return base44.entities.User.get(p.user_id).catch(() => null);
        }
        return Promise.resolve(null);
      });
      const users = await Promise.all(userPromises);
      setParticipantUsers(users.filter(u => u !== null));
    } catch (error) {
      console.error("Error loading participant users:", error);
      setParticipantUsers([]);
    }
  };

  const handleJoinClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onJoin) {
      await onJoin(match.id);
    }
    
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className={`bg-[#121715] border border-[#223029] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(43,168,74,0.2)] hover:border-[#2BA84A]/50 transition-all duration-300 group h-full flex flex-col ${
        match.status === 'completed' ? 'opacity-75' : ''
      }`}>
        <CardContent className="p-4 flex flex-col h-full">
          <div className="space-y-3 flex flex-col h-full">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-white truncate pr-2">
                  {match.title || 'Untitled Match'}
                </h3>
                {isOrganizer && match.status === 'upcoming' && (
                  <Badge variant="outline" className="text-[10px] border-[#F4743B]/30 text-[#FDE3D2] h-5 px-2">
                    Din
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-secondary text-xs sm:text-sm mt-1">
                 <span className="flex items-center gap-1.5 min-w-0 flex-1">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-[#2BA84A]" />
                    <span className="truncate">{venue?.name || 'Okänd'}</span>
                 </span>
                 <span className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock className="w-4 h-4 flex-shrink-0 text-[#F4743B]" />
                    <span>{match.date} • {match.time}</span>
                 </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
                <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium ${statusBadge.color} ring-1 ring-inset ring-white/10`}>
                  {statusBadge.label}
                </span>

                <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium bg-[#18221E] border border-[#223029] text-secondary">
                  {match.format || '5v5'}
                </span>
                
                {match.is_team_match && (
                    <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium bg-[#9B59B6]/20 text-[#DDA5E8] ring-1 ring-[#9B59B6]/30">
                      Lag
                    </span>
                )}
                
                {!match.is_team_match && match.skill_bracket && SkillIcon && (
                  <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium border border-[#223029] ${getSkillBracketColor(match.skill_bracket)}`}>
                    {getSkillBracketLabel(match.skill_bracket)}
                  </span>
                )}
            </div>

            {/* Progress Bar - SYNCED WITH PARTICIPANTS */}
            {!match.is_spontaneous && (
              <div className="space-y-2 mt-auto">
                <div className="flex items-center justify-between text-xs text-secondary">
                  <span>Spelare</span>
                  <span className="text-white font-medium">
                    {actualParticipantCount}/{match.max_players}
                  </span>
                </div>
                <div className="h-1.5 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full transition-all ${
                      progressPercentage >= 90 
                        ? 'bg-[#F4743B]'
                        : 'bg-[#2BA84A]'
                    }`}
                  />
                </div>
                {participantUsers.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex -space-x-2">
                      {participantUsers.slice(0, 5).map((participant, i) => (
                        <div 
                          key={participant?.id || i}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] border border-[#121715] flex items-center justify-center overflow-hidden"
                          title={participant?.full_name || 'User'}
                        >
                          {participant?.profile_image_url ? (
                            <img src={participant.profile_image_url} alt={participant.full_name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-semibold text-white">{participant?.full_name?.[0] || '?'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {actualParticipantCount > 5 && (
                      <span className="text-[10px] leading-[14px] text-[#B6C2BC]">+{actualParticipantCount - 5}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Spontaneous match indicator */}
            {match.is_spontaneous && (
              <div className="mt-auto flex items-center gap-2 text-xs font-medium text-[#F4743B] bg-[#F4743B]/10 p-2 rounded-lg border border-[#F4743B]/20">
                <Zap className="w-3.5 h-3.5" />
                <span>Spontan ({actualParticipantCount} anmälda)</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 mt-auto">
              {match.status === 'completed' ? (
                <div className="flex-1 h-12 flex items-center justify-center border border-[#223029] rounded-xl bg-[#18221E]">
                  <span className="text-sm font-bold text-[#7B8A83]">Avslutad</span>
                </div>
              ) : hasJoined ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      scale: [1, 1.03, 1],
                    }}
                    transition={{ 
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white text-base font-bold uppercase tracking-wide h-12 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(43,168,74,0.4)] hover:shadow-[0_0_25px_rgba(43,168,74,0.6)] border border-[#2BA84A]/50 relative overflow-hidden group/btn cursor-default"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                        repeatDelay: 0.5
                      }}
                    />
                    <span className="relative z-10">Anmäld</span>
                  </motion.button>
                  
                  <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-shrink-0">
                    <button className="h-12 px-5 border-2 border-[#223029] hover:bg-[#18221E] hover:border-[#2BA84A]/50 text-[#F4F7F5] text-sm font-bold rounded-xl transition-all">
                      Info
                    </button>
                  </Link>
                </>
              ) : isJoinable && (!match.is_spontaneous && spotsLeft > 0 || match.is_spontaneous) ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      scale: [1, 1.03, 1],
                    }}
                    transition={{ 
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    onClick={handleJoinClick}
                    className="flex-1 bg-[#F4743B] hover:bg-[#E5683A] text-white text-base font-bold uppercase tracking-wide h-12 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(244,116,59,0.4)] hover:shadow-[0_0_25px_rgba(244,116,59,0.6)] border border-[#F4743B]/50 relative overflow-hidden group/btn"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                        repeatDelay: 0.5
                      }}
                    />
                    <span className="relative z-10">Gå med</span>
                  </motion.button>
                  
                  <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-shrink-0">
                    <button className="h-12 px-5 border-2 border-[#223029] hover:bg-[#18221E] hover:border-[#F4743B]/50 text-[#F4F7F5] text-sm font-bold rounded-xl transition-all">
                      Info
                    </button>
                  </Link>
                </>
              ) : match.status === 'upcoming' && !match.is_spontaneous && spotsLeft === 0 ? (
                <div className="flex-1 h-12 flex items-center justify-center border border-[#223029] rounded-xl bg-[#18221E]">
                  <span className="text-sm font-bold text-[#7B8A83]">Fullbokad</span>
                </div>
              ) : null}

              {(match.status === 'completed' || (match.status === 'upcoming' && (!isJoinable || (spotsLeft !== null && spotsLeft <= 0)))) && (
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-1">
                  <button className="w-full h-12 border-2 border-[#223029] hover:bg-[#18221E] hover:border-[#2BA84A]/50 text-[#F4F7F5] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1">
                    Detaljer
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
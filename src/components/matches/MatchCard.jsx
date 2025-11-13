
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card className={`bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#2BA84A]/30 transition-all rounded-[20px] overflow-hidden group ${
        match.status === 'completed' ? 'opacity-75' : ''
      }`}>
        <CardContent className="p-5 flex flex-col h-full">
          <div className="space-y-4 flex flex-col h-full">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-2">
                  <h3 className="text-[17px] leading-[24px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2BA84A] to-[#CFE8D6] mb-1.5 transition-all">
                    {match.title || 'Untitled Match'}
                  </h3>
                </div>
                {isOrganizer && match.status === 'upcoming' && (
                  <span className="inline-flex h-6 items-center rounded-full bg-[#F4743B]/18 px-2.5 text-[12px] leading-[16px] font-medium text-[#FDE3D2] ring-1 ring-[#F4743B]/25 flex-shrink-0">
                    <Trophy className="w-3 h-3 mr-1" />
                    Din
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] leading-[16px] font-medium ring-1 ${statusBadge.color} ${statusBadge.color.includes('animate-pulse') ? '' : 'ring-[#223029]'}`}>
                  {statusBadge.label}
                </span>

                <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-2.5 text-[12px] leading-[16px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                  {match.format || '5v5'}
                </span>
                
                {match.is_team_match && (
                  <>
                    <span className="inline-flex h-6 items-center rounded-full bg-[#9B59B6]/20 px-2.5 text-[12px] leading-[16px] font-medium text-[#DDA5E8] ring-1 ring-[#9B59B6]/25">
                      <Shield className="w-3 h-3 mr-1" />
                      Lagmatch
                    </span>
                    <span className="inline-flex h-6 items-center rounded-full bg-[#F4743B]/18 px-2.5 text-[12px] leading-[16px] font-medium text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                      <Flame className="w-3 h-3 mr-1" />
                      Rankad
                    </span>
                  </>
                )}
                
                {!match.is_team_match && match.skill_bracket && SkillIcon && (
                  <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] leading-[16px] font-medium ring-1 ring-[#223029] ${getSkillBracketColor(match.skill_bracket)}`}>
                    <SkillIcon className="w-3 h-3 mr-1" />
                    {getSkillBracketLabel(match.skill_bracket)}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-[13px] leading-[18px] text-[#B6C2BC]">
                <MapPin className="w-3.5 h-3.5 text-[#9FC9AC] flex-shrink-0" />
                <span className="truncate">{venue?.name || 'Okänd'}</span>
              </div>

              <div className="flex items-center gap-2 text-[13px] leading-[18px] text-[#B6C2BC]">
                <Clock className="w-3.5 h-3.5 text-[#9FC9AC] flex-shrink-0" />
                <span className="truncate">{match.date} {match.time}</span>
              </div>
            </div>

            {/* Progress Bar - SYNCED WITH PARTICIPANTS */}
            {!match.is_spontaneous && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#B6C2BC] font-medium">Anmälda spelare</span>
                  <span className="text-[#F4F7F5] font-semibold">
                    {actualParticipantCount}/{match.max_players}
                  </span>
                </div>
                <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full transition-all ${
                      progressPercentage >= 90 
                        ? 'bg-gradient-to-r from-[#F4743B] to-[#E5683A]'
                        : progressPercentage >= 60
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#F4743B]'
                        : 'bg-gradient-to-r from-[#2BA84A] to-[#248232]'
                    }`}
                  />
                </div>
                {participantUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {participantUsers.map((participant, i) => (
                        <div 
                          key={participant?.id || i}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] border-2 border-[#121715] flex items-center justify-center overflow-hidden"
                          title={participant?.full_name || 'User'}
                        >
                          {participant?.profile_image_url ? (
                            <img src={participant.profile_image_url} alt={participant.full_name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-white">{participant?.full_name?.[0] || '?'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {actualParticipantCount > 5 && (
                      <span className="text-[11px] leading-[16px] text-[#B6C2BC]">+{actualParticipantCount - 5} till</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Spontaneous match indicator */}
            {match.is_spontaneous && (
              <div className="flex items-center justify-between p-3 bg-[#F4743B]/10 rounded-xl border border-[#F4743B]/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#F4743B]" />
                  <span className="text-sm font-medium text-[#FDE3D2]">Spontan match</span>
                </div>
                <span className="text-sm font-semibold text-[#F4F7F5]">
                  {actualParticipantCount} anmälda
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              {match.status === 'completed' ? (
                <div className="flex-1 bg-[#18221E] rounded-xl p-2.5 text-center border border-[#223029]">
                  <div className="text-[13px] leading-[18px] font-semibold text-[#7B8A83]">Match avslutad</div>
                  {match.final_score && (
                    <div className="text-[12px] leading-[16px] text-[#7B8A83] mt-0.5">Resultat: {match.final_score}</div>
                  )}
                </div>
              ) : isJoinable && (!match.is_spontaneous && spotsLeft > 0 || match.is_spontaneous) ? (
                <>
                  <motion.button
                    onClick={handleJoinClick}
                    animate={{
                      boxShadow: [
                        '0 4px 16px rgba(244, 116, 59, 0.3)',
                        '0 4px 20px rgba(244, 116, 59, 0.5)',
                        '0 4px 16px rgba(244, 116, 59, 0.3)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 6px 24px rgba(244, 116, 59, 0.6)'
                    }}
                    whileTap={{ 
                      scale: 0.98,
                      boxShadow: '0 2px 12px rgba(244, 116, 59, 0.4)'
                    }}
                    className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#F4743B] to-[#FF8652] text-white font-bold text-[13px] tracking-wide uppercase ring-2 ring-[#F4743B]/30 transition-all relative overflow-hidden"
                  >
                    <span className="relative z-10">Gå med nu</span>
                    <ChevronRight className="w-4 h-4 relative z-10" strokeWidth={3} />
                    
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 4
                      }}
                    />
                  </motion.button>
                  
                  <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-shrink-0">
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border-2 border-[#223029] px-4 text-[#CFE8D6] transition-all hover:bg-[#18221E] hover:border-[#2BA84A]/30 active:scale-95 font-semibold text-[13px]">
                      Detaljer
                    </button>
                  </Link>
                </>
              ) : match.status === 'upcoming' && !match.is_spontaneous && spotsLeft === 0 ? (
                <div className="flex-1 bg-[#18221E] rounded-xl p-2.5 border border-[#223029] text-center">
                  <div className="text-[13px] leading-[18px] font-semibold text-[#7B8A83]">Fullbokad</div>
                </div>
              ) : null}

              {(match.status === 'completed' || match.status === 'upcoming' && (!isJoinable || (spotsLeft !== null && spotsLeft <= 0))) && (
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-1">
                  <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border-2 border-[#2BA84A]/35 px-4 text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 hover:border-[#2BA84A]/50 active:scale-95 font-semibold text-[13px]">
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

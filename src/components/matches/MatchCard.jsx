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
      <Card className={`card-base card-hover group h-full flex flex-col ${
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
              
              <div className="flex items-center gap-2 text-secondary">
                 <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-3.5 h-3.5" />
                    {venue?.name || 'Okänd'}
                 </span>
                 <span>•</span>
                 <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {match.date} {match.time}
                 </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
                <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium bg-[#18221E] border border-[#223029] text-secondary`}>
                  {statusBadge.label}
                </span>

                <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium bg-[#18221E] border border-[#223029] text-secondary">
                  {match.format || '5v5'}
                </span>
                
                {match.is_team_match && (
                    <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium bg-[#18221E] border border-[#223029] text-[#DDA5E8]">
                      Lag
                    </span>
                )}
                
                {!match.is_team_match && match.skill_bracket && SkillIcon && (
                  <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium bg-[#18221E] border border-[#223029] text-secondary`}>
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
            <div className="flex gap-3 pt-2">
              {match.status === 'completed' ? (
                <div className="flex-1 py-2 text-center border border-[#223029] rounded-lg bg-[#18221E]">
                  <span className="text-xs font-medium text-gray-500">Avslutad</span>
                </div>
              ) : isJoinable && (!match.is_spontaneous && spotsLeft > 0 || match.is_spontaneous) ? (
                <>
                  <button
                    onClick={handleJoinClick}
                    className="flex-1 bg-[#F4743B] hover:bg-[#E5683A] text-white text-sm font-semibold h-9 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Gå med
                  </button>
                  
                  <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-shrink-0">
                    <button className="h-9 px-3 border border-[#223029] hover:bg-[#18221E] text-white text-sm font-medium rounded-lg transition-colors">
                      Info
                    </button>
                  </Link>
                </>
              ) : match.status === 'upcoming' && !match.is_spontaneous && spotsLeft === 0 ? (
                <div className="flex-1 py-2 text-center border border-[#223029] rounded-lg bg-[#18221E]">
                  <span className="text-xs font-medium text-gray-500">Fullbokad</span>
                </div>
              ) : null}

              {(match.status === 'completed' || (match.status === 'upcoming' && (!isJoinable || (spotsLeft !== null && spotsLeft <= 0)))) && (
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-1">
                  <button className="w-full h-9 border border-[#223029] hover:bg-[#18221E] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1">
                    Detaljer
                    <ChevronRight className="w-3 h-3" />
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
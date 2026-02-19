import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Trophy, Target, ChevronRight, Shield, Zap, TrendingUp, Crown, Flame, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { TRANSITIONS, triggerHaptic } from "@/components/utils/motionTokens";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { getUsersByIds } from "@/components/supabase/services";
import AvatarImage from "@/components/ui/avatar-image";
import { AuthGateModal } from '@/components/ui/auth-gate-modal';
import { LoginModal } from '@/components/supabase';

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
    completed: { label: 'Avslutad', color: 'bg-[#18221E] text-[#9EAAA4]' },
    cancelled: { label: 'Inställd', color: 'bg-[#F4743B]/20 text-[#FDE3D2]' }
  };
  return statusConfig[status] || statusConfig.upcoming;
};

export default React.memo(function MatchCard({ match, venues = [], user, participants = [], onJoin, onRefresh, index = 0 }) {
  // ALWAYS call hooks first, before any conditional returns
  const [participantUsers, setParticipantUsers] = useState([]);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isGuest } = useSupabaseAuth();

  useEffect(() => {
    if (participants && participants.length > 0) {
      loadParticipantUsers();
    } else {
      setParticipantUsers([]);
    }
  }, [participants]);

  // NOW we can do null checks after hooks
  if (!match) {
    return null;
  }

  // Support both Base44 venues lookup AND inline venue data from Supabase view
  const venueFromList = venues?.find(v => v?.id === match.venue_id || v?.id === match.venue_external_id);
  const venue = venueFromList || {
    // Use inline venue data from public_matches view if available
    name: match._venue_name || match.venue_name || 'Okänd plan',
    city: match._venue_city || match.venue_city,
    address: match._venue_address || match.venue_address,
    latitude: match._venue_lat || match.venue_lat,
    longitude: match._venue_lng || match.venue_lng,
  };
  
  const isOrganizer = user && match.organizer_id === user?.id;
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
    const userIds = participants.slice(0, 5)
      .map(p => p?.user_id)
      .filter(Boolean);
    
    if (userIds.length === 0) {
      setParticipantUsers([]);
      return;
    }
    
    try {
      const users = await getUsersByIds(userIds);
      setParticipantUsers(users || []);
    } catch (error) {
      // Never block card render – show fallback avatars
      console.warn("[MatchCard] Failed to load participant users, using fallbacks:", error.message);
      setParticipantUsers(userIds.map(id => ({
        id,
        full_name: 'Spelare',
        display_name: 'Spelare',
        avatar_url: null,
        profile_image_url: null
      })));
    }
  };

  const handleJoinClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if guest
    if (isGuest) {
      setShowAuthGate(true);
      return;
    }
    
    triggerHaptic('success');
    
    // Let backend handle auth - onJoin will show error if guest
    if (onJoin) {
      await onJoin(match.id);
    }
    if (onRefresh) {
      await onRefresh();
    }
  };

  // UI-level check only - backend validates actual join permission
  // Show join button if match is joinable and not already joined (backend handles auth + capacity check)
  const canJoin = isJoinable && !hasJoined;

  return (
    <>
    {/* Auth Gate Modal */}
    <AuthGateModal 
      isOpen={showAuthGate}
      onClose={() => setShowAuthGate(false)}
      onLogin={() => setShowLoginModal(true)}
      feature="anmäla dig till matcher"
    />
    
    {/* Login Modal */}
    <LoginModal 
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      onSuccess={() => {
        setShowLoginModal(false);
        setShowAuthGate(false);
      }}
    />
    
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className={`bg-[#121715] border border-[#223029] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_24px_rgba(43,168,74,0.15)] hover:border-[#2BA84A]/40 transition-all duration-200 group h-full flex flex-col ${
        match.status === 'completed' ? 'opacity-75' : ''
      }`}>
        <CardContent className="p-4 flex flex-col h-full">
          <div className="space-y-3 flex flex-col h-full">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-white truncate pr-2">
                  {match.title || 'Namnlös match'}
                </h3>
                {isOrganizer && match.status === 'upcoming' && (
                  <Badge variant="outline" className="text-[10px] border-[#F4743B]/30 text-[#FDE3D2] h-5 px-2">
                    Din
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-[#B6C2BC] text-xs sm:text-sm mt-1">
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

                <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium bg-[#18221E] border border-[#223029] text-[#B6C2BC]">
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
                <div className="flex items-center justify-between text-xs text-[#B6C2BC]">
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
                      {/* Always render placeholder circles for expected count, fill with real data progressively */}
                      {(participantUsers.length > 0 ? participantUsers : participants.slice(0, 5)).slice(0, 5).map((participant, i) => {
                        const pUser = participantUsers[i];
                        const avatarSrc = pUser?.avatar_url || pUser?.profile_image_url;
                        const name = pUser?.display_name || pUser?.full_name || 'S';
                        return (
                          <div key={participant?.id || participant?.user_id || i} className="border border-[#121715] rounded-full">
                            <AvatarImage 
                              src={avatarSrc}
                              name={name}
                              className="w-6 h-6"
                              textClassName="text-[9px]"
                            />
                          </div>
                        );
                      })}
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

            {/* Actions - ALWAYS show Info button, conditionally show Join */}
            <div className="flex gap-3 pt-3 mt-auto">
              {/* Join button - show if joinable and user can join */}
              {canJoin && (
                <button
                  onClick={handleJoinClick}
                  className="flex-1 bg-[#F4743B] hover:bg-[#E5683A] active:scale-95 text-white text-base font-extrabold uppercase tracking-wide h-12 rounded-2xl transition-transform flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(244,116,59,0.4)] hover:shadow-[0_0_25px_rgba(244,116,59,0.6)] border border-[#F4743B]/50"
                >
                  Gå med
                </button>
              )}

              {/* Status badges for non-joinable states */}
              {match.status === 'completed' && (
                <div className="flex-1 h-12 flex items-center justify-center border border-[#223029] rounded-xl bg-[#18221E]">
                  <span className="text-sm font-bold text-[#9EAAA4]">Avslutad</span>
                </div>
              )}
              


              {hasJoined && match.status !== 'completed' && (
                <div className="flex-1 h-12 flex items-center justify-center border border-[#2BA84A]/30 rounded-xl bg-[#2BA84A]/10">
                  <span className="text-sm font-bold text-[#2BA84A]">Anmäld ✓</span>
                </div>
              )}

              {/* Info button - ALWAYS visible */}
              <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className={canJoin ? "flex-shrink-0" : "flex-1"}>
                <button className={`h-12 border-2 border-[#223029] hover:bg-[#18221E] hover:border-[#2BA84A]/50 text-[#F4F7F5] text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-1 ${canJoin ? 'px-5' : 'w-full'}`}>
                  Info
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    </>
  );
});
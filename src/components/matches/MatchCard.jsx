import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Target, ChevronRight, Shield, Zap, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/components/utils/motionTokens";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { getCachedUser } from "@/components/supabase/services/userCache";
import AvatarImage from "@/components/ui/avatar-image";
import { AuthGateModal } from '@/components/ui/auth-gate-modal';
import { LoginModal } from '@/components/supabase';

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target },
  intermediate: { label: 'Medel', icon: TrendingUp },
  advanced: { label: 'Avancerad', icon: Shield },
  pro: { label: 'Proffs', icon: Crown },
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
    upcoming: { label: 'Kommande', color: 'bg-[#F4743B]/20 text-[#FDE3D2]' },
    ongoing: { label: 'Pågår nu', color: 'bg-[#2BA84A]/20 text-[#CFE8D6] animate-pulse' },
    completed: { label: 'Avslutad', color: 'bg-[#18221E] text-[#9EAAA4]' },
    cancelled: { label: 'Inställd', color: 'bg-[#F4743B]/20 text-[#FDE3D2]' }
  };
  return statusConfig[status] || statusConfig.upcoming;
};

export default React.memo(function MatchCard({ match, venues = [], user, participants = [], onJoin, onRefresh }) {
  // ALWAYS call hooks first, before any conditional returns
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isGuest } = useSupabaseAuth();

  // Read participant users SYNCHRONOUSLY from the shared cache — no extra network call.
  // `getParticipantsForMatches` (upstream) already primed the cache in the same query.
  // Result: avatars render the same tick as the card itself. No delay, no flash.
  const participantUsers = useMemo(() => {
    if (!participants || participants.length === 0) return [];
    return participants
      .slice(0, 5)
      .map(p => {
        if (!p?.user_id) return null;
        const cached = getCachedUser(p.user_id);
        if (cached) return cached;
        // Fallback — participant row may already carry user fields from backend join
        return {
          id: p.user_id,
          full_name: p.full_name || p.display_name || 'Spelare',
          display_name: p.display_name || p.full_name || 'Spelare',
          avatar_url: p.avatar_url || null,
        };
      })
      .filter(Boolean);
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
    {/* Portaled modals — rendered at document.body to escape carousel transform stacking context */}
    {createPortal(
      <>
        <AuthGateModal
          isOpen={showAuthGate}
          onClose={() => setShowAuthGate(false)}
          onLogin={() => setShowLoginModal(true)}
          feature="se matchdetaljer, spelare och anmäla dig"
        />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            setShowAuthGate(false);
          }}
        />
      </>,
      document.body
    )}

    <div className="h-full">
      <Card className={`bg-[#121715] border border-[#243029] rounded-[18px] shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.42),0_0_0_1px_rgba(43,168,74,0.25)] hover:border-[#2BA84A]/40 hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200 h-full min-h-[220px] flex flex-col overflow-hidden group ${
        match.status === 'completed' ? 'opacity-75' : ''
      }`}
      style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <CardContent className="p-3 sm:p-4 flex flex-col h-full">
          <div className="space-y-3 flex flex-col h-full">
            {/* Header — status dot + title + one compact chip */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Tiny status dot */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      match.status === 'ongoing' ? 'bg-[#34C257] animate-pulse' :
                      match.status === 'upcoming' ? 'bg-[#F4743B]' :
                      match.status === 'cancelled' ? 'bg-[#DC2626]' :
                      'bg-[#6B7280]'
                    }`}
                    aria-hidden
                  />
                  <h3 className="text-[15px] font-bold text-white truncate tracking-tight">
                    {match.title || 'Namnlös match'}
                  </h3>
                </div>
                {isOrganizer && match.status === 'upcoming' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FDE3D2] bg-[#F4743B]/15 ring-1 ring-[#F4743B]/30 h-5 px-2 rounded-md flex items-center flex-shrink-0">
                    Din
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[#B6C2BC] text-[12px] sm:text-[13px]">
                 <span className="flex items-center gap-1.5 min-w-0 flex-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#34C257]" />
                    <span className="truncate">{venue?.name || 'Okänd'}</span>
                 </span>
                 <span className="flex items-center gap-1.5 flex-shrink-0 tabular-nums">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#F4743B]" />
                    <span>{match.date} • {match.time}</span>
                 </span>
              </div>
            </div>

            {/* Compact meta row — format + optional skill/team (max 2 chips) */}
            <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold bg-[#18221E] border border-[#243029] text-[#C2CEC8]">
                  {match.format || '5v5'}
                </span>

                {match.is_team_match ? (
                  <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold bg-[#9B59B6]/18 text-[#DDA5E8] ring-1 ring-[#9B59B6]/30">
                    Lag
                  </span>
                ) : (match.skill_bracket && SkillIcon && (
                  <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold ${getSkillBracketColor(match.skill_bracket)}`}>
                    {getSkillBracketLabel(match.skill_bracket)}
                  </span>
                ))}
            </div>

            {/* Players section — unified fixed height across all card types */}
            <div className="space-y-1.5 mt-auto min-h-[56px] flex flex-col justify-end">
              {/* Header row: label + count */}
              <div className="flex items-center justify-between text-xs">
                {match.is_spontaneous ? (
                  <span className="inline-flex items-center gap-1.5 text-[#FDE3D2]">
                    <Zap className="w-3.5 h-3.5 text-[#F4743B]" />
                    <span className="font-semibold">Spontan • Obegränsat</span>
                  </span>
                ) : (
                  <span className="text-[#B6C2BC]">Spelare</span>
                )}
                {/* Hide exact count for guests — shows "app feels empty" otherwise */}
                {isGuest ? (
                  <span className="text-[#8FA097] text-[11px] font-medium">Logga in</span>
                ) : (
                  <span className="text-white font-medium tabular-nums">
                    {match.is_spontaneous
                      ? `${actualParticipantCount} ${actualParticipantCount === 1 ? 'spelare' : 'spelare'}`
                      : `${actualParticipantCount}/${match.max_players}`}
                  </span>
                )}
              </div>

              {/* Bar — animated gradient for guests + spontaneous, solid progress for standard */}
              {(isGuest || match.is_spontaneous) ? (
                <div className={`h-1.5 bg-[#18221E] rounded-full overflow-hidden border relative ${isGuest ? 'border-[#2BA84A]/20' : 'border-[#F4743B]/20'}`}>
                  <motion.div
                    className="absolute inset-y-0 w-1/3 rounded-full"
                    style={{
                      background: isGuest
                        ? 'linear-gradient(90deg, transparent, rgba(52,194,87,0.65), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(244,116,59,0.75), transparent)',
                    }}
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              ) : (
                <div className="h-1.5 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                  <div
                    style={{ width: `${progressPercentage}%` }}
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                      progressPercentage >= 90 ? 'bg-[#F4743B]' : 'bg-[#2BA84A]'
                    }`}
                  />
                </div>
              )}

              {/* Footer row: guest CTA, avatars, or "be first" hint */}
              {isGuest ? (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthGate(true); }}
                  className="flex items-center gap-2 pt-1 text-[11px] text-[#34C257] hover:text-[#86EFAC] transition-colors font-semibold"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Logga in för att se spelare</span>
                </button>
              ) : participantUsers.length > 0 ? (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex -space-x-2">
                    {participantUsers.slice(0, 5).map((pUser, i) => {
                      const avatarSrc = pUser?.avatar_url;
                      const name = pUser?.display_name || pUser?.full_name || 'S';
                      return (
                        <div key={pUser?.id || i} className="border border-[#121715] rounded-full">
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
              ) : (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8FA097]">
                  <Users className="w-3.5 h-3.5" />
                  <span>Var först att gå med!</span>
                </div>
              )}
            </div>

            {/* Actions - ALWAYS show Info button, conditionally show Join */}
            <div className="flex gap-2 pt-2.5 mt-auto">
              {/* Join button — premium pulsing CTA */}
              {canJoin && (
                <motion.button
                  onClick={handleJoinClick}
                  whileTap={{ scale: 0.96 }}
                  animate={{
                    boxShadow: [
                      '0 8px 22px rgba(244,116,59,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
                      '0 10px 28px rgba(244,116,59,0.55), inset 0 1px 0 rgba(255,255,255,0.22)',
                      '0 8px 22px rgba(244,116,59,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
                    ],
                  }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex-1 relative overflow-hidden text-white text-[14px] font-extrabold uppercase tracking-wide h-10 rounded-[12px] flex items-center justify-center gap-2 ring-1 ring-white/10"
                  style={{
                    background:
                      'linear-gradient(180deg, #FF8A4D 0%, #F4743B 55%, #D95D26 100%)',
                  }}
                >
                  {/* Shimmer sweep */}
                  <motion.span
                    aria-hidden
                    initial={{ x: '-120%' }}
                    animate={{ x: '180%' }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
                    className="absolute top-0 bottom-0 w-1/3 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                      filter: 'blur(6px)',
                    }}
                  />
                  <span className="relative z-10">Gå med</span>
                  <motion.span
                    className="relative z-10 inline-flex"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-4 h-4" strokeWidth={2.6} />
                  </motion.span>
                </motion.button>
              )}

              {/* Status badges for non-joinable states */}
              {match.status === 'completed' && (
                <div className="flex-1 h-10 flex items-center justify-center border border-[#243029] rounded-[12px] bg-[#18221E]">
                  <span className="text-[13px] font-bold text-[#9EAAA4]">Avslutad</span>
                </div>
              )}

              {hasJoined && match.status !== 'completed' && (
                <div className="flex-1 h-10 flex items-center justify-center border border-[#2BA84A]/30 rounded-[12px] bg-[#2BA84A]/10">
                  <span className="text-[13px] font-bold text-[#34C257]">Anmäld ✓</span>
                </div>
              )}

              {/* Info button — navigates to detail for auth users, opens login gate for guests */}
              {isGuest ? (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthGate(true); }}
                  className={`h-10 border border-[#243029] hover:bg-[#18221E] hover:border-[#2BA84A]/40 text-[#F5F8F6] text-[13px] font-bold rounded-[12px] transition-colors flex items-center justify-center gap-1 ${canJoin ? 'flex-shrink-0 px-3.5' : 'flex-1 w-full'}`}
                >
                  Info
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className={canJoin ? "flex-shrink-0" : "flex-1"}>
                  <button className={`h-10 border border-[#243029] hover:bg-[#18221E] hover:border-[#2BA84A]/40 text-[#F5F8F6] text-[13px] font-bold rounded-[12px] transition-colors flex items-center justify-center gap-1 ${canJoin ? 'px-3.5' : 'w-full'}`}>
                    Info
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
});
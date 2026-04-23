import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, Calendar, Trophy, UserPlus, UserCheck, Clock,
  Heart, Zap, MapPin, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileStats from "./ProfileStats";
import MatchHistory from "./MatchHistory";
import AvatarImage from "@/components/ui/avatar-image";
import { CACHE_STRATEGIES } from "@/components/providers/QueryProvider";
import { base44 } from "@/api/base44Client";
import { getUsersByIds } from "@/components/supabase/services";

/**
 * Rich profile view for viewing OTHER players.
 * Shows:
 *  - Shared matches (played together)
 *  - Mutual friends
 *  - Player stats + history
 *  - Quick actions (add friend, send message, invite to match)
 */
export default function OtherProfileView({
  targetUser,
  currentUser,
  friendships = [],
  friendshipStatus = 'none',
  onAddFriend,
  onRemoveFriend,
  matchHistory = [],
}) {
  // ── Fetch current user's matches to compute shared ones ──
  const { data: myMatchIds = [] } = useQuery({
    queryKey: ['myMatchIds', currentUser?.id],
    queryFn: async () => {
      const parts = await base44.entities.MatchParticipant.filter({ user_id: currentUser.id });
      return parts.map(p => p.match_id);
    },
    enabled: !!currentUser?.id,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  const sharedMatches = useMemo(() => {
    if (!myMatchIds.length || !matchHistory.length) return [];
    const mine = new Set(myMatchIds);
    return matchHistory.filter(m => mine.has(m.id));
  }, [myMatchIds, matchHistory]);

  // ── Compute mutual friends (intersection of friendship lists) ──
  const { data: mutualFriends = [] } = useQuery({
    queryKey: ['mutualFriends', currentUser?.id, targetUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !targetUser?.id) return [];
      // Target's friendships — requires RLS allowing read
      const { getAuthHeaders, SUPABASE_URL } = await import('@/components/supabase/config');
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/friendships?or=(requester_id.eq.${targetUser.id},addressee_id.eq.${targetUser.id})&status=eq.accepted&select=*`,
        { headers }
      );
      if (!res.ok) return [];
      const targetFriendships = await res.json();

      // Get target's friend IDs
      const theirFriendIds = new Set(
        targetFriendships.map(f =>
          f.requester_id === targetUser.id ? f.addressee_id : f.requester_id
        )
      );

      // Get my friend IDs
      const myFriendIds = (friendships || [])
        .filter(f => f.status === 'accepted')
        .map(f => (f.requester_id === currentUser.id ? f.addressee_id : f.requester_id));

      // Intersection
      const mutualIds = myFriendIds.filter(id => theirFriendIds.has(id));
      if (mutualIds.length === 0) return [];

      const users = await getUsersByIds(mutualIds.slice(0, 12));
      return users || [];
    },
    enabled: !!currentUser?.id && !!targetUser?.id,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  const renderFriendAction = () => {
    if (friendshipStatus === 'self') return null;

    if (friendshipStatus === 'accepted') {
      return (
        <div className="flex items-center gap-2 bg-[#2BA84A]/14 border border-[#2BA84A]/30 rounded-xl px-4 py-2.5">
          <UserCheck className="w-4 h-4 text-[#2BA84A]" />
          <span className="text-sm font-semibold text-[#86EFAC]">Vänner</span>
        </div>
      );
    }
    if (friendshipStatus === 'pending_outgoing') {
      return (
        <div className="flex items-center gap-2 bg-[#18221E] border border-[#223029] rounded-xl px-4 py-2.5">
          <Clock className="w-4 h-4 text-[#B6C2BC]" />
          <span className="text-sm font-semibold text-[#B6C2BC]">Förfrågan skickad</span>
        </div>
      );
    }
    if (friendshipStatus === 'pending_incoming') {
      return (
        <Button
          onClick={onAddFriend}
          className="bg-[#F4743B] hover:bg-[#E5683A] text-white h-10 px-5 rounded-xl font-bold shadow-[0_4px_12px_rgba(244,116,59,0.35)]"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Acceptera förfrågan
        </Button>
      );
    }
    if (friendshipStatus === 'blocked') return null;
    return (
      <Button
        onClick={onAddFriend}
        className="bg-[#2BA84A] hover:bg-[#248232] text-white h-10 px-5 rounded-xl font-bold shadow-[0_4px_12px_rgba(43,168,74,0.35)]"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Lägg till vän
      </Button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* ── Relationship bar ── */}
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 ring-1 ring-[#2BA84A]/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {friendshipStatus === 'accepted' ? 'Ni är vänner' :
                 friendshipStatus === 'pending_outgoing' ? 'Väntar svar' :
                 friendshipStatus === 'pending_incoming' ? 'Har skickat förfrågan till dig' :
                 'Inte vänner än'}
              </div>
              <div className="text-xs text-[#9EAAA4]">
                {sharedMatches.length > 0
                  ? `${sharedMatches.length} match${sharedMatches.length === 1 ? '' : 'er'} tillsammans`
                  : 'Inga gemensamma matcher än'}
              </div>
            </div>
          </div>
          {renderFriendAction()}
        </CardContent>
      </Card>

      {/* ── Shared matches ── */}
      {sharedMatches.length > 0 && (
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-[#223029] px-5 py-4">
            <CardTitle className="text-sm text-white flex items-center gap-2 font-bold">
              <div className="w-7 h-7 rounded-lg bg-[#F4743B]/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#F4743B]" />
              </div>
              Matcher ni spelat ihop
              <span className="ml-auto text-[#9EAAA4] font-normal text-xs">{sharedMatches.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5">
            {sharedMatches.slice(0, 5).map((match) => (
              <Link
                key={match.id}
                to={`${createPageUrl('MatchDetail')}?id=${match.id}`}
                className="flex items-center gap-3 p-3 bg-[#18221E] hover:bg-[#1E2B25] rounded-xl transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F4743B]/15 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#FDE3D2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate group-hover:text-[#2BA84A]">
                    {match.title}
                  </div>
                  <div className="text-xs text-[#9EAAA4] flex items-center gap-2 tabular-nums">
                    <span>{match.date}</span>
                    {match.final_score && (
                      <>
                        <span>·</span>
                        <span className="text-[#2BA84A] font-bold">{match.final_score}</span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#6B7C74] group-hover:text-[#2BA84A] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Mutual friends ── */}
      {mutualFriends.length > 0 && (
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-[#223029] px-5 py-4">
            <CardTitle className="text-sm text-white flex items-center gap-2 font-bold">
              <div className="w-7 h-7 rounded-lg bg-[#2BA84A]/15 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-[#2BA84A]" />
              </div>
              Gemensamma vänner
              <span className="ml-auto text-[#9EAAA4] font-normal text-xs">{mutualFriends.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {mutualFriends.map(f => (
                <Link
                  key={f.id}
                  to={`${createPageUrl('Profile')}?userId=${f.id}`}
                  className="flex items-center gap-2 bg-[#18221E] hover:bg-[#1E2B25] rounded-full pl-1 pr-3 py-1 border border-[#223029] hover:border-[#2BA84A]/35 transition-all"
                >
                  <AvatarImage
                    src={f.avatar_url || f.profile_image_url}
                    name={f.display_name || f.full_name}
                    className="w-7 h-7"
                    textClassName="text-[10px]"
                  />
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {f.display_name || f.full_name}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stats ── */}
      <ProfileStats user={targetUser} matchHistory={matchHistory} isOwnProfile={false} />

      {/* ── Match history ── */}
      {matchHistory.length > 0 ? (
        <MatchHistory matches={matchHistory} />
      ) : (
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/20">
            <Trophy className="w-7 h-7 text-[#2BA84A]" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">
            Inga matcher spelade
          </h3>
          <p className="text-sm text-[#9EAAA4]">
            Denna spelare har inte spelat några matcher än.
          </p>
        </Card>
      )}
    </motion.div>
  );
}
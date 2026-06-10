import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users as UsersIcon, Flag, Info, Shield, Swords, ChevronDown } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useCustomDialog } from "../components/ui/custom-dialog";
import feedback from "../components/ui/feedback-toast";
import { LazyMatchEndModal, LazyInviteFriendsModal, LazyMatchReportModal } from "../components/matches/LazyMatchDetails";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import CupMatchGoals from "../components/cups/CupMatchGoals";
import CheckInButton from "../components/matches/CheckInButton";
import MatchPlayersModal from "../components/matches/MatchPlayersModal";
import MatchHeroBanner from "../components/matches/detail/MatchHeroBanner";
import MatchActionBar from "../components/matches/detail/MatchActionBar";
import ParticipantGrid from "../components/matches/detail/ParticipantGrid";
import MatchDetailsCard from "../components/matches/detail/MatchDetailsCard";
import { normalizeMatch } from "../components/matches/detail/normalizeMatch";
import {
  joinMatch,
  leaveMatch,
  deleteMatch,
  finishMatch,
  getMatchDetails,
  getMatchParticipants
} from "../components/supabase/services/matchesService";
import { getVenues, getUsersByIds, getMyProfile, getMyTeams, joinTeamMatchAsTeamB, getTeamsByIds } from "../components/supabase/services";
import { sendFriendRequest, getMyFriendships } from "../components/supabase/services/friendshipsService";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { useT } from "../i18n/LanguageProvider";
import { track } from "@/lib/analytics";

export default function MatchDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const matchId = new URLSearchParams(location.search).get("id");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (matchId) track('match_detail_viewed', { match_id: matchId });
  }, [matchId]);

  const [showEndModal, setShowEndModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [teamJoinId, setTeamJoinId] = useState(null);
  const [isJoiningAsTeam, setIsJoiningAsTeam] = useState(false);

  const { confirm, alert, DialogContainer } = useCustomDialog();
  const { isGuest, isAuthenticated, user: authUser } = useSupabaseAuth();
  const { t } = useT();

  const { data: userProfile } = useQuery({
    queryKey: ["supabase-userProfile", authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id
  });

  const user = React.useMemo(() => {
    if (!authUser) return null;
    return { ...authUser, ...userProfile, id: authUser.id };
  }, [authUser, userProfile]);

  const isAdmin = user?.role === "admin" || user?.is_admin;

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["supabase-match", matchId],
    queryFn: async () => {
      if (!matchId) return null;
      try {
        const result = await getMatchDetails(matchId);
        if (result) return normalizeMatch(result);
      } catch {}
      try {
        const matches = await base44.entities.Match.filter({ id: matchId });
        if (matches?.length) return normalizeMatch(matches[0]);
      } catch {}
      return null;
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!matchId,
    retry: 1
  });

  const isCupMatch = match?.is_cup_match || false;

  const { data: cupMatch } = useQuery({
    queryKey: ["cupMatch", matchId],
    queryFn: async () => {
      const cupMatches = await base44.entities.CupMatch.filter({ match_id: matchId });
      return cupMatches[0] || null;
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!matchId && isCupMatch
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["supabase-venues"],
    queryFn: () => getVenues(),
    ...CACHE_STRATEGIES.STATIC,
  });

  const venue = React.useMemo(() => {
    if (!match) return null;
    if (match._venue_name || match.venue_name || match.pitch_name) {
      return {
        name: match._venue_name || match.venue_name || match.pitch_name || t('match.unknown_venue'),
        city: match._venue_city || match.venue_city || match.pitch_city,
        address: match._venue_address || match.venue_address || match.pitch_address,
        latitude: match._venue_lat || match.venue_lat || match.pitch_lat,
        longitude: match._venue_lng || match.venue_lng || match.pitch_lng,
      };
    }
    return venues.find(v => v.id === match.venue_id || v.id === match.pitch_id) || { name: t('match.unknown_venue') };
  }, [match, venues]);

  const { data: participantsRaw = [], isLoading: participantsLoading } = useQuery({
    queryKey: ["supabase-matchParticipants", matchId],
    queryFn: async () => {
      if (!matchId) return [];
      try {
        const parts = await getMatchParticipants(matchId);
        if (Array.isArray(parts)) return parts;
        if (parts && typeof parts === "object") return [parts];
      } catch {}
      try {
        const parts = await base44.entities.MatchParticipant.filter({ match_id: matchId });
        return Array.isArray(parts) ? parts : [];
      } catch {}
      return [];
    },
    ...CACHE_STRATEGIES.DYNAMIC,
    enabled: !!matchId
  });

  const participantUserIds = React.useMemo(
    () => [...new Set((participantsRaw || []).map(p => p.user_id).filter(Boolean))],
    [participantsRaw]
  );

  const { data: participantUsers = [] } = useQuery({
    queryKey: ["supabase-participantUsers", participantUserIds],
    queryFn: () => getUsersByIds(participantUserIds),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: participantUserIds.length > 0
  });

  const participants = React.useMemo(() => {
    const usersArray = Array.isArray(participantUsers) ? participantUsers : [];
    const rawArray = Array.isArray(participantsRaw) ? participantsRaw : [];
    if (usersArray.length > 0) {
      return usersArray.map(u => ({
        ...u,
        participantInfo: rawArray.find(p => p.user_id === u.id),
      }));
    }
    return rawArray.map(p => ({
      id: p.user_id,
      full_name: p.full_name || p.display_name || p.username || t('common.player'),
      display_name: p.display_name || p.full_name || p.username || t('common.player'),
      avatar_url: p.avatar_url,
      city: p.city,
      participantInfo: p,
    }));
  }, [participantUsers, participantsRaw]);

  const { data: friendships = [] } = useQuery({
    queryKey: ["friendships", user?.id],
    queryFn: () => getMyFriendships(),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user?.id
  });

  const { data: myTeams = [] } = useQuery({
    queryKey: ["my-teams", user?.id],
    queryFn: () => getMyTeams(),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user?.id && !isGuest,
  });

  const teamIdsForMatch = React.useMemo(
    () => [match?.team_a_id, match?.team_b_id].filter(Boolean),
    [match?.team_a_id, match?.team_b_id]
  );

  const { data: matchTeams = [] } = useQuery({
    queryKey: ["teams-for-match", ...teamIdsForMatch],
    queryFn: () => getTeamsByIds(teamIdsForMatch),
    enabled: teamIdsForMatch.length > 0,
    staleTime: 60_000,
  });

  const teamAName = matchTeams.find(t => t.id === match?.team_a_id)?.name || null;
  const teamBName = matchTeams.find(t => t.id === match?.team_b_id)?.name || null;

  // ── Mutations ──────────────────────────────────────────
  const joinMatchMutation = useMutation({
    mutationFn: () => joinMatch(matchId),
    onMutate: async () => {
      setIsActionLoading(true);
      await queryClient.cancelQueries({ queryKey: ["supabase-matchParticipants", matchId] });
      const prev = queryClient.getQueryData(["supabase-matchParticipants", matchId]);
      if (user) {
        queryClient.setQueryData(["supabase-matchParticipants", matchId], (old = []) => [
          ...old,
          { user_id: user.id, match_id: matchId, status: "registered" }
        ]);
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["supabase-matchParticipants", matchId], ctx.prev);
      feedback.error(t('match_detail.join_error'), { description: err.message || t('common.retry') });
    },
    onSuccess: () => {
      feedback.success(t('match_detail.join_success'), { description: t('match_detail.join_success_desc', { title: match?.title || '' }) });
    },
    onSettled: () => {
      setIsActionLoading(false);
      queryClient.invalidateQueries({ queryKey: ["supabase-matchParticipants", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches-infinite"] });
    }
  });

  const handleJoin = () => !isActionLoading && !joinMatchMutation.isPending && joinMatchMutation.mutate();

  const handleLeave = async () => {
    if (isActionLoading) return;
    const ok = await confirm(t('match_detail.leave_title'), t('match_detail.leave_confirm'), {
      type: "warning", confirmText: t('match_detail.leave_yes'), cancelText: t('common.cancel')
    });
    if (!ok) return;
    setIsActionLoading(true);
    const prev = queryClient.getQueryData(["supabase-matchParticipants", matchId]);
    if (user?.id) {
      queryClient.setQueryData(["supabase-matchParticipants", matchId], (old = []) =>
        old.filter(p => p.user_id !== user.id)
      );
    }
    try {
      await leaveMatch(matchId);
      queryClient.invalidateQueries({ queryKey: ["supabase-matchParticipants", matchId] });
      queryClient.invalidateQueries({ queryKey: ["supabase-match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["supabase-myParticipantMatchIds"] });
      feedback.info(t('match_detail.left_match'));
    } catch (error) {
      if (prev) queryClient.setQueryData(["supabase-matchParticipants", matchId], prev);
      feedback.error(t('match_detail.leave_error'), { description: error.message || t('common.retry') });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEnd = async (resultData) => {
    try {
      await finishMatch(matchId, {
        home_score: resultData?.home_score ?? resultData?.teamAScore,
        away_score: resultData?.away_score ?? resultData?.teamBScore,
        notes: resultData?.notes || resultData?.matchFeedback
      });
      setShowEndModal(false);
      queryClient.invalidateQueries({ queryKey: ["supabase-match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["supabase-matchParticipants", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches-infinite"] });
      feedback.success(t('match_detail.end_success'), { description: t('match_detail.end_success_desc') });
    } catch (error) {
      feedback.error(t('match_detail.end_error'), { description: error.message || t('common.retry') });
    }
  };

  const handleAddFriend = async (participantId) => {
    const loadingId = feedback.loading(t('match_detail.friend_loading'));
    try {
      const result = await sendFriendRequest(participantId);
      feedback.dismiss(loadingId);
      queryClient.invalidateQueries({ queryKey: ["friendships", user?.id] });
      if (result.action === "created") {
        feedback.success(t('match_detail.friend_sent'));
      } else if (result.action === "accepted") {
        feedback.success(t('match_detail.friend_now'));
      } else if (result.action === "already_sent") {
        feedback.info(t('match_detail.friend_already_sent'));
      } else if (result.action === "already_friends") {
        feedback.info(t('match_detail.friend_already'));
      }
    } catch (error) {
      feedback.dismiss(loadingId);
      feedback.error(t('match_detail.friend_error'), { description: error.message || t('common.retry') });
    }
  };

  const getFriendStatus = (participantId) => {
    if (!user?.id || !friendships || participantId === user?.id) return null;
    const f = friendships.find(fr =>
      (fr.requester_id === user.id && fr.addressee_id === participantId) ||
      (fr.requester_id === participantId && fr.addressee_id === user.id)
    );
    if (!f) return "none";
    if (f.status === "accepted") return "friends";
    if (f.status === "pending") return f.requester_id === user.id ? "pending_sent" : "pending_received";
    return "none";
  };

  const friendStatusMap = React.useMemo(() => {
    const map = {};
    participants.forEach(p => { map[p.id] = getFriendStatus(p.id); });
    return map;
  }, [participants, friendships, user?.id]);

  const handleDelete = async () => {
    if (isActionLoading) return;
    const ok = await confirm(t('match_detail.delete_title'), t('match_detail.delete_confirm'), {
      type: "warning", confirmText: t('match_detail.delete_yes'), cancelText: t('common.cancel')
    });
    if (!ok) return;
    setIsActionLoading(true);
    try {
      await deleteMatch(matchId);
      queryClient.invalidateQueries({ queryKey: ["matches-infinite"] });
      feedback.success(t('match_detail.deleted'));
      navigate(createPageUrl("Matches"));
    } catch (error) {
      feedback.error(t('match_detail.delete_error'), { description: error.message || t('common.retry') });
    } finally {
      setIsActionLoading(false);
    }
  };

  const generateGoogleCalendarUrl = () => {
    if (!match || !match.date || !match.time) return "";
    try {
      const [y, mo, d] = match.date.split("-");
      const [h, mi] = match.time.split(":");
      const start = new Date(y, mo - 1, d, h, mi);
      const end = new Date(start.getTime() + (match.duration_minutes || 90) * 60000);
      const fmt = (date) => date.toISOString().replace(/-|:|\.\d+/g, "");
      const venueName = venue?.name || t('common.unknown');
      const venueAddress = venue ? `${venue.address || ""}, ${venue.city || ""}` : "";
      const details = t('match_detail.cal_details', { title: match.title, format: match.format, venueName, link: window.location.href });
      const loc = venueAddress || venueName;
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(match.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`;
    } catch {
      return "#";
    }
  };

  const handleCalendar = () => {
    const url = generateGoogleCalendarUrl();
    if (url && url !== "#") window.open(url, "_blank");
  };

  // Derived
  const participantCount = Array.isArray(participantsRaw) && participantsRaw.length > 0
    ? participantsRaw.length
    : participants.length;
  const isOrganizer = match?.organizer_id === user?.id || match?.created_by === user?.id;
  const isParticipant = !!user?.id && (
    participantsRaw.some(p => p.user_id === user.id) ||
    participants.some(p => p.id === user.id)
  );
  const isCompleted = match?.status === "completed";

  // Team match derived state
  const isTeamMatch = match?.is_team_match === true;
  const isOpenTeamMatch = isTeamMatch && !match?.team_b_id && match?.status === "upcoming";
  // Teams where user is captain or vice-captain, and isn't already team_a
  const captainTeams = myTeams.filter(t =>
    t.id !== match?.team_a_id &&
    (t.captain_id === user?.id || (t.vice_captain_ids || []).includes(user?.id))
  );
  const alreadyJoinedAsTeamB = isTeamMatch && match?.team_b_id && myTeams.some(t => t.id === match.team_b_id);

  // Individual join is disabled for team matches
  const canJoin = !isCupMatch && !isTeamMatch && !isParticipant && match?.status === "upcoming" && !isGuest && !isOrganizer;

  const handleJoinAsTeam = async (tid) => {
    const resolvedId = tid || teamJoinId;
    if (!resolvedId || isJoiningAsTeam) return;
    setIsJoiningAsTeam(true);
    try {
      await joinTeamMatchAsTeamB(matchId, resolvedId);
      queryClient.invalidateQueries({ queryKey: ["supabase-match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["team-matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches-infinite"] });
      feedback.success("Ditt lag har anslutit till matchen!");
    } catch (err) {
      feedback.error(err.message || "Kunde inte ansluta laget");
    } finally {
      setIsJoiningAsTeam(false);
    }
  };

  if (matchLoading || participantsLoading) return <PageLoadingSkeleton />;

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <DialogContainer />
        <Card className="max-w-2xl mx-auto p-12 text-center bg-[#121715] ring-1 ring-[#223029] rounded-3xl">
          <h2 className="text-xl font-bold text-[#F4F7F5] mb-2">{t('match_detail.not_found_title')}</h2>
          <p className="text-sm text-[#B6C2BC] mb-6">{t('match_detail.not_found_desc')}</p>
          <button
            onClick={() => navigate(createPageUrl("Matches"))}
            className="h-12 px-6 rounded-xl bg-[#2BA84A] hover:bg-[#34C257] text-white font-bold"
          >
            {t('match_detail.back')}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />

      <div className="max-w-5xl mx-auto space-y-5 p-4 sm:p-5 lg:p-8">
        {/* HERO */}
        <MatchHeroBanner
          match={match}
          venue={venue}
          participantCount={participantCount}
          isOrganizer={isOrganizer}
        />

        {/* STICKY ACTION BAR */}
        <MatchActionBar
          match={match}
          isParticipant={isParticipant}
          isOrganizer={isOrganizer}
          isAdmin={isAdmin}
          isCupMatch={isCupMatch}
          canJoin={canJoin}
          isCompleted={isCompleted}
          isActionLoading={isActionLoading}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onShare={() => setShowInviteModal(true)}
          onInvite={() => setShowInviteModal(true)}
          onCalendar={handleCalendar}
          onEnd={() => setShowEndModal(true)}
          onMvpVote={() => setShowEndModal(true)}
          onDelete={handleDelete}
          onShowPlayers={() => setShowPlayersModal(true)}
          checkInButton={
            isParticipant && match.status === "upcoming" ? (
              <CheckInButton
                match={match}
                isParticipant={isParticipant}
                onCheckInSuccess={() => queryClient.invalidateQueries({ queryKey: ["supabase-matchParticipants", matchId] })}
              />
            ) : null
          }
        />

        {/* TEAM MATCH BANNER */}
        {isTeamMatch && (
          <div className="bg-[#121715] ring-1 ring-[#223029] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-[#F4743B]" />
              <h2 className="text-sm font-bold text-[#F4F7F5] uppercase tracking-wider">Lagmatch</h2>
              {isOpenTeamMatch && (
                <span className="ml-auto text-[11px] bg-[#F4743B]/16 text-[#FDE3D2] border border-[#F4743B]/30 px-2 py-0.5 rounded-full font-semibold">
                  Söker motståndare
                </span>
              )}
              {alreadyJoinedAsTeamB && (
                <span className="ml-auto text-[11px] bg-[#2BA84A]/16 text-[#CFE8D6] border border-[#2BA84A]/30 px-2 py-0.5 rounded-full font-semibold">
                  Ditt lag har anslutit
                </span>
              )}
            </div>

            {/* Teams display */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-[#0F1513] rounded-xl p-2.5 text-center border border-[#223029]">
                <div className="text-[10px] text-[#7B8A83] font-bold uppercase mb-1">Lag A</div>
                <div className="text-[13px] font-bold text-[#F4F7F5]">{teamAName || 'Hemmalag'}</div>
              </div>
              <span className="text-[#7B8A83] font-black text-sm">VS</span>
              <div className={`flex-1 rounded-xl p-2.5 text-center border ${match.team_b_id ? 'bg-[#0F1513] border-[#223029]' : 'bg-[#18221E]/50 border-[#223029]/50'}`}>
                <div className="text-[10px] text-[#7B8A83] font-bold uppercase mb-1">Lag B</div>
                <div className={`text-[13px] font-bold ${match.team_b_id ? 'text-[#F4F7F5]' : 'text-[#7B8A83] italic'}`}>
                  {teamBName || (match.team_b_id ? 'Bortalag' : 'Ledig plats')}
                </div>
              </div>
            </div>

            {/* Join as team (captain/vice-captain only) */}
            {isOpenTeamMatch && captainTeams.length > 0 && (
              <div className="space-y-2">
                <p className="text-[12px] text-[#9EAAA4]">Välj ditt lag och anslut som motståndare:</p>
                {captainTeams.length > 1 && (
                  <div className="relative">
                    <select
                      value={teamJoinId || ''}
                      onChange={e => setTeamJoinId(e.target.value)}
                      className="w-full h-10 bg-[#0F1513] border border-[#223029] rounded-xl text-[#F4F7F5] text-[13px] px-3 pr-8 appearance-none focus:outline-none focus:border-[#2BA84A]/50"
                    >
                      <option value="">Välj lag...</option>
                      {captainTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EAAA4] pointer-events-none" />
                  </div>
                )}
                <button
                  onClick={() => handleJoinAsTeam(captainTeams.length === 1 ? captainTeams[0].id : teamJoinId)}
                  disabled={isJoiningAsTeam || (captainTeams.length > 1 && !teamJoinId)}
                  className="w-full h-11 bg-[#2BA84A] hover:bg-[#34C257] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-4 h-4" />
                  {isJoiningAsTeam ? 'Ansluter...' : `Anslut${captainTeams.length === 1 ? ` ${captainTeams[0].name}` : ' ditt lag'}`}
                </button>
              </div>
            )}

            {isOpenTeamMatch && captainTeams.length === 0 && !alreadyJoinedAsTeamB && (
              <p className="text-[12px] text-[#7B8A83] text-center py-1">
                Du måste vara kapten eller vice-kapten i ett lag för att ansluta.
              </p>
            )}
          </div>
        )}

        {/* CUP GOALS */}
        {isCupMatch && (
          <div className="rounded-2xl bg-[#121715] ring-1 ring-[#223029] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#223029]">
              <Trophy className="w-4 h-4 text-[#FBBF24]" />
              <h2 className="text-sm font-bold text-[#F4F7F5] uppercase tracking-wider">{t('match_detail.goals_title')}</h2>
            </div>
            <div className="p-5">
              <CupMatchGoals matchId={matchId} cupMatch={cupMatch} isAdmin={isAdmin} />
            </div>
          </div>
        )}

        {/* PARTICIPANTS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-[#86EFAC]" />
              <h2 className="text-sm font-bold text-[#F4F7F5] uppercase tracking-wider">
                {t('match_detail.participants_label')}
              </h2>
              <span className="text-xs font-bold text-[#9EAAA4] tabular-nums">
                {participantCount}{!match.is_spontaneous && match.max_players ? `/${match.max_players}` : ""}
              </span>
            </div>
          </div>
          <ParticipantGrid
            participants={participants}
            currentUserId={user?.id}
            maxPlayers={match.max_players}
            isSpontaneous={match.is_spontaneous}
            friendStatusMap={friendStatusMap}
            onAddFriend={handleAddFriend}
            onMvpVote={(userId) => { setShowEndModal(true); }}
            isCompleted={isCompleted}
            mvpUserId={match.mvp_user_id}
          />
        </section>

        {/* DETAILS SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Info className="w-4 h-4 text-[#86EFAC]" />
            <h2 className="text-sm font-bold text-[#F4F7F5] uppercase tracking-wider">{t('match_detail.matchinfo_label')}</h2>
          </div>
          <MatchDetailsCard match={match} venue={venue} />
        </section>

        {/* Report link */}
        {!isCupMatch && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#9EAAA4] hover:text-[#F87171] transition-colors"
            >
              <Flag className="w-3 h-3" />
              {t('match_detail.report_btn')}
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
      <LazyMatchEndModal
        show={showEndModal}
        match={match}
        participants={participants}
        currentUser={user}
        onClose={() => setShowEndModal(false)}
        onSubmit={handleEnd}
      />
      <LazyInviteFriendsModal
        show={showInviteModal}
        match={match}
        currentUser={user}
        onClose={() => setShowInviteModal(false)}
        onInvitesSent={() => {
          setShowInviteModal(false);
          feedback.success(t('match_detail.invites_sent'), { description: t('match_detail.invites_sent_desc') });
        }}
      />
      <LazyMatchReportModal
        show={showReportModal}
        match={match}
        currentUser={user}
        onClose={() => setShowReportModal(false)}
      />
      <MatchPlayersModal
        isOpen={showPlayersModal}
        onClose={() => setShowPlayersModal(false)}
        participants={participants}
        matchId={matchId}
        matchTitle={match?.title}
      />
    </div>
  );
}
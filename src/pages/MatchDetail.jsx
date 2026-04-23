import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users as UsersIcon, Flag, Info } from "lucide-react";
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
import { getVenues, getUsersByIds, getMyProfile } from "../components/supabase/services";
import { sendFriendRequest, getMyFriendships } from "../components/supabase/services/friendshipsService";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";

export default function MatchDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const matchId = new URLSearchParams(location.search).get("id");
  const queryClient = useQueryClient();

  const [showEndModal, setShowEndModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { confirm, alert, DialogContainer } = useCustomDialog();
  const { isGuest, isAuthenticated, user: authUser } = useSupabaseAuth();

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
        name: match._venue_name || match.venue_name || match.pitch_name || "Okänd plan",
        city: match._venue_city || match.venue_city || match.pitch_city,
        address: match._venue_address || match.venue_address || match.pitch_address,
        latitude: match._venue_lat || match.venue_lat || match.pitch_lat,
        longitude: match._venue_lng || match.venue_lng || match.pitch_lng,
      };
    }
    return venues.find(v => v.id === match.venue_id || v.id === match.pitch_id) || { name: "Okänd plan" };
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
      full_name: p.full_name || p.display_name || p.username || "Spelare",
      display_name: p.display_name || p.full_name || p.username || "Spelare",
      profile_image_url: p.profile_image_url || p.avatar_url,
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
      feedback.error("Kunde inte anmäla dig", { description: err.message || "Försök igen." });
    },
    onSuccess: () => {
      feedback.success("Du är med! ⚽", { description: `Anmäld till "${match?.title || "matchen"}"` });
    },
    onSettled: () => {
      setIsActionLoading(false);
      queryClient.invalidateQueries({ queryKey: ["supabase-matchParticipants", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches-infinite"] });
    }
  });

  const handleJoin = () => !isActionLoading && joinMatchMutation.mutate();

  const handleLeave = async () => {
    if (isActionLoading) return;
    const ok = await confirm("Lämna match", "Är du säker på att du vill lämna denna match?", {
      type: "warning", confirmText: "Ja, lämna", cancelText: "Avbryt"
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
      feedback.info("Du har lämnat matchen");
    } catch (error) {
      if (prev) queryClient.setQueryData(["supabase-matchParticipants", matchId], prev);
      feedback.error("Kunde inte lämna", { description: error.message || "Försök igen." });
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
      feedback.success("Match avslutad!", { description: "Resultaten har sparats." });
    } catch (error) {
      feedback.error("Kunde inte avsluta", { description: error.message || "Försök igen." });
    }
  };

  const handleAddFriend = async (participantId) => {
    try {
      const result = await sendFriendRequest(participantId);
      if (result.action === "created") {
        feedback.success("Vänförfrågan skickad 🤝");
      } else if (result.action === "accepted") {
        feedback.success("Ni är nu vänner! 🎉");
      } else if (result.action === "already_sent") {
        feedback.info("Vänförfrågan redan skickad");
      } else if (result.action === "already_friends") {
        feedback.info("Ni är redan vänner");
      }
      queryClient.invalidateQueries({ queryKey: ["friendships", user?.id] });
    } catch (error) {
      feedback.error("Kunde inte skicka", { description: error.message || "Försök igen." });
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
    const ok = await confirm("Ta bort match", "Detta kan inte ångras.", {
      type: "warning", confirmText: "Ja, ta bort", cancelText: "Avbryt"
    });
    if (!ok) return;
    setIsActionLoading(true);
    try {
      await deleteMatch(matchId);
      queryClient.invalidateQueries({ queryKey: ["matches-infinite"] });
      feedback.success("Match borttagen");
      navigate(createPageUrl("Matches"));
    } catch (error) {
      feedback.error("Kunde inte ta bort", { description: error.message || "Försök igen." });
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
      const venueName = venue?.name || "Okänd plats";
      const venueAddress = venue ? `${venue.address || ""}, ${venue.city || ""}` : "";
      const details = `Spela fotboll med AllPlay!\nMatch: ${match.title}\nFormat: ${match.format}\nPlats: ${venueName}\nLänk: ${window.location.href}`;
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
  const canJoin = !isCupMatch && !isParticipant && match?.status === "upcoming" && !isGuest && !isOrganizer;

  if (matchLoading || participantsLoading) return <PageLoadingSkeleton />;

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <DialogContainer />
        <Card className="max-w-2xl mx-auto p-12 text-center bg-[#121715] ring-1 ring-[#223029] rounded-3xl">
          <h2 className="text-xl font-bold text-[#F4F7F5] mb-2">Match hittades inte</h2>
          <p className="text-sm text-[#B6C2BC] mb-6">Matchen du söker existerar inte eller har tagits bort.</p>
          <button
            onClick={() => navigate(createPageUrl("Matches"))}
            className="h-12 px-6 rounded-xl bg-[#2BA84A] hover:bg-[#34C257] text-white font-bold"
          >
            Tillbaka till matcher
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

        {/* CUP GOALS */}
        {isCupMatch && (
          <div className="rounded-2xl bg-[#121715] ring-1 ring-[#223029] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#223029]">
              <Trophy className="w-4 h-4 text-[#FBBF24]" />
              <h2 className="text-sm font-bold text-[#F4F7F5] uppercase tracking-wider">Målöversikt</h2>
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
                Deltagare
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
            <h2 className="text-sm font-bold text-[#F4F7F5] uppercase tracking-wider">Matchinfo</h2>
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
              Rapportera problem med matchen
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
          feedback.success("Inbjudningar skickade!", { description: "Dina vänner har blivit inbjudna." });
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
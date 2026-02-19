import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Trophy,
  ArrowLeft,
  UserPlus,
  Share2,
  Flag,
  Target,
  TrendingUp,
  Shield,
  Crown,
  CheckCircle
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { LazyMatchEndModal, LazyInviteFriendsModal, LazyMatchReportModal } from "../components/matches/LazyMatchDetails";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import CupMatchGoals from "../components/cups/CupMatchGoals";
import CheckInButton from "../components/matches/CheckInButton";
import MatchPlayersModal from "../components/matches/MatchPlayersModal";
import { 
  joinMatch, 
  leaveMatch,
  deleteMatch,
  finishMatch,
  getMatchDetails,
  getMatchParticipants
} from "../components/supabase/services/matchesService";
import { getVenues, getUsersByIds, getMyProfile } from "../components/supabase/services";
import { getCachedUser, fetchUsersMissing } from "../components/supabase/services";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";

// CONSISTENT SKILL LEVEL CONFIG - WCAG AA compliant colors
const SKILL_LEVEL_CONFIG = {
  beginner: {
    label: 'Nybörjare',
    icon: Target,
    bgColor: 'bg-[#059669]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#10B981]/40'
  },
  intermediate: {
    label: 'Medel',
    icon: TrendingUp,
    bgColor: 'bg-[#0D9488]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#14B8A6]/40'
  },
  advanced: {
    label: 'Avancerad',
    icon: Shield,
    bgColor: 'bg-[#7C3AED]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#8B5CF6]/40'
  },
  elite: {
    label: 'Elit',
    icon: Crown,
    bgColor: 'bg-[#D97706]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#F59E0B]/40'
  }
};

// STATUS CONFIG - WCAG AA compliant with Royal Blue for upcoming
const STATUS_CONFIG = {
  upcoming: {
    label: 'Kommande',
    bgColor: 'bg-[#4169E1]', // Royal Blue
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#4169E1]/40'
  },
  ongoing: {
    label: 'Pågår',
    bgColor: 'bg-[#F59E0B]',
    textColor: 'text-[#000000]',
    ringColor: 'ring-[#F59E0B]/40'
  },
  completed: {
    label: 'Avslutad',
    bgColor: 'bg-[#6B7280]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#6B7280]/40'
  },
  cancelled: {
    label: 'Inställd',
    bgColor: 'bg-[#DC2626]',
    textColor: 'text-[#FFFFFF]',
    ringColor: 'ring-[#DC2626]/40'
  }
};

export default function MatchDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const matchId = new URLSearchParams(location.search).get('id');
  const queryClient = useQueryClient();

  const [showEndModal, setShowEndModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { confirm, alert, DialogContainer } = useCustomDialog();
  
  // Use Supabase auth state as source of truth
  const { isGuest, isAuthenticated, user: authUser } = useSupabaseAuth();

  // 1. Fetch Current User Profile from Supabase
  const { data: userProfile } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id
  });

  // Combine auth user with profile
  const user = React.useMemo(() => {
    if (!authUser) return null;
    return {
      ...authUser,
      ...userProfile,
      id: authUser.id
    };
  }, [authUser, userProfile]);

  const isAdmin = user?.role === 'admin';

  // Helper: normalize raw match data to UI format
  const normalizeMatch = (raw) => {
    if (!raw) return null;
    // If result is wrapped in { match: {...} }
    const m = raw.match || raw;
    
    let parsedDate = m.date;
    let parsedTime = m.time;
    if (m.starts_at && (!parsedDate || !parsedTime)) {
      const startsAt = new Date(m.starts_at);
      parsedDate = parsedDate || startsAt.toISOString().split('T')[0];
      parsedTime = parsedTime || startsAt.toTimeString().substring(0, 5);
    }
    return {
      ...m,
      status: (m.status === 'finished' || m.status === 'ended') ? 'completed' : m.status,
      skill_bracket: m.level || m.skill_bracket,
      venue_id: m.venue_id || m.pitch_id,
      title: m.title || m.name || 'Match',
      date: parsedDate,
      time: parsedTime,
      duration_minutes: m.duration_minutes || m.duration || 90,
      max_players: m.max_players || m.capacity,
      organizer_id: m.organizer_id || m.created_by,
    };
  };

  // 2. Fetch Match Data - try Edge Function, fallback to Base44
  const { data: matchData, isLoading: matchLoading, error: matchError } = useQuery({
    queryKey: ['supabase-match', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      
      // Try Supabase Edge Function first
      try {
        const result = await getMatchDetails(matchId);
        if (result) return normalizeMatch(result);
      } catch (error) {
        console.warn('[MatchDetail] Edge function failed, falling back to Base44:', error.message);
      }
      
      // Fallback: load from Base44 entities
      try {
        const matches = await base44.entities.Match.filter({ id: matchId });
        if (matches && matches.length > 0) return normalizeMatch(matches[0]);
      } catch (e) {
        console.error('[MatchDetail] Base44 fallback also failed:', e.message);
      }
      
      return null;
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!matchId,
    retry: 1
  });

  const match = matchData;

  // Check if this is a cup match
  const isCupMatch = match?.is_cup_match || false;

  // Fetch CupMatch to get cup_id for navigation (keeping Base44 for cups for now)
  const { data: cupMatch } = useQuery({
    queryKey: ['cupMatch', matchId],
    queryFn: async () => {
      const cupMatches = await base44.entities.CupMatch.filter({ match_id: matchId });
      return cupMatches[0] || null;
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!matchId && isCupMatch
  });

  // 3. Fetch Venues from Supabase
  const { data: venues = [] } = useQuery({
    queryKey: ['supabase-venues'],
    queryFn: () => getVenues(),
    ...CACHE_STRATEGIES.STATIC,
  });

  // Find venue from venues list or use embedded data
  const venue = React.useMemo(() => {
    if (!match) return null;
    
    // First check for embedded venue data (from Edge Function or view)
    if (match._venue_name || match.venue_name || match.pitch_name) {
      return {
        name: match._venue_name || match.venue_name || match.pitch_name || 'Okänd plan',
        city: match._venue_city || match.venue_city || match.pitch_city,
        address: match._venue_address || match.venue_address || match.pitch_address,
        latitude: match._venue_lat || match.venue_lat || match.pitch_lat,
        longitude: match._venue_lng || match.venue_lng || match.pitch_lng,
      };
    }
    
    // Try to find in venues list
    const venueFromList = venues.find(v => v.id === match.venue_id || v.id === match.pitch_id);
    if (venueFromList) return venueFromList;
    
    return { name: 'Okänd plan' };
  }, [match, venues]);

  // 4. Fetch Participants - try Edge Function, fallback to Base44
  const { data: participantsRaw = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['supabase-matchParticipants', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      
      // Try Supabase Edge Function first
      try {
        const parts = await getMatchParticipants(matchId);
        if (Array.isArray(parts)) return parts;
        if (parts && typeof parts === 'object' && !Array.isArray(parts)) return [parts];
      } catch (error) {
        console.warn('[MatchDetail] Edge participants failed, falling back to Base44:', error.message);
      }
      
      // Fallback: load from Base44 entities
      try {
        const parts = await base44.entities.MatchParticipant.filter({ match_id: matchId });
        return Array.isArray(parts) ? parts : [];
      } catch (e) {
        console.error('[MatchDetail] Base44 participants fallback failed:', e.message);
      }
      
      return [];
    },
    ...CACHE_STRATEGIES.DYNAMIC,
    enabled: !!matchId
  });

  // Fetch user data for participants
  const participantUserIds = React.useMemo(() => {
    // CRITICAL: Ensure participantsRaw is array
    if (!Array.isArray(participantsRaw)) {
      console.error('[MatchDetail] participantsRaw is not array:', typeof participantsRaw);
      return [];
    }
    return [...new Set(participantsRaw.map(p => p.user_id).filter(Boolean))];
  }, [participantsRaw]);

  const { data: participantUsers = [] } = useQuery({
    queryKey: ['supabase-participantUsers', participantUserIds],
    queryFn: () => getUsersByIds(participantUserIds),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: participantUserIds.length > 0
  });

  // Merge participants with user data
  const participants = React.useMemo(() => {
    const usersArray = Array.isArray(participantUsers) ? participantUsers : [];
    const rawArray = Array.isArray(participantsRaw) ? participantsRaw : [];
    
    // If we have user data, merge with participant info
    if (usersArray.length > 0) {
      return usersArray.map(u => {
        const participantInfo = rawArray.find(p => p.user_id === u.id);
        return { ...u, participantInfo };
      });
    }
    
    // If no user data fetched yet but we have raw participants, show them with minimal info
    return rawArray.map(p => ({
      id: p.user_id,
      full_name: p.full_name || p.display_name || p.username || 'Spelare',
      display_name: p.display_name || p.full_name || p.username || 'Spelare',
      profile_image_url: p.profile_image_url || p.avatar_url,
      city: p.city,
      participantInfo: p,
    }));
  }, [participantUsers, participantsRaw]);

  // 5. Fetch Friendships (keeping Base44 for friendships for now - can be migrated later)
  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: user.id }),
        base44.entities.Friendship.filter({ addressee_id: user.id })
      ]);
      return [...sent, ...received];
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user?.id
  });

  const joinMatchMutation = useMutation({
    mutationFn: () => joinMatch(matchId),
    onMutate: async () => {
      setIsActionLoading(true);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['supabase-matchParticipants', matchId] });
      
      // Snapshot previous value
      const previousParticipants = queryClient.getQueryData(['supabase-matchParticipants', matchId]);
      
      // Optimistically add current user to participants
      if (user) {
        queryClient.setQueryData(['supabase-matchParticipants', matchId], (old = []) => [
          ...old,
          { user_id: user.id, match_id: matchId, status: 'registered' }
        ]);
      }
      
      return { previousParticipants };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousParticipants) {
        queryClient.setQueryData(['supabase-matchParticipants', matchId], context.previousParticipants);
      }
      // Map specific errors to Swedish
      const msg = error.message || 'Det gick inte att gå med i matchen. Försök igen.';
      alert('Kunde inte anmäla dig', msg, { type: 'alert' });
    },
    onSuccess: () => {
      alert('Du är med i matchen! ⚽', `Du har anmält dig till "${match?.title || 'matchen'}". Vi ses där!`, { type: 'success' });
    },
    onSettled: () => {
      setIsActionLoading(false);
      queryClient.invalidateQueries({ queryKey: ['supabase-matchParticipants', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
    }
  });

  const handleJoinMatch = async () => {
    if (isActionLoading) return;
    joinMatchMutation.mutate();
  };

  const handleLeaveMatch = async () => {
    if (isActionLoading) return;
    try {
      const shouldLeave = await confirm(
        'Lämna match',
        'Är du säker på att du vill lämna denna match?',
        { type: 'warning', confirmText: 'Ja, lämna', cancelText: 'Avbryt' }
      );

      if (!shouldLeave) return;

      setIsActionLoading(true);
      console.log('[MatchDetail] leaveMatch called for matchId:', matchId, 'userId:', user?.id);
      
      // Optimistic update: remove user from participants cache
      const prevParticipants = queryClient.getQueryData(['supabase-matchParticipants', matchId]);
      if (user?.id) {
        queryClient.setQueryData(['supabase-matchParticipants', matchId], (old = []) =>
          old.filter(p => p.user_id !== user.id)
        );
      }

      try {
        await leaveMatch(matchId);
        console.log('[MatchDetail] leaveMatch success');
      } catch (error) {
        // Rollback optimistic update on failure
        console.error('[MatchDetail] leaveMatch failed, rolling back:', error);
        if (prevParticipants) {
          queryClient.setQueryData(['supabase-matchParticipants', matchId], prevParticipants);
        }
        throw error;
      }

      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ['supabase-matchParticipants', matchId] });
      queryClient.invalidateQueries({ queryKey: ['supabase-match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-participantMatchIds'] });

      await alert('Match lämnad', 'Du har lämnat matchen', { type: 'info' });

    } catch (error) {
      console.error("[MatchDetail] Error leaving match:", error);
      const msg = error.status === 401
        ? 'Du måste vara inloggad.'
        : (error.message || 'Det gick inte att lämna matchen. Försök igen.');
      await alert('Kunde inte lämna matchen', msg, { type: 'alert' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMatchEnd = async (resultData) => {
    try {
      // Use finish_match Edge Function
      await finishMatch(matchId, {
        home_score: resultData?.home_score ?? resultData?.teamAScore,
        away_score: resultData?.away_score ?? resultData?.teamBScore,
        notes: resultData?.notes || resultData?.matchFeedback
      });

      setShowEndModal(false);
      queryClient.invalidateQueries({ queryKey: ['supabase-match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['supabase-matchParticipants', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      
      await alert("Match avslutad!", "Resultaten har sparats.", { type: 'success' });

    } catch (error) {
      console.error("Error ending match:", error);
      const msg = error.status === 403 
        ? 'Endast arrangören kan avsluta matchen.' 
        : error.status === 401 
          ? 'Du måste vara inloggad.' 
          : (error.message || 'Det gick inte att avsluta matchen. Försök igen.');
      await alert("Kunde inte avsluta match", msg, { type: 'alert' });
    }
  };

  const addFriendMutation = useMutation({
    mutationFn: (participantId) => base44.entities.Friendship.create({
      requester_id: user.id,
      addressee_id: participantId,
      status: 'pending'
    }),
    onMutate: async (participantId) => {
      setIsActionLoading(true);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['friendships', user.id] });
      
      // Snapshot previous value
      const previousFriendships = queryClient.getQueryData(['friendships', user.id]);
      
      // Optimistically add friendship
      queryClient.setQueryData(['friendships', user.id], (old = []) => [
        ...old,
        {
          requester_id: user.id,
          addressee_id: participantId,
          status: 'pending',
          id: 'temp-' + Date.now()
        }
      ]);
      
      return { previousFriendships };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFriendships) {
        queryClient.setQueryData(['friendships', user.id], context.previousFriendships);
      }
      alert('Kunde inte skicka vänförfrågan', error.message || 'Försök igen.', { type: 'alert' });
    },
    onSuccess: () => {
      alert('Vänförfrågan skickad! 🤝', 'Din vänförfrågan har skickats!', { type: 'success' });
    },
    onSettled: () => {
      setIsActionLoading(false);
      queryClient.invalidateQueries({ queryKey: ['friendships', user.id] });
    }
  });

  const handleAddFriend = async (participantId) => {
    if (isActionLoading) return;
    
    const existing = friendships.find(f =>
      (f.requester_id === user.id && f.addressee_id === participantId) ||
      (f.requester_id === participantId && f.addressee_id === user.id)
    );

    if (existing) {
      if (existing.status === 'accepted') {
        await alert('Redan vänner', 'Ni är redan vänner!', { type: 'info' });
      } else if (existing.status === 'pending') {
        await alert('Vänförfrågan skickad', 'Du har redan skickat en vänförfrågan!', { type: 'info' });
      }
      return;
    }

    addFriendMutation.mutate(participantId);
  };

  const getFriendStatus = (participantId) => {
    if (!user?.id || !friendships || participantId === user?.id) return null;

    const friendship = friendships.find(f =>
      (f.requester_id === user?.id && f.addressee_id === participantId) ||
      (f.requester_id === participantId && f.addressee_id === user?.id)
    );

    if (!friendship) return 'none';
    if (friendship.status === 'accepted') return 'friends';
    if (friendship.status === 'pending') {
      return friendship.requester_id === user?.id ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  };

  const handleDeleteMatch = async () => {
    if (isActionLoading) return;

    try {
      const shouldDelete = await confirm(
        'Ta bort match',
        'Är du säker på att du vill ta bort denna match? Detta kan inte ångras.',
        { type: 'warning', confirmText: 'Ja, ta bort', cancelText: 'Avbryt' }
      );

      if (!shouldDelete) return;

      setIsActionLoading(true);
      // Use deleteMatch service method
      await deleteMatch(matchId);

      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-match', matchId] });
      
      await alert('Match borttagen', 'Matchen har tagits bort', { type: 'success' });
      navigate(createPageUrl("Matches"));

    } catch (error) {
      console.error("Error deleting match:", error);
      const msg = error.status === 403 
        ? 'Endast arrangören kan radera matchen.' 
        : error.status === 401 
          ? 'Du måste vara inloggad.' 
          : (error.message || 'Det gick inte att radera matchen. Försök igen.');
      await alert('Kunde inte ta bort matchen', msg, { type: 'alert' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const generateGoogleCalendarUrl = () => {
    if (!match) return '';
    if (typeof match.date !== 'string' || typeof match.time !== 'string' || !match.date || !match.time) return '';
    try {
      const [year, month, day] = match.date.split('-');
      const [hour, minute] = match.time.split(':');
      const startDate = new Date(year, month - 1, day, hour, minute);
      const endDate = new Date(startDate.getTime() + (match.duration_minutes || 90) * 60000);
      
      const formatTime = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
      const start = formatTime(startDate);
      const end = formatTime(endDate);
      
      const venueName = venue?.name || 'Okänd plats';
      const venueAddress = venue ? `${venue.address}, ${venue.city}` : '';
      
      const details = `Spela fotboll med AllPlay!\nMatch: ${match.title}\nFormat: ${match.format}\nPlats: ${venueName}\nLänk: ${window.location.href}`;
      const location = venueAddress || venueName;
      
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(match.title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    } catch (e) {
      return '#';
    }
  };

  // Participant count: prefer raw data length (loads before user enrichment)
  const participantCount = Array.isArray(participantsRaw) && participantsRaw.length > 0
    ? participantsRaw.length
    : (Array.isArray(participants) ? participants.length : 0);

  const isLoading = matchLoading || participantsLoading;

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
        <DialogContainer />
        <Card className="max-w-2xl mx-auto p-12 text-center bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
          <h2 className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] mb-4">Match hittades inte</h2>
          <p className="text-[14px] leading-[20px] text-[#B6C2BC] mb-6">Matchen du söker existerar inte eller har tagits bort.</p>
          <Button
            onClick={() => navigate(createPageUrl("Matches"))}
            className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] font-semibold"
          >
            Tillbaka till Matcher
          </Button>
        </Card>
      </div>
    );
  }

  const isOrganizer = match.organizer_id === user?.id || match.created_by === user?.id;
  
  // CRITICAL: Safe participant check - check both p.id (enriched) and p.user_id (raw) for reliability
  const isParticipant = !!user?.id && Array.isArray(participantsRaw) && participantsRaw.some(p => p.user_id === user.id);
  
  // UI-level check only - backend validates actual join permission
  // Also check enriched participants (p.id) as fallback
  const isParticipantEnriched = !!user?.id && Array.isArray(participants) && participants.some(p => p.id === user.id);
  const canJoin = !isCupMatch && !isParticipant && !isParticipantEnriched && match.status === 'upcoming' && !isGuest && !isOrganizer;
  const isCompleted = match.status === 'completed';

  const statusConfig = STATUS_CONFIG[match.status] || STATUS_CONFIG.upcoming;
  const skillConfig = match.skill_bracket ? SKILL_LEVEL_CONFIG[match.skill_bracket] : null;
  const SkillIcon = skillConfig?.icon;

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />

      <div className="max-w-7xl mx-auto space-y-6 p-4 lg:p-8">

        {/* Desktop Back Button */}
        <button
          onClick={() => {
            if (isCupMatch && cupMatch?.cup_id) {
              navigate(`${createPageUrl("CupDetail")}?cup_id=${cupMatch.cup_id}`);
            } else {
              navigate(createPageUrl("Matches"));
            }
          }}
          className="hidden lg:inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] px-4 text-[#F4F7F5] hover:bg-[#18221E] transition-all font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>

        {/* Match Header - COMPLETION STATE */}
        {isCompleted && !isCupMatch ? (
          <Card className="overflow-hidden border-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[24px] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F1513] to-[#121715]"></div>
            
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#F4743B]/20 to-[#E5683A]/10"></div>
            
            <CardContent className="p-0 relative z-10">
              <div className="text-center pt-10 pb-8 px-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F4743B] to-[#D97706] shadow-xl mb-4 rotate-3 ring-4 ring-[#121715]">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">{match.title}</h1>
                <div className="flex items-center justify-center gap-2 text-[#B6C2BC] text-sm font-medium mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>{match.date}</span>
                  <span>•</span>
                  <span className="text-[#2BA84A]">Avslutad</span>
                </div>

                {(match.final_score || match.home_score !== undefined) && (
                  <div className="mb-8">
                    <div className="inline-block px-8 py-4 bg-[#18221E] rounded-2xl border border-[#223029] shadow-inner">
                      <div className="text-xs text-[#9EAAA4] font-bold uppercase tracking-widest mb-1">Resultat</div>
                      <div className="text-5xl font-black text-white tracking-tight">
                        {match.final_score || `${match.home_score ?? '?'}-${match.away_score ?? '?'}`}
                      </div>
                    </div>
                  </div>
                )}
                {!match.final_score && match.home_score === undefined && (
                  <div className="mb-8 px-4 py-3 bg-[#18221E]/50 rounded-xl border border-[#223029]">
                    <p className="text-sm text-[#9EAAA4]">Inget resultat inlagt</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
                  <div className="bg-[#18221E]/50 p-4 rounded-2xl border border-[#223029]">
                    <div className="text-[#B6C2BC] text-xs font-bold uppercase mb-1">MVP</div>
                    <div className="text-[#F4743B] font-bold text-lg truncate">
                      {match.result_reported_by === user?.id ? 'Du rapporterade' : 'Se deltagare'}
                    </div>
                  </div>
                  <div className="bg-[#18221E]/50 p-4 rounded-2xl border border-[#223029]">
                    <div className="text-[#B6C2BC] text-xs font-bold uppercase mb-1">Deltagare</div>
                    <div className="text-white font-bold text-lg">{participantCount} spelare</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {isParticipant && (
                    <button
                      onClick={() => setShowEndModal(true)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2BA84A] px-8 text-white font-bold hover:bg-[#248232] transition-all shadow-lg hover:scale-105"
                    >
                      <Crown className="w-5 h-5" />
                      Rösta på MVP
                    </button>
                  )}
                  <button
                    onClick={() => setShowPlayersModal(true)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F4743B] px-8 text-white font-bold hover:bg-[#E5683A] transition-all shadow-lg hover:scale-105"
                  >
                    <Users className="w-5 h-5" />
                    Matchens spelare
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isCompleted && isCupMatch ? (
          <Card className="overflow-hidden border-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[24px] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F1513] to-[#121715]"></div>
            
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#F59E0B]/20 to-[#D97706]/10"></div>
            
            <CardContent className="p-0 relative z-10">
              <div className="text-center pt-10 pb-8 px-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-xl mb-4 rotate-3 ring-4 ring-[#121715]">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">{match.title}</h1>
                <div className="flex items-center justify-center gap-2 text-[#B6C2BC] text-sm font-medium mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>{match.date}</span>
                  <span>•</span>
                  <span className="text-[#F59E0B]">Cupmatch Avslutad</span>
                </div>

                {match.final_score && (
                  <div className="mb-8">
                    <div className="inline-block px-8 py-4 bg-[#18221E] rounded-2xl border border-[#223029] shadow-inner">
                      <div className="text-xs text-[#9EAAA4] font-bold uppercase tracking-widest mb-1">Slutresultat</div>
                      <div className="text-5xl font-black text-white tracking-tight">{match.final_score}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
        <Card className="bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029] relative overflow-hidden">
          
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-[#248232]/30 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/10 rounded-full pointer-events-none animate-[spin_15s_linear_infinite_reverse]"></div>

          <CardContent className="p-6 lg:p-8 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className={`h-8 px-4 ${statusConfig.bgColor} ${statusConfig.textColor} ring-1 ${statusConfig.ringColor} font-semibold`}>
                    {statusConfig.label}
                  </Badge>

                  {skillConfig && (
                    <Badge className={`h-8 px-4 ${skillConfig.bgColor} ${skillConfig.textColor} ring-1 ${skillConfig.ringColor} font-semibold flex items-center gap-1.5`}>
                      {SkillIcon && <SkillIcon className="w-4 h-4" />}
                      {skillConfig.label}
                    </Badge>
                  )}

                  {isOrganizer && (
                    <Badge className="h-8 px-4 bg-[#F4743B] text-[#FFFFFF] ring-1 ring-[#F4743B]/40 font-semibold">
                      Arrangör
                    </Badge>
                  )}
                </div>

                <h1 className="text-[28px] leading-[34px] lg:text-[32px] lg:leading-[40px] font-semibold text-[#EAF6EE] mb-6">
                  {match.title}
                </h1>

                <div className="space-y-3 text-[#CFE8D6]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[14px] leading-[20px]">{venue?.name || 'Okänd plats'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[14px] leading-[20px]">{match.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[14px] leading-[20px]">{match.time} ({match.duration_minutes || 90} min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                   <Users className="w-5 h-5 flex-shrink-0" />
                   <span className="text-[14px] leading-[20px]">
                     {match.is_spontaneous
                       ? `${participantCount} anmälda (spontan match)`
                       : `${participantCount}/${match.max_players} spelare`
                     }
                   </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[220px]">
                {!isCupMatch && (
                  <button
                     onClick={() => setShowReportModal(true)}
                     className="text-xs text-[#F4743B] hover:underline text-right mb-2"
                  >
                    Rapportera problem
                  </button>
                )}
                {isCupMatch && match.status === 'upcoming' && (
                  <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-center">
                    <p className="text-sm font-bold text-[#FCD34D] mb-1">Cupmatch</p>
                    <p className="text-xs text-[#B6C2BC]">Endast admin-styrd</p>
                  </div>
                )}
                {canJoin && (
                  <>
                    <button
                      onClick={handleJoinMatch}
                      disabled={isActionLoading}
                      className={`inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF] px-6 text-[#2BA84A] font-semibold hover:bg-[#EAF6EE] transition-all hover:scale-[1.02] ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isActionLoading ? <div className="w-5 h-5 border-2 border-[#2BA84A] border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-5 h-5" />}
                      {isActionLoading ? 'Vänta...' : 'Anmäl dig'}
                    </button>
                  </>
                )}

                {(isParticipant || isParticipantEnriched) && match.status === 'upcoming' && (
                  <>
                    <CheckInButton
                      match={match}
                      isParticipant={isParticipant}
                      onCheckInSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['supabase-matchParticipants', matchId] });
                      }}
                    />

                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/10 backdrop-blur-sm px-4 text-[#FFFFFF] font-semibold border border-[#FFFFFF]/30 hover:bg-[#FFFFFF]/20 transition-all"
                      >
                        <Share2 className="w-5 h-5" />
                        Bjud in
                      </button>
                      
                      <a
                        href={generateGoogleCalendarUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/10 backdrop-blur-sm px-4 text-[#FFFFFF] font-semibold border border-[#FFFFFF]/30 hover:bg-[#FFFFFF]/20 transition-all"
                      >
                        <Calendar className="w-5 h-5" />
                        Kalender
                      </a>
                    </div>

                    <button
                      onClick={handleLeaveMatch}
                      disabled={isActionLoading}
                      className={`inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#FFFFFF]/30 px-6 text-[#FFFFFF] font-semibold hover:bg-[#FFFFFF]/10 transition-all ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isActionLoading ? 'Lämnar...' : 'Lämna match'}
                    </button>
                  </>
                )}

                {isOrganizer && match.status === 'upcoming' && (
                  <>
                    <button
                      onClick={() => setShowEndModal(true)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#F4743B] px-6 text-[#FFFFFF] font-semibold hover:bg-[#E5683A] transition-all"
                    >
                      <Trophy className="w-5 h-5" />
                      Avsluta match
                    </button>
                    <button
                      onClick={handleDeleteMatch}
                      disabled={isActionLoading}
                      className={`inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#DC2626]/40 px-6 text-[#DC2626] font-semibold hover:bg-[#DC2626]/10 transition-all ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isActionLoading ? 'Tar bort...' : 'Radera match'}
                    </button>
                  </>
                )}

                {isAdmin && !isOrganizer && (
                  <button
                    onClick={handleDeleteMatch}
                    disabled={isActionLoading}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#DC2626] px-6 text-[#FFFFFF] font-semibold hover:bg-[#B91C1C] transition-all ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isActionLoading ? 'Tar bort...' : 'Ta bort match (Admin)'}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Conditional Tabs based on match type */}
        {isCupMatch ? (
          <div className="space-y-6">
            {/* Cup Match Goals Timeline */}
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
              <CardHeader className="border-b border-[#223029]">
                <CardTitle className="text-[#F4F7F5] text-[18px] leading-[24px] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#F59E0B]" />
                  Målöversikt
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CupMatchGoals matchId={matchId} cupMatch={cupMatch} isAdmin={isAdmin} />
              </CardContent>
            </Card>

            {/* Match Details */}
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
              <CardHeader className="border-b border-[#223029]">
                <CardTitle className="text-[#F4F7F5] text-[18px] leading-[24px]">Matchdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Format</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{match.format}</div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Typ</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">Cupmatch</div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Status</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{statusConfig.label}</div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Plats</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{venue?.address || 'Okänd adress'}</div>
                  </div>
                </div>

                {match.notes && (
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Anteckningar</div>
                    <p className="text-[14px] leading-[20px] text-[#F4F7F5]">{match.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="participants" className="space-y-6">
            <TabsList className="bg-[#121715] p-1 border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] grid grid-cols-2 w-full rounded-[16px]">
              <TabsTrigger
              value="participants"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold rounded-[14px] transition-all"
              >
              <Users className="w-4 h-4" />
              Deltagare ({participantCount})
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold rounded-[14px] transition-all"
              >
                <Flag className="w-4 h-4" />
                Detaljer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participants">
            {!Array.isArray(participants) || participants.length === 0 ? (
              <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] p-12 text-center">
                <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#9FC9AC]" />
                </div>
                <h3 className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] mb-2">Inga deltagare än</h3>
                <p className="text-[14px] leading-[20px] text-[#B6C2BC]">Bli den första att anmäla dig!</p>
              </Card>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-[#B6C2BC]">
                   {Array.isArray(participants) ? participants.filter(p => p.participantInfo?.checked_in).length : 0} av {participantCount} spelare checkade in
                  </p>
                </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(participants) && participants.map((participant) => {
                  if (!participant) return null;
                  const participantSkill = participant.skill_level ? SKILL_LEVEL_CONFIG[participant.skill_level] : null;
                  const ParticipantSkillIcon = participantSkill?.icon;
                  const friendStatus = getFriendStatus(participant.id);
                  const isCurrentUser = participant.id === user?.id;

                  return (
                    <Card key={participant.id} className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] hover:scale-[1.02] hover:border-[#2BA84A]/30 transition-all">
                      <CardContent className="p-4">
                        <Link
                          to={`${createPageUrl("Profile")}?userId=${participant.id}`}
                          className="block mb-3 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                {participant.profile_image_url ? (
                                  <img src={participant.profile_image_url} alt={participant.display_name || participant.full_name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  <span className="text-[#FFFFFF] font-semibold text-lg">{(participant.display_name || participant.full_name)?.[0] || 'U'}</span>
                                )}
                              </div>
                              {participant.participantInfo?.checked_in && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2BA84A] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-[#F4F7F5] text-[14px] leading-[20px] truncate group-hover:text-[#2BA84A] transition-colors">{participant.display_name || participant.full_name}</h4>
                                {participant.participantInfo?.checked_in && (
                                  <span className="text-[10px] font-bold text-[#2BA84A] bg-[#2BA84A]/10 px-2 py-0.5 rounded-full">PÅ PLATS</span>
                                )}
                              </div>
                              <p className="text-[12px] leading-[16px] text-[#B6C2BC]">{participant.city}</p>
                            </div>
                          </div>
                        </Link>

                        {participantSkill && (
                          <Badge className={`w-full justify-center py-1.5 ${participantSkill.bgColor} ${participantSkill.textColor} ring-1 ${participantSkill.ringColor} rounded-[10px] text-[12px] leading-[16px] font-semibold flex items-center gap-1.5 mb-3`}>
                            {ParticipantSkillIcon && <ParticipantSkillIcon className="w-3.5 h-3.5" />}
                            {participantSkill.label}
                          </Badge>
                        )}

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-[#0F1513] rounded-[10px] p-2 text-center">
                            <div className="text-[12px] leading-[16px] text-[#B6C2BC] mb-1">Matcher</div>
                            <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{participant.matches_played || 0}</div>
                          </div>
                          <div className="bg-[#0F1513] rounded-[10px] p-2 text-center">
                            <div className="text-[12px] leading-[16px] text-[#B6C2BC] mb-1">MVPs</div>
                            <div className="text-[16px] leading-[24px] font-semibold text-[#F4743B]">{participant.mvp_count || 0}</div>
                          </div>
                        </div>

                        {isCompleted && !isCurrentUser && (
                          <div className="pt-3 mt-3 border-t border-[#223029]">
                            {friendStatus === 'none' && (
                              <button
                                onClick={() => handleAddFriend(participant.id)}
                                className="w-full h-9 flex items-center justify-center gap-2 rounded-[10px] bg-[#2BA84A]/16 text-[#CFE8D6] text-sm font-semibold ring-1 ring-[#2BA84A]/30 hover:bg-[#2BA84A]/24 transition-all"
                              >
                                <UserPlus className="w-4 h-4" />
                                Lägg till vän
                              </button>
                            )}
                            {friendStatus === 'friends' && (
                              <div className="w-full h-9 flex items-center justify-center gap-2 rounded-[10px] bg-[#2BA84A]/10 text-[#2BA84A] text-sm font-semibold">
                                <Users className="w-4 h-4" />
                                Vänner
                              </div>
                            )}
                            {friendStatus === 'pending_sent' && (
                              <div className="w-full h-9 flex items-center justify-center gap-2 rounded-[10px] bg-[#18221E] text-[#B6C2BC] text-sm font-semibold">
                                <Clock className="w-4 h-4" />
                                Förfrågan skickad
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="details">
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
              <CardHeader className="border-b border-[#223029]">
                <CardTitle className="text-[#F4F7F5] text-[18px] leading-[24px]">Matchdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Format</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{match.format}</div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Typ</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">
                      {match.is_spontaneous ? 'Spontan match' : 'Organiserad match'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Status</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{statusConfig.label}</div>
                  </div>
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Plats</div>
                    <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">{venue?.address || 'Okänd adress'}</div>
                  </div>
                </div>

                {match.notes && (
                  <div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2">Anteckningar</div>
                    <p className="text-[14px] leading-[20px] text-[#F4F7F5]">{match.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
          )}
          </div>

      <LazyMatchEndModal
        show={showEndModal}
        match={match}
        participants={participants}
        currentUser={user}
        onClose={() => setShowEndModal(false)}
        onSubmit={handleMatchEnd}
      />

      <LazyInviteFriendsModal
        show={showInviteModal}
        match={match}
        currentUser={user}
        onClose={() => setShowInviteModal(false)}
        onInvitesSent={async () => {
          setShowInviteModal(false);
          await alert('Inbjudningar skickade!', 'Dina vänner har blivit inbjudna till matchen.', { type: 'success' });
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
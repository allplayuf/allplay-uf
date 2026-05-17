import React, { useState, useEffect, Suspense, lazy } from "react";
import { useSEO } from "@/components/hooks/useSEO";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getUsersByIds, getUserById } from "../components/supabase/services/usersService";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { TRANSITIONS, triggerHaptic } from "../components/utils/motionTokens";
import { TabSkeleton, TabSkeletonGrid } from "../components/ui/tab-skeleton";
import {
  Trophy,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Edit,
  Camera,
  Target,
  QrCode,
  Crown,
  Settings,
  Users,
  Shield,
  UserPlus,
  CheckCircle,
  Clock,
  LogOut,
  Flag,
  Ban,
  MoreVertical
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { ProfileSkeleton } from "../components/ui/loading-skeleton";
import ReportModal from "../components/report/ReportModal";
import BlockUserButton from "../components/user/BlockUserButton";
import { PullToRefresh } from "../components/ui/pull-to-refresh";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import feedback from "../components/ui/feedback-toast";
import { useT } from "@/i18n/LanguageProvider";
import { LoginModal } from "../components/supabase";
import { LogIn } from "lucide-react";
import {
  getMyProfile, updateProfile,
  getMyFriendships, sendFriendRequest, acceptFriendRequest,
  declineFriendRequest, removeFriendship, getFriendshipStatus
} from "../components/supabase/services";
import { getMyMatches, transformMatchData } from "../components/supabase/services/matchesQueries";
import { supabaseClient } from "../components/supabase/client";

// Lazy load components
const ProfileStats = lazy(() => import("../components/profile/ProfileStats"));
const BadgeCollection = lazy(() => import("../components/profile/BadgeCollection"));
const MatchHistory = lazy(() => import("../components/profile/MatchHistory"));
const InboxNotifications = lazy(() => import("../components/profile/InboxNotifications"));
const QRModal = lazy(() => import("../components/profile/QRModal"));
const SettingsSheet = lazy(() => import("../components/profile/SettingsSheet"));
const OtherProfileView = lazy(() => import("../components/profile/OtherProfileView"));
import ProfileHero from "../components/profile/ProfileHero";

const SKILL_LEVEL_ICONS = {
  beginner: Target,
  intermediate: TrendingUp,
  advanced: Shield,
  elite: Crown,
};
const SKILL_LEVEL_COLORS = {
  beginner: { color: 'from-[#10B981] to-[#059669]', textColor: 'text-[#A7F3D0]' },
  intermediate: { color: 'from-[#14B8A6] to-[#0D9488]', textColor: 'text-[#99F6E4]' },
  advanced: { color: 'from-[#8B5CF6] to-[#7C3AED]', textColor: 'text-[#DDD6FE]' },
  elite: { color: 'from-[#F59E0B] to-[#D97706]', textColor: 'text-[#FDE68A]' },
};

// Query keys
const QUERY_KEYS = {
  user: ['user'],
  targetUser: (userId) => ['targetUser', userId],
  friendships: ['friendships'],
  friendRequests: (userId) => ['friendRequests', userId],
  teamInvites: (userId) => ['teamInvites', userId],
  teamJoinRequests: (userId) => ['teamJoinRequests', userId],
  friends: (userId) => ['friends', userId],
  matchHistory: (userId) => ['matchHistory', userId]
};

export default function ProfilePage() {
  useSEO({ title: 'Profil', description: 'Hantera din profil, statistik och inställningar på AllPlay UF.' });
  const { t } = useT();
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { isGuest, isAuthenticated, user: authUser } = useSupabaseAuth();

  const urlParams = new URLSearchParams(location.search);
  const targetUserId = urlParams.get('userId');

  // Fetch user profile from Supabase users table (has avatar_url, etc.)
  const { data: userProfile } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id,
  });

  // Sync localStorage avatar cache when profile loads
  useEffect(() => {
    const serverAvatar = userProfile?.avatar_url;
    if (serverAvatar) {
      localStorage.setItem('allplay_profile_image', serverAvatar);
    }
  }, [userProfile]);

  // Merge auth user with Supabase profile data (profile has priority)
  const user = React.useMemo(() => {
    if (!authUser) return null;
    const localAvatar = localStorage.getItem('allplay_profile_image');
    return {
      ...authUser,
      ...userProfile,
      id: authUser.id,
      avatar_url: userProfile?.avatar_url || localAvatar || authUser?.avatar_url,
      display_name: userProfile?.display_name || userProfile?.full_name || authUser?.display_name || authUser?.full_name,
      full_name: userProfile?.full_name || userProfile?.display_name || authUser?.full_name || authUser?.display_name,
      bio: userProfile?.bio || '',
      city: userProfile?.city || authUser?.city || '',
      skill_level: userProfile?.skill_level || authUser?.skill_level || '',
      birth_year: userProfile?.birth_year || null,
    };
  }, [authUser, userProfile]);


  // Fetch target user if viewing someone else's profile
  const { data: targetUser, isLoading: targetUserLoading } = useQuery({
    queryKey: QUERY_KEYS.targetUser(targetUserId),
    queryFn: async () => {
      if (!targetUserId || targetUserId === user?.id) return null;

      const foundUser = await getUserById(targetUserId);

      if (!foundUser || foundUser.full_name === 'Spelare') throw new Error('Användaren hittades inte');

      return foundUser;
    },
    enabled: !!targetUserId && !!user && targetUserId !== user?.id,
    staleTime: 2 * 60 * 1000,
    retry: false,
    onError: async (error) => {
      await alert('Kunde inte ladda profil', error.message, { type: 'alert' });
    }
  });

  // Fetch all friendships — single source of truth via Supabase REST (RLS enforced)
  const { data: friendships = [] } = useQuery({
    queryKey: QUERY_KEYS.friendships,
    queryFn: () => getMyFriendships(),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && !isGuest,
  });

  // Fetch friend requests (only for own profile)
  const { data: friendRequests = [] } = useQuery({
    queryKey: QUERY_KEYS.friendRequests(user?.id),
    queryFn: async () => {
      return friendships.filter(
        (f) => f.addressee_id === user.id && f.status === 'pending'
      );
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && !targetUserId && !isGuest,
  });

  // Fetch friends
  const { data: friends = [] } = useQuery({
    queryKey: QUERY_KEYS.friends(user?.id),
    queryFn: async () => {
      const acceptedFriendships = friendships.filter(
        (f) => (f.requester_id === user.id || f.addressee_id === user.id) && f.status === 'accepted'
      );
      const friendIds = acceptedFriendships.map(f =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );
      if (friendIds.length === 0) return [];
      return await getUsersByIds(friendIds);
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && !targetUserId && !isGuest && friendships.length > 0,
  });

  // Fetch team invites (only for own profile) - still using Base44 for TeamMember entity
  const { data: teamInvites = [] } = useQuery({
    queryKey: QUERY_KEYS.teamInvites(user?.id),
    queryFn: async () => {
      return await base44.entities.TeamMember.filter({
        user_id: user.id,
        status: 'pending'
      });
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && !targetUserId && !isGuest,
  });

  // Fetch team join requests where user is captain - still using Base44 for Team/TeamMember entities
  const { data: teamJoinRequests = [] } = useQuery({
    queryKey: QUERY_KEYS.teamJoinRequests(user?.id),
    queryFn: async () => {
      const captainTeams = await base44.entities.Team.filter({ captain_id: user.id });
      const captainTeamIds = captainTeams.map(t => t.id);

      if (captainTeamIds.length === 0) return [];

      const allPendingMembers = await base44.entities.TeamMember.list();
      const joinRequests = allPendingMembers.filter(
        tm => captainTeamIds.includes(tm.team_id) && tm.status === 'pending'
      );

      return joinRequests;
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && !targetUserId && !isGuest,
  });

  // Fetch match history
  const { data: matchHistory = [] } = useQuery({
    queryKey: QUERY_KEYS.matchHistory(targetUserId || user?.id),
    queryFn: async () => {
      const userId = targetUserId || user.id;
      const rows = await getMyMatches(userId);
      return rows.map(transformMatchData).filter(Boolean).slice(0, 10);
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && !isGuest,
  });

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await alert('Ogiltig fil', 'Vänligen välj en bild.', { type: 'alert' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      await alert('Fil för stor', 'Bilden är för stor. Max 5MB tillåten.', { type: 'alert' });
      return;
    }

    try {
      // Upload via Base44 (always works, no backend dependency)
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Save to localStorage immediately for instant display
      localStorage.setItem('allplay_profile_image', file_url);

      // Optimistic update of query cache
      queryClient.setQueryData(['supabase-userProfile', authUser?.id], old => ({
        ...old,
        avatar_url: file_url,
      }));

      // Try to persist to Supabase profile (fire-and-forget)
      updateProfile({ avatar_url: file_url }).catch(err => {
        console.warn('[Profile] Backend avatar save failed (image still available):', err.message);
      });

    } catch (error) {
      console.error("Error uploading profile image:", error);
      await alert('Uppladdningsfel', 'Kunde inte ladda upp bild. Försök igen.', { type: 'alert' });
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends(user.id) });
      await alert('Nya vänner! 🎉', 'Ni är nu vänner!', { type: 'success' });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      await alert('Fel vid vänförfrågan', error.message || 'Kunde inte acceptera förfrågan. Försök igen.', { type: 'alert' });
    }
  };

  const handleDeclineFriendRequest = async (requestId) => {
    const shouldDecline = await confirm(
      'Neka vänförfrågan',
      'Är du säker på att du vill neka denna vänförfrågan?',
      { type: 'warning', confirmText: 'Ja, neka', cancelText: 'Avbryt' }
    );
    if (!shouldDecline) return;

    try {
      await declineFriendRequest(requestId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
    } catch (error) {
      console.error("Error declining friend request:", error);
      await alert('Fel vid vänförfrågan', error.message || 'Kunde inte neka förfrågan. Försök igen.', { type: 'alert' });
    }
  };

  const handleAcceptTeamInvite = async (inviteId) => {
    try {
      await base44.entities.TeamMember.update(inviteId, { status: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamInvites(user.id) });

      await alert('Välkommen till laget! 🎉', 'Du är nu medlem i laget!', { type: 'success' });
    } catch (error) {
      console.error("Error accepting team invite:", error);
      await alert('Fel vid laginbjudan', 'Kunde inte acceptera inbjudan. Försök igen.', { type: 'alert' });
    }
  };

  const handleDeclineTeamInvite = async (inviteId) => {
    const shouldDecline = await confirm(
      'Neka laginbjudan',
      'Är du säker på att du vill neka denna laginbjudan?',
      { type: 'warning', confirmText: 'Ja, neka', cancelText: 'Avbryt' }
    );

    if (!shouldDecline) return;

    try {
      await base44.entities.TeamMember.update(inviteId, { status: 'declined' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamInvites(user.id) });
    } catch (error) {
      console.error("Error declining team invite:", error);
      await alert('Fel vid laginbjudan', 'Kunde inte neka inbjudan. Försök igen.', { type: 'alert' });
    }
  };

  // Handle team join requests with confirmation dialogs
  const handleAcceptJoinRequest = async (requestId) => {
    const joinRequest = teamJoinRequests.find(jr => jr.id === requestId);
    if (!joinRequest) return;

    // Get user and team info for confirmation
    let applicantName = 'denna spelare';
    let teamName = 'laget';

    try {
      const [applicantData, team] = await Promise.all([
        getUserById(joinRequest.user_id).catch(() => null),
        base44.entities.Team.get(joinRequest.team_id).catch(() => null)
      ]);

      if (applicantData) applicantName = applicantData.display_name || applicantData.full_name;
      if (team) teamName = team.name;
    } catch (err) {
      console.error('Error fetching details:', err);
    }

    const shouldAccept = await confirm(
      'Godkänn ansökan',
      `Vill du godkänna ${applicantName} som medlem i ${teamName}?`,
      {
        type: 'confirm',
        confirmText: 'Ja, godkänn',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldAccept) return;

    try {
      await base44.entities.TeamMember.update(requestId, { status: 'active' });

      // Update team member count
      const team = await base44.entities.Team.get(joinRequest.team_id);
      await base44.entities.Team.update(joinRequest.team_id, {
        current_members: (team.current_members || 0) + 1
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamJoinRequests(user.id) });

      await alert('Medlem godkänd! 🎉', `${applicantName} är nu medlem i ${teamName}!`, { type: 'success' });
    } catch (error) {
      console.error("Error accepting join request:", error);
      await alert('Fel vid ansökan', 'Kunde inte godkänna ansökan. Försök igen.', { type: 'alert' });
    }
  };

  const handleDeclineJoinRequest = async (requestId) => {
    const shouldDecline = await confirm(
      'Neka ansökan',
      'Är du säker på att du vill neka denna ansökan?',
      {
        type: 'warning',
        confirmText: 'Ja, neka',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldDecline) return;

    try {
      await base44.entities.TeamMember.update(requestId, { status: 'declined' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamJoinRequests(user.id) });

      await alert('Ansökan nekad', 'Ansökan har nekats.', { type: 'info' });
    } catch (error) {
      console.error("Error declining join request:", error);
      await alert('Fel vid ansökan', 'Kunde inte neka ansökan. Försök igen.', { type: 'alert' });
    }
  };

  const handleLogout = async () => {
    const shouldLogout = await confirm(
      'Logga ut',
      'Är du säker på att du vill logga ut?',
      {
        type: 'warning',
        confirmText: 'Logga ut',
        cancelText: 'Avbryt'
      }
    );

    if (shouldLogout) {
      // Use Supabase logout (clears session store)
      supabaseClient.logout();
      // Reload to reset app state
      window.location.reload();
    }
  };

  const handleAddFriendFromProfile = async () => {
    if (!targetUser || !user) return;
    const loadingId = feedback.loading("Skickar förfrågan...");
    try {
      const result = await sendFriendRequest(targetUser.id);
      feedback.dismiss(loadingId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends(user.id) });

      if (result.action === 'created') {
        feedback.success('Vänförfrågan skickad 🤝', { description: `${targetUser.display_name || targetUser.full_name} får en notis.` });
      } else if (result.action === 'accepted') {
        feedback.success('Ni är nu vänner! 🎉');
      } else if (result.action === 'already_friends') {
        feedback.info('Ni är redan vänner');
      } else if (result.action === 'already_sent') {
        feedback.info('Vänförfrågan redan skickad');
      }
    } catch (error) {
      feedback.dismiss(loadingId);
      console.error('Error adding friend:', error);
      feedback.error(error.message || 'Kunde inte skicka vänförfrågan. Försök igen.');
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user }),
      queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendRequests(user?.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamInvites(user?.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamJoinRequests(user?.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends(user?.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matchHistory(user?.id) })
    ]);
  };

  const isViewingOtherProfile = !!targetUserId && targetUserId !== user?.id;
  const displayUser = isViewingOtherProfile ? targetUser : user;
  const isLoading = (targetUserId && targetUserLoading);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Guest users see a prompt to login
  if (isGuest && !targetUserId) {
    return (
      <>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />

      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#2BA84A]/20">
            <Users className="w-10 h-10 text-[#2BA84A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#F4F7F5] mb-3">{t('profile.login_title')}</h2>
          <p className="text-[#B6C2BC] mb-6">{t('profile.login_desc')}</p>
          <Button
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white h-12 rounded-xl font-semibold"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {t('profile.login_btn')}
          </Button>
        </Card>
      </div>
      </>
    );
  }

  if (!displayUser) {
    return null;
  }

  const skillLevelKey = displayUser?.skill_level || 'intermediate';
  const SkillIcon = SKILL_LEVEL_ICONS[skillLevelKey] || Target;
  const skillLevel = SKILL_LEVEL_COLORS[skillLevelKey] || SKILL_LEVEL_COLORS.intermediate;
  const memberSince = displayUser?.created_date ? new Date(displayUser.created_date).getFullYear() : new Date().getFullYear();

  const getFriendshipStatus = () => {
    if (!isViewingOtherProfile || !user || !targetUser) return null;

    const friendship = friendships.find(f =>
      (f.requester_id === user.id && f.addressee_id === targetUser.id) ||
      (f.requester_id === targetUser.id && f.addressee_id === user.id)
    );

    if (!friendship) return 'none';
    if (friendship.status === 'accepted') return 'accepted';
    if (friendship.status === 'pending') {
      return friendship.requester_id === user.id ? 'pending_outgoing' : 'pending_incoming';
    }
    return 'none';
  };

  const friendshipStatus = getFriendshipStatus();

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Profile Hero — mirrors Dashboard signature */}
        <ProfileHero
          user={displayUser}
          isViewingOtherProfile={isViewingOtherProfile}
          onImageUpload={handleProfileImageUpload}
          onShowQR={() => setShowQRModal(true)}
          onLogout={handleLogout}
          onReport={() => setShowReportModal(true)}
          showMoreMenu={showMoreMenu}
          setShowMoreMenu={setShowMoreMenu}
          targetUserId={targetUser?.id}
        />

        {/* Content based on if viewing other profile */}
        {isViewingOtherProfile ? (
          <Suspense fallback={<ProfileSkeleton />}>
            <OtherProfileView
              targetUser={displayUser}
              currentUser={user}
              friendships={friendships}
              friendshipStatus={friendshipStatus}
              onAddFriend={handleAddFriendFromProfile}
              matchHistory={matchHistory}
            />
          </Suspense>
        ) : (
          <>
            {/* Sticky Tab Bar */}
            <div className="sticky top-0 z-30 bg-[#0F1513]/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { id: 'inbox', label: t('profile.tab_inbox'), icon: Users, badge: friendRequests.length + teamInvites.length + teamJoinRequests.length },
                    { id: 'stats', label: t('profile.tab_stats'), icon: TrendingUp },
                    { id: 'badges', label: t('profile.tab_badges'), icon: Award },
                    { id: 'history', label: t('profile.tab_history'), icon: Calendar }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { triggerHaptic('light'); setActiveTab(tab.id); }}
                        className={`relative flex items-center justify-center gap-1.5 h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 flex-shrink-0 ${
                          isActive
                            ? 'bg-[#2BA84A]/16 text-[#F4F7F5] ring-1 ring-[#2BA84A]/30'
                            : 'text-[#9EAAA4] hover:text-[#F4F7F5] hover:bg-[#18221E]'
                        }`}
                      >
                        <div className="relative">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#2BA84A]' : ''}`} />
                          {tab.badge > 0 && (
                            <div className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] bg-[#F4743B] rounded-full flex items-center justify-center">
                              <span className="text-[8px] font-black text-white px-0.5">{tab.badge}</span>
                            </div>
                          )}
                        </div>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="pb-8">
              <AnimatePresence mode="wait">
                {activeTab === 'inbox' && (
                  <motion.div
                    key="inbox"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={TRANSITIONS.tab}
                    className="space-y-6"
                  >
                    <Suspense fallback={<TabSkeleton rows={3} />}>
                      <InboxNotifications
                        friendRequests={friendRequests}
                        teamInvites={teamInvites}
                        teamJoinRequests={teamJoinRequests}
                        onAcceptFriend={handleAcceptFriendRequest}
                        onDeclineFriend={handleDeclineFriendRequest}
                        onAcceptTeam={handleAcceptTeamInvite}
                        onDeclineTeam={handleDeclineTeamInvite}
                        onAcceptJoinRequest={handleAcceptJoinRequest}
                        onDeclineJoinRequest={handleDeclineJoinRequest}
                      />
                    </Suspense>

                    {friends.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4 mt-6">
                          <h3 className="text-lg font-bold text-[#F4F7F5]">
                            {t('profile.hero.your_friends')} ({friends.length})
                          </h3>
                          <button
                            onClick={() => setShowQRModal(true)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#2BA84A]/10 px-4 text-xs font-semibold text-[#2BA84A] ring-1 ring-[#2BA84A]/30 hover:bg-[#2BA84A]/20 transition-all duration-150"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            {t('profile.hero.invite')}
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {friends.map((friend, index) => {
                            const friendSkillKey = friend.skill_level || 'intermediate';
                            const FriendSkillIcon = SKILL_LEVEL_ICONS[friendSkillKey] || Target;
                            const friendSkill = SKILL_LEVEL_COLORS[friendSkillKey] || SKILL_LEVEL_COLORS.intermediate;
                            const friendAvatar = friend.avatar_url;

                            return (
                              <motion.div
                                key={friend.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                              >
                                <Link to={`${createPageUrl("Profile")}?userId=${friend.id}`} className="block">
                                  <Card className="bg-[#121715] border border-[#223029] rounded-2xl hover:border-[#2BA84A]/30 transition-all duration-150 cursor-pointer overflow-hidden">
                                    <CardContent className="p-0">
                                      {/* Top accent bar */}
                                      <div className={`h-1 bg-gradient-to-r ${friendSkill.color}`} />
                                      <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="w-11 h-11 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {friendAvatar ?
                                              <img src={friendAvatar} alt={friend.full_name} className="w-full h-full object-cover" loading="lazy" /> :
                                              <span className="text-[#FFFFFF] font-semibold text-base">{friend.full_name?.[0] || 'U'}</span>
                                            }
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-[#F4F7F5] text-sm truncate">{friend.display_name || friend.full_name}</h4>
                                            <div className="flex items-center gap-1.5 text-xs text-[#9EAAA4]">
                                              <MapPin className="w-3 h-3" />
                                              {friend.city || t('common.unknown')}
                                            </div>
                                          </div>
                                          <Badge className={`bg-gradient-to-r ${friendSkill.color} ${friendSkill.textColor} text-[10px] font-bold border-0 px-2 h-6`}>
                                            <FriendSkillIcon className="w-3 h-3 mr-1" />
                                            {t(`profile.skill.${friendSkillKey}`)}
                                          </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                          <div className="flex-1 flex items-center justify-between p-2.5 bg-[#0F1513] rounded-xl">
                                            <span className="text-[10px] text-[#9EAAA4] font-medium">Matcher</span>
                                            <span className="font-mono font-bold text-[#F4F7F5] text-sm">{friend.matches_played || 0}</span>
                                          </div>
                                          <div className="flex-1 flex items-center justify-between p-2.5 bg-[#0F1513] rounded-xl">
                                            <span className="text-[10px] text-[#9EAAA4] font-medium">MVPs</span>
                                            <span className="font-mono font-bold text-[#F4743B] text-sm">{friend.mvp_count || 0}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'stats' && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={TRANSITIONS.tab}
                  >
                    <Suspense fallback={<TabSkeleton rows={4} />}>
                      <ProfileStats user={displayUser} matchHistory={matchHistory} isOwnProfile={true} />
                    </Suspense>
                  </motion.div>
                )}

                {activeTab === 'badges' && (
                  <motion.div
                    key="badges"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={TRANSITIONS.tab}
                  >
                    <Suspense fallback={<TabSkeletonGrid count={6} />}>
                      <BadgeCollection user={displayUser} />
                    </Suspense>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={TRANSITIONS.tab}
                  >
                    {matchHistory.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">Senaste matcher</h3>
                        <Suspense fallback={<TabSkeleton rows={4} />}>
                          <MatchHistory matches={matchHistory} />
                        </Suspense>
                      </div>
                    ) : (
                      <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-[#2BA84A]/20">
                          <Trophy className="w-8 h-8 text-[#2BA84A]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">
                          Du har inga matcher än
                        </h3>
                        <p className="text-sm text-[#9EAAA4]">
                          Spelade matcher kommer att synas här.
                        </p>
                      </Card>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* QR Modal */}
      {!isViewingOtherProfile && showQRModal && user && (
        <Suspense fallback={null}>
          <QRModal
            user={user}
            onClose={() => setShowQRModal(false)}
          />
        </Suspense>
      )}

      {/* Settings Sheet */}
      {!isViewingOtherProfile && showSettingsSheet && (
        <Suspense fallback={null}>
          <SettingsSheet
            onClose={() => setShowSettingsSheet(false)}
            onShowQR={() => {
              setShowSettingsSheet(false);
              setShowQRModal(true);
            }}
          />
        </Suspense>
      )}

      {/* Report Modal */}
      {isViewingOtherProfile && targetUser && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={targetUser.id}
          reportedItemType="user"
          reportedItemId={targetUser.id}
          itemTitle={targetUser.display_name || targetUser.full_name}
        />
      )}
    </div>
    </PullToRefresh>
  );
}

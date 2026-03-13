import React, { useState, useEffect, Suspense, lazy } from "react";
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
import { AuthGateModal } from "../components/ui/auth-gate-modal";
import { LoginModal } from "../components/supabase";
import { LogIn } from "lucide-react";
import { getMyProfile, updateProfile } from "../components/supabase/services";
import { supabaseClient } from "../components/supabase/client";

// Lazy load components
const ProfileStats = lazy(() => import("../components/profile/ProfileStats"));
const BadgeCollection = lazy(() => import("../components/profile/BadgeCollection"));
const MatchHistory = lazy(() => import("../components/profile/MatchHistory"));
const InboxNotifications = lazy(() => import("../components/profile/InboxNotifications"));
const QRModal = lazy(() => import("../components/profile/QRModal"));
const SettingsSheet = lazy(() => import("../components/profile/SettingsSheet"));

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target, color: 'from-[#10B981] to-[#059669]', textColor: 'text-[#A7F3D0]' },
  intermediate: { label: 'Medel', icon: TrendingUp, color: 'from-[#14B8A6] to-[#0D9488]', textColor: 'text-[#99F6E4]' },
  advanced: { label: 'Avancerad', icon: Shield, color: 'from-[#8B5CF6] to-[#7C3AED]', textColor: 'text-[#DDD6FE]' },
  elite: { label: 'Elit', icon: Crown, color: 'from-[#F59E0B] to-[#D97706]', textColor: 'text-[#FDE68A]' }
};

// Query keys
const QUERY_KEYS = {
  user: ['user'],
  targetUser: (userId) => ['targetUser', userId],
  friendships: ['friendships'],
  friendRequests: (userId) => ['friendRequests', userId],
  teamInvites: (userId) => ['teamInvites', userId],
  teamJoinRequests: (userId) => ['teamJoinRequests', userId], // NEW
  friends: (userId) => ['friends', userId],
  matchHistory: (userId) => ['matchHistory', userId]
};

export default function ProfilePage() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { isGuest, isAuthenticated, user: authUser } = useSupabaseAuth();

  // Inbox tab label (computed after data loaded)

  const urlParams = new URLSearchParams(location.search);
  const targetUserId = urlParams.get('userId');

  // Fetch user profile from Supabase users table (has profile_image_url, etc.)
  const { data: userProfile } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id,
  });

  // Sync localStorage avatar cache when profile loads
  useEffect(() => {
    const serverAvatar = userProfile?.profile_image_url || userProfile?.avatar_url;
    if (serverAvatar) {
      localStorage.setItem('allplay_profile_image', serverAvatar);
    }
  }, [userProfile]);

  // Merge auth user with Supabase profile data (profile has priority)
  // localStorage fallback ensures avatar always displays even if backend is down
  const user = React.useMemo(() => {
    if (!authUser) return null;
    const localAvatar = localStorage.getItem('allplay_profile_image');
    return {
      ...authUser,
      ...userProfile,
      id: authUser.id,
      profile_image_url: userProfile?.profile_image_url || userProfile?.avatar_url || localAvatar || authUser?.profile_image_url || authUser?.avatar_url,
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

  // Fetch all friendships
  const { data: friendships = [] } = useQuery({
    queryKey: QUERY_KEYS.friendships,
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: user.id }),
        base44.entities.Friendship.filter({ addressee_id: user.id })
      ]);
      const map = new Map();
      sent.forEach(f => map.set(f.id, f));
      received.forEach(f => map.set(f.id, f));
      return Array.from(map.values());
    },
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
      const participations = await base44.entities.MatchParticipant.filter({ user_id: userId });
      const matchIds = participations.map((p) => p.match_id);
      const matches = await base44.entities.Match.list('-date', 50);
      return matches.filter((m) => matchIds.includes(m.id)).slice(0, 10);
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
        profile_image_url: file_url,
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
      await base44.entities.Friendship.update(requestId, { status: 'accepted' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends(user.id) });
      
      await alert('Nya vänner! 🎉', 'Ni är nu vänner!', { type: 'success' });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      await alert('Fel vid vänförfrågan', 'Kunde inte acceptera förfrågan. Försök igen.', { type: 'alert' });
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
      await base44.entities.Friendship.delete(requestId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
    } catch (error) {
      console.error("Error declining friend request:", error);
      await alert('Fel vid vänförfrågan', 'Kunde inte neka förfrågan. Försök igen.', { type: 'alert' });
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
    
    try {
      const existing = friendships.find(f =>
        (f.requester_id === user.id && f.addressee_id === targetUser.id) ||
        (f.requester_id === targetUser.id && f.addressee_id === user.id)
      );

      if (existing) {
        if (existing.status === 'accepted') {
          await alert('Redan vänner', 'Ni är redan vänner!', { type: 'info' });
        } else if (existing.status === 'pending') {
          if (existing.requester_id === user.id) {
            await alert('Förfrågan skickad', 'Vänförfrågan redan skickad!', { type: 'info' });
          } else {
            await base44.entities.Friendship.update(existing.id, { status: 'accepted' });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
          }
        }
        return;
      }

      await base44.entities.Friendship.create({
        requester_id: user.id,
        addressee_id: targetUser.id,
        status: 'pending'
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
    } catch (error) {
      console.error('Error adding friend:', error);
      await alert('Fel vid vänförfrågan', 'Kunde inte skicka vänförfrågan. Försök igen.', { type: 'alert' });
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
      <AuthGateModal 
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        onLogin={() => setShowLoginModal(true)}
        feature="se din profil och hantera vänner"
      />
      
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          setShowAuthGate(false);
        }}
      />
      
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#2BA84A]/20">
            <Users className="w-10 h-10 text-[#2BA84A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#F4F7F5] mb-3">Logga in för att se din profil</h2>
          <p className="text-[#B6C2BC] mb-6">Skapa ett konto eller logga in för att se din profil, hantera vänner och mycket mer.</p>
          <Button 
            onClick={() => setShowAuthGate(true)}
            className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white h-12 rounded-xl font-semibold"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Logga in / Skapa konto
          </Button>
        </Card>
      </div>
      </>
    );
  }

  if (!displayUser) {
    return null;
  }

  const skillLevel = SKILL_LEVEL_CONFIG[displayUser?.skill_level || 'intermediate'];
  const SkillIcon = skillLevel.icon;
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
        
        {/* Hero Header Card - Improved UI */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7),0_0_40px_0px_rgba(43,168,74,0.1)] border border-[#2BA84A]/20 bg-[#0A0D0B]"
        >
          {/* Dark gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#0F1513] to-[#0A0D0B]"></div>
          
          {/* Green animated overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/25 via-[#248232]/15 to-transparent"
            animate={{
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Subtle Glowing Ring */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] rounded-full border border-[#2BA84A]/12"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Ambient Orbs */}
          <div className="absolute top-10 right-10 lg:right-20 w-40 h-40 lg:w-56 lg:h-56 bg-[#2BA84A]/15 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-10 left-10 lg:left-20 w-48 h-48 lg:w-64 lg:h-64 bg-[#1A6029]/10 rounded-full blur-3xl opacity-30" />

          {/* Top Right Actions */}
          {!isViewingOtherProfile ? (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
              <Link to={createPageUrl("AccountSettings")}>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10 shadow-lg"
                  title="Kontoinställningar"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </Link>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10 shadow-lg"
                title="Logga ut"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          ) : (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
              <div className="relative">
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10 shadow-lg"
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                
                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-[#121715] border border-[#223029] rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowReportModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#F4F7F5] hover:bg-[#18221E] transition-colors"
                      >
                        <Flag className="w-4 h-4 text-red-400" />
                        Rapportera
                      </button>
                      <div className="px-4 py-2">
                        <BlockUserButton 
                          targetUserId={targetUser?.id}
                          variant="ghost"
                          className="w-full justify-start px-0"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
            <div className="flex items-center gap-3 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
              
              {/* Profile Image - Small border */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut"
                }}
                className="relative flex-shrink-0"
              >
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#FFFFFF]/30 shadow-[0_20px_60px_rgba(43,168,74,0.4)] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center">
                  {(displayUser?.profile_image_url || displayUser?.avatar_url) ? (
                    <img
                      src={displayUser.profile_image_url || displayUser.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      loading="eager"
                      fetchpriority="high"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-[#FFFFFF]">
                      {displayUser?.full_name?.[0] || 'U'}
                    </span>
                  )}
                </div>
                {!isViewingOtherProfile && (
                  <>
                    <input
                      type="file"
                      id="profile-image-upload"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="profile-image-upload">
                      <button
                        className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-[#F4743B] rounded-xl flex items-center justify-center text-[#FFFFFF] ring-2 ring-[#FFFFFF] hover:bg-[#E5683A] transition-all duration-150 hover:shadow-lg hover:scale-105"
                        onClick={() => document.getElementById('profile-image-upload').click()}
                      >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </label>
                  </>
                )}
              </motion.div>

              {/* Info - Aligned with logo */}
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-1 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] leading-tight"
                >
                  {displayUser?.display_name || displayUser?.full_name}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/85 text-[11px] sm:text-sm lg:text-base font-medium leading-snug mb-3 sm:mb-4"
                >
                  {displayUser?.bio || (isViewingOtherProfile ? '' : 'Tryck på Redigera för att lägga till en bio')}
                </motion.p>

                {/* Chips */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                  <Badge className="h-7 px-2.5 sm:px-3 bg-transparent border border-[#FFFFFF]/30 text-[#FFFFFF] text-[10px] sm:text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {displayUser?.city || 'Stockholm'}
                  </Badge>
                  
                  <Badge className={`h-7 px-2.5 sm:px-3 bg-gradient-to-r ${skillLevel.color} border-0 ${skillLevel.textColor} text-[10px] sm:text-xs font-semibold`}>
                    <SkillIcon className="w-3 h-3 mr-1" />
                    {skillLevel.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4"
            >
              {[
                { value: displayUser?.matches_played || 0, label: 'Matcher', icon: Trophy, iconColor: 'text-[#86EFAC]', bg: 'bg-white/8 border-white/10' },
                { value: displayUser?.mvp_count || 0, label: 'MVPs', icon: Award, iconColor: 'text-[#FDE3D2]', bg: 'bg-[#F4743B]/8 border-[#F4743B]/15' },
                { value: displayUser?.current_streak || 0, label: 'Streak', icon: Trophy, iconColor: 'text-[#FDE68A]', bg: 'bg-[#F59E0B]/8 border-[#F59E0B]/15' },
              ].map((stat, i) => {
                const StatIcon = stat.icon;
                return (
                  <div 
                    key={i}
                    className={`backdrop-blur-md border rounded-2xl p-3.5 sm:p-4 text-center transition-all ${stat.bg}`}
                  >
                    <StatIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor} mx-auto mb-1.5`} strokeWidth={2.5} />
                    <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-0.5">
                      {stat.value}
                    </div>
                    <div className="text-[10px] sm:text-xs text-white/60 font-semibold">{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>

            {/* Action Buttons - In Hero */}
            {!isViewingOtherProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-2 gap-2 sm:gap-3"
              >
                <Link to={createPageUrl("EditProfile")} className="block">
                  <motion.button
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 sm:h-12 lg:h-14 w-full bg-gradient-to-r from-[#FFFFFF]/20 to-[#FFFFFF]/10 hover:from-[#FFFFFF]/30 hover:to-[#FFFFFF]/20 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 text-white font-black text-sm sm:text-sm lg:text-base transition-all shadow-xl"
                  >
                    <Edit className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                    <span>Redigera</span>
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { triggerHaptic('light'); setShowQRModal(true); }}
                  className="h-12 sm:h-12 lg:h-14 bg-gradient-to-r from-[#FFFFFF]/20 to-[#FFFFFF]/10 hover:from-[#FFFFFF]/30 hover:to-[#FFFFFF]/20 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 text-white font-black text-sm sm:text-sm lg:text-base transition-all shadow-xl"
                >
                  <QrCode className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                  <span>Bjud in</span>
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Content based on if viewing other profile */}
        {isViewingOtherProfile ? (
          <motion.div
            key="other-profile-content" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileStats user={displayUser} isOwnProfile={false} />
            </Suspense>
            
            {matchHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">Senaste matcher</h3>
                <Suspense fallback={<ProfileSkeleton />}>
                  <MatchHistory matches={matchHistory} />
                </Suspense>
              </div>
            )}

            {matchHistory.length === 0 && (
              <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-10 text-center mt-6">
                <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-[#2BA84A]/20">
                  <Trophy className="w-8 h-8 text-[#2BA84A]" />
                </div>
                <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">
                  Inga matcher spelade
                </h3>
                <p className="text-sm text-[#9EAAA4]">
                  Denna användare har inte spelat några matcher än.
                </p>
              </Card>
            )}
          </motion.div>
        ) : (
          <>
            {/* Sticky Tab Bar */}
            <div className="sticky top-0 z-30 bg-[#0F1513]/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { id: 'inbox', label: 'Inbox', icon: Users, badge: friendRequests.length + teamInvites.length + teamJoinRequests.length },
                    { id: 'stats', label: 'Statistik', icon: TrendingUp },
                    { id: 'badges', label: 'Badges', icon: Award },
                    { id: 'history', label: 'Historik', icon: Calendar }
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
                            Dina vänner ({friends.length})
                          </h3>
                          <button 
                            onClick={() => setShowQRModal(true)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#2BA84A]/10 px-4 text-xs font-semibold text-[#2BA84A] ring-1 ring-[#2BA84A]/30 hover:bg-[#2BA84A]/20 transition-all duration-150"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Bjud in
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {friends.map((friend, index) => {
                            const friendSkill = SKILL_LEVEL_CONFIG[friend.skill_level || 'intermediate'];
                            const FriendSkillIcon = friendSkill.icon;
                            const friendAvatar = friend.profile_image_url || friend.avatar_url;
                            
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
                                              {friend.city || 'Okänd stad'}
                                            </div>
                                          </div>
                                          <Badge className={`bg-gradient-to-r ${friendSkill.color} ${friendSkill.textColor} text-[10px] font-bold border-0 px-2 h-6`}>
                                            <FriendSkillIcon className="w-3 h-3 mr-1" />
                                            {friendSkill.label}
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
                      <ProfileStats user={displayUser} isOwnProfile={true} />
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
                    <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">Lås upp utmärkelser genom att spela</h3>
                    {(displayUser?.matches_played || 0) === 0 ? (
                      <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#2BA84A]/20">
                          <Award className="w-10 h-10 text-[#2BA84A]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#F4F7F5] mb-3">
                          Spela din första match
                        </h3>
                        <p className="text-base text-[#B6C2BC]">
                          Dina upplåsta utmärkelser kommer att visas här.
                        </p>
                      </Card>
                    ) : (
                      <Suspense fallback={<TabSkeletonGrid count={6} />}>
                        <BadgeCollection user={displayUser} />
                      </Suspense>
                    )}
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
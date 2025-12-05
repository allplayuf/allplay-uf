import React, { useState, useEffect, Suspense, lazy } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Friendship } from "@/entities/Friendship";
import { TeamMember, Team } from "@/entities/Team";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { ProfileSkeleton } from "../components/ui/loading-skeleton";

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

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: Users },
  { id: 'stats', label: 'Statistik', icon: TrendingUp },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'history', label: 'Historik', icon: Calendar }
];

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

  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const targetUserId = urlParams.get('userId');

  // Fetch current user with aggressive caching
  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return currentUser;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always refetch when component mounts to get latest data
    retry: false,
  });

  // Handle rate limit errors
  useEffect(() => {
    if (userError?.message?.includes('rate limit') || userError?.message?.includes('Rate limit')) {
      alert('För många förfrågningar', 'Vänta en stund och försök igen.', { type: 'alert' });
    }
  }, [userError, alert]);

  // Fetch target user if viewing someone else's profile
  const { data: targetUser, isLoading: targetUserLoading } = useQuery({
    queryKey: QUERY_KEYS.targetUser(targetUserId),
    queryFn: async () => {
      if (!targetUserId || targetUserId === user?.id) return null;
      
      const allUsers = await base44.entities.User.list();
      const foundUser = allUsers.find(u => u.id === targetUserId);
      
      if (!foundUser) throw new Error('User not found');
      if (foundUser.blocked === true) throw new Error('User blocked');
      if (foundUser.publicProfile === false) throw new Error('Private profile');
      
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
    queryFn: async () => await Friendship.list(),
    staleTime: 30 * 1000,
    enabled: !!user,
  });

  // Fetch friend requests (only for own profile)
  const { data: friendRequests = [] } = useQuery({
    queryKey: QUERY_KEYS.friendRequests(user?.id),
    queryFn: async () => {
      return friendships.filter(
        (f) => f.addressee_id === user.id && f.status === 'pending'
      );
    },
    staleTime: 30 * 1000,
    enabled: !!user && !targetUserId,
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
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => friendIds.includes(u.id));
    },
    staleTime: 60 * 1000,
    enabled: !!user && !targetUserId && friendships.length > 0,
  });

  // Fetch team invites (only for own profile)
  const { data: teamInvites = [] } = useQuery({
    queryKey: QUERY_KEYS.teamInvites(user?.id),
    queryFn: async () => {
      return await base44.entities.TeamMember.filter({
        user_id: user.id,
        status: 'pending'
      });
    },
    staleTime: 30 * 1000,
    enabled: !!user && !targetUserId,
  });

  // NEW: Fetch team join requests where user is captain
  const { data: teamJoinRequests = [] } = useQuery({
    queryKey: QUERY_KEYS.teamJoinRequests(user?.id),
    queryFn: async () => {
      // Get all teams where user is captain
      const captainTeams = await base44.entities.Team.filter({ captain_id: user.id });
      const captainTeamIds = captainTeams.map(t => t.id);
      
      if (captainTeamIds.length === 0) return [];
      
      // Get all pending join requests for these teams
      const allPendingMembers = await base44.entities.TeamMember.list();
      const joinRequests = allPendingMembers.filter(
        tm => captainTeamIds.includes(tm.team_id) && tm.status === 'pending'
      );
      
      return joinRequests;
    },
    staleTime: 30 * 1000,
    enabled: !!user && !targetUserId,
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
    staleTime: 60 * 1000,
    enabled: !!user,
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_image_url: file_url });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
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

  // NEW: Handle team join requests with confirmation dialogs
  const handleAcceptJoinRequest = async (requestId) => {
    const joinRequest = teamJoinRequests.find(jr => jr.id === requestId);
    if (!joinRequest) return;

    // Get user and team info for confirmation
    let applicantName = 'denna spelare';
    let teamName = 'laget';
    
    try {
      const [applicant, team] = await Promise.all([
        base44.entities.User.get(joinRequest.user_id).catch(() => null),
        base44.entities.Team.get(joinRequest.team_id).catch(() => null)
      ]);
      
      if (applicant) applicantName = applicant.full_name;
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

  const isViewingOtherProfile = !!targetUserId && targetUserId !== user?.id;
  const displayUser = isViewingOtherProfile ? targetUser : user;
  const isLoading = userLoading || (targetUserId && targetUserLoading);

  if (isLoading) {
    return <ProfileSkeleton />;
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
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Header Card - Community Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.5)] border border-[#2BA84A]/30"
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

          {/* Enhanced Glowing Rings */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] rounded-full border-2 border-[#2BA84A]/20"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 90, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] lg:w-[900px] lg:h-[900px] rounded-full border border-[#248232]/10"
            animate={{
              scale: [1.1, 1, 1.1],
              rotate: [0, -90, 0],
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />

          {/* Ambient Orbs */}
          <motion.div
            className="absolute top-10 lg:top-20 right-10 lg:right-20 w-32 h-32 lg:w-48 lg:h-48 bg-[#2BA84A]/20 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-10 lg:bottom-20 left-10 lg:left-20 w-40 h-40 lg:w-56 lg:h-56 bg-[#1A6029]/15 rounded-full blur-3xl"
            animate={{
              x: [0, -20, 0],
              y: [0, 20, 0],
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          {/* Floating Light Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 lg:w-2 lg:h-2 bg-[#2BA84A]/60 rounded-full"
              style={{
                left: `${15 + i * 12}%`,
                top: `${25 + (i % 4) * 20}%`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.2, 0.7, 0.2],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          ))}
          
          <div className="relative z-10 px-4 pt-5 pb-5 sm:px-8 sm:pt-8 sm:pb-8 lg:px-12 lg:pt-12 lg:pb-12">
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
                  {displayUser?.profile_image_url ? (
                    <img
                      src={displayUser.profile_image_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      loading="lazy"
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
                  {displayUser?.bio || 'AllPlays officiella konto'}
                </motion.p>

                {/* Chips */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
              <div className="bg-gradient-to-br from-[#FFFFFF]/15 to-[#FFFFFF]/5 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1">
                  {displayUser?.matches_played || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-white/70 font-semibold">Matcher</div>
              </div>
              
              <div className="bg-gradient-to-br from-[#F4743B]/20 to-[#F4743B]/5 backdrop-blur-xl border border-[#F4743B]/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#FDE3D2] mb-1">
                  {displayUser?.mvp_count || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-[#FDE3D2]/70 font-semibold">MVPs</div>
              </div>
              
              <div className="bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/5 backdrop-blur-xl border border-[#F59E0B]/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#FDE68A] mb-1">
                  {displayUser?.current_streak || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-[#FDE68A]/70 font-semibold">Streak</div>
              </div>
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
                    className="h-12 sm:h-12 lg:h-14 w-full bg-gradient-to-r from-[#FFFFFF]/20 to-[#FFFFFF]/10 hover:from-[#FFFFFF]/30 hover:to-[#FFFFFF]/20 backdrop-blur-xl border-2 border-white/40 hover:border-white/60 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-white font-black text-sm sm:text-sm lg:text-base transition-all shadow-xl"
                  >
                    <Edit className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                    <span>Redigera</span>
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQRModal(true)}
                  className="h-12 sm:h-12 lg:h-14 bg-gradient-to-r from-[#FFFFFF]/20 to-[#FFFFFF]/10 hover:from-[#FFFFFF]/30 hover:to-[#FFFFFF]/20 backdrop-blur-xl border-2 border-white/40 hover:border-white/60 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-white font-black text-sm sm:text-sm lg:text-base transition-all shadow-xl"
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
              <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/20 border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] p-12 text-center mt-6">
                <div className="w-20 h-20 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#2BA84A]/20">
                  <Trophy className="w-10 h-10 text-[#2BA84A]" />
                </div>
                <h3 className="text-2xl font-bold text-[#F4F7F5] mb-3">
                  Inga matcher spelade
                </h3>
                <p className="text-base text-[#B6C2BC]">
                  Denna användare har inte spelat några matcher än.
                </p>
              </Card>
            )}
          </motion.div>
        ) : (
          <>
            {/* Sticky Tab Bar */}
            <div className="sticky top-0 z-30 bg-[#0F1513]/95 backdrop-blur-md border-b border-[#223029] -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-around sm:justify-start sm:gap-6 overflow-x-auto scrollbar-hide">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center justify-center gap-2 h-12 px-4 text-sm font-medium transition-all duration-150 flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'text-[#F4F7F5]'
                            : 'text-[#B6C2BC] hover:text-[#F4F7F5]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4743B] rounded-full" />
                        )}
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6"
                  >
                    <Suspense fallback={<ProfileSkeleton />}>
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
                            
                            return (
                              <motion.div
                                key={friend.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                              >
                                <Link to={`${createPageUrl("Profile")}?userId=${friend.id}`} className="block">
                                  <Card className="bg-[#121715] border border-[#223029] shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-2xl hover:shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:scale-[1.02] transition-all duration-150 cursor-pointer">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                                          {friend.profile_image_url ? 
                                            <img src={friend.profile_image_url} alt={friend.full_name} className="w-full h-full object-cover rounded-xl" loading="lazy" /> :
                                            <span className="text-[#FFFFFF] font-semibold text-lg">{friend.full_name?.[0] || 'U'}</span>
                                          }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">{friend.display_name || friend.full_name}</h4>
                                          <div className="flex items-center gap-1 text-xs text-[#B6C2BC]">
                                            <MapPin className="w-3 h-3" />
                                            {friend.city}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mb-3">
                                        <Badge className={`w-full justify-center py-1.5 bg-gradient-to-r ${friendSkill.color} ${friendSkill.textColor} rounded-lg text-xs font-semibold`}>
                                          <FriendSkillIcon className="w-3 h-3 mr-1" />
                                          {friendSkill.label}
                                        </Badge>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-[#0F1513] rounded-xl">
                                          <span className="text-xs text-[#B6C2BC] font-medium">Matcher</span>
                                          <span className="font-mono font-semibold text-[#F4F7F5] text-sm">{friend.matches_played || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-[#0F1513] rounded-xl">
                                          <span className="text-xs text-[#B6C2BC] font-medium">MVPs</span>
                                          <span className="font-mono font-semibold text-[#F4743B] text-sm">{friend.mvp_count || 0}</span>
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Suspense fallback={<ProfileSkeleton />}>
                      <ProfileStats user={displayUser} isOwnProfile={true} />
                    </Suspense>
                  </motion.div>
                )}

                {activeTab === 'badges' && (
                  <motion.div
                    key="badges"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">Lås upp utmärkelser genom att spela</h3>
                    {(displayUser?.matches_played || 0) === 0 ? (
                      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] p-12 text-center">
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
                      <Suspense fallback={<ProfileSkeleton />}>
                        <BadgeCollection user={displayUser} />
                      </Suspense>
                    )}
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {matchHistory.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">Senaste matcher</h3>
                        <Suspense fallback={<ProfileSkeleton />}>
                          <MatchHistory matches={matchHistory} />
                        </Suspense>
                      </div>
                    ) : (
                      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] p-12 text-center">
                        <div className="w-20 h-20 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#2BA84A]/20">
                          <Trophy className="w-10 h-10 text-[#2BA84A]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#F4F7F5] mb-3">
                          Du har inga matcher än
                        </h3>
                        <p className="text-base text-[#B6C2BC]">
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
    </div>
  );
}
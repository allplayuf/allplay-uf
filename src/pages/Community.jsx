import React, { useState, useEffect, Suspense, lazy } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, UserPlus, Trophy, Plus, Search, Target, TrendingUp, Flame, Heart, Sparkles, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import { AppLoading } from "../components/ui/app-loading";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { NoPlayersFound, NoTeamsFound } from "../components/ui/empty-state";
import { CUPS_QUERY_KEY } from "../components/dashboard/CupsWidget";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";

const FriendsList = lazy(() => import("../components/community/FriendsList"));
const FindPlayers = lazy(() => import("../components/community/FindPlayers"));
const CreateTeamForm = lazy(() => import("../components/teams/CreateTeamForm"));
const CupsOverview = lazy(() => import("../components/community/CupsOverview"));
const TeamsList = lazy(() => import("../components/community/TeamsList"));

// Query keys
const QUERY_KEYS = {
  user: ['user'],
  publicUsers: ['publicUsers'],
  publicTeams: ['publicTeams'],
  friendships: ['friendships'],
  teamMembers: (userId) => ['teamMembers', userId],
  teamInvites: (userId) => ['teamInvites', userId],
};

// Tab color config
const TAB_COLORS = {
  friends: {
    active: 'bg-[#2BA84A]/16 text-[#2BA84A] ring-1 ring-[#2BA84A]/30',
    inactive: 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]',
    icon: 'text-[#2BA84A]',
    iconInactive: ''
  },
  teams: {
    active: 'bg-[#9370DB]/16 text-[#DDD6FE] ring-1 ring-[#9370DB]/30',
    inactive: 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]',
    icon: 'text-[#DDD6FE]',
    iconInactive: ''
  },
  find: {
    active: 'bg-[#2BA84A]/16 text-[#2BA84A] ring-1 ring-[#2BA84A]/30',
    inactive: 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]',
    icon: 'text-[#2BA84A]',
    iconInactive: ''
  },
  feedback: {
    active: 'bg-[#4169E1]/16 text-[#B0C4DE] ring-1 ring-[#4169E1]/30',
    inactive: 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]',
    icon: 'text-[#B0C4DE]',
    iconInactive: ''
  },
  cups: {
    active: 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30',
    inactive: 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]',
    icon: 'text-[#FCD34D]',
    iconInactive: ''
  }
};

export default function CommunityPage() {
  const locationHook = useLocation();
  const urlParams = new URLSearchParams(locationHook.search);
  const initialTab = urlParams.get('tab') || 'friends';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  // Update tab from URL parameter
  useEffect(() => {
    const tab = urlParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [locationHook.search, activeTab, urlParams]);

  // Fetch current user with OPTIMIZED caching (same as Dashboard)
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      
      if (currentUser.city && !currentUser.cityNormalized) {
        try {
          await base44.auth.updateMe({
            cityNormalized: currentUser.city.trim().toLowerCase()
          });
          currentUser.cityNormalized = currentUser.city.trim().toLowerCase();
        } catch (err) {
          console.error('Failed to update cityNormalized:', err);
        }
      }
      
      return currentUser;
    },
    ...CACHE_STRATEGIES.AUTH,
    retry: false,
  });

  // Handle rate limit errors
  useEffect(() => {
    if (userError?.message?.includes('rate limit') || userError?.message?.includes('Rate limit')) {
      alert('För många förfrågningar', 'Vänta en stund och försök igen.', { type: 'alert' });
    }
  }, [userError, alert]);

  // Fetch public users via backend with OPTIMIZED caching and pagination
  const { 
    data: usersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: usersLoading
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.publicUsers,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await base44.functions.invoke('getPublicUsers', {
        limit: 50,
        offset: pageParam
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  const allUsers = usersData?.pages.flatMap(page => page.users) || [];

  // Fetch public teams via backend with OPTIMIZED caching
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: QUERY_KEYS.publicTeams,
    queryFn: async () => {
      const response = await base44.functions.invoke('getPublicTeams');
      const teams = response.data.teams || [];
      return user?.role === 'admin' ? teams : teams.filter(t => t.is_active !== false);
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC, // Changed from DYNAMIC to reduce aggressive fetching on mount
    refetchOnMount: false, // Don't refetch every time, trust cache
    enabled: !!user,
  });

  // Fetch friendships with OPTIMIZED caching
  const { data: friendships = [], isLoading: friendshipsLoading } = useQuery({
    queryKey: QUERY_KEYS.friendships,
    queryFn: async () => {
      // Optimization: Fetch only relevant friendships instead of listing all
      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: user.id }),
        base44.entities.Friendship.filter({ addressee_id: user.id })
      ]);
      
      // Combine and deduplicate by ID
      const map = new Map();
      sent.forEach(f => map.set(f.id, f));
      received.forEach(f => map.set(f.id, f));
      
      return Array.from(map.values());
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user,
  });

  // Fetch user's teams with OPTIMIZED caching
  const { data: myTeams = [], isLoading: myTeamsLoading } = useQuery({
    queryKey: QUERY_KEYS.teamMembers(user?.id),
    queryFn: async () => {
      const teamMemberships = await base44.entities.TeamMember.filter({ 
        user_id: user.id, 
        status: 'active' 
      });
      const teamIds = teamMemberships.map(tm => tm.team_id);
      return allTeams.filter(t => teamIds.includes(t.id));
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && allTeams.length > 0,
  });

  // Fetch team invites with OPTIMIZED caching
  const { data: teamInvites = [], isLoading: invitesLoading } = useQuery({
    queryKey: QUERY_KEYS.teamInvites(user?.id),
    queryFn: async () => {
      return await base44.entities.TeamMember.filter({ 
        user_id: user.id, 
        status: 'pending' 
      });
    },
    ...CACHE_STRATEGIES.REALTIME,
    enabled: !!user,
  });

  // Fetch cups count using shared query key with OPTIMIZED caching
  const { data: cupsData = [] } = useQuery({
    queryKey: CUPS_QUERY_KEY,
    queryFn: async () => {
      const cups = await base44.entities.Cup.list('-created_date');
      return cups.filter(c => c.is_public !== false);
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  const cupsCount = cupsData.length;

  // Process friendships data
  const friendsAccepted = (friendships || [])
    .filter(f => f && f.status === 'accepted')
    .map(f => {
      const friendId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
      return (allUsers || []).find(u => u && u.id === friendId);
    })
    .filter(Boolean);

  const incomingRequests = (friendships || []).filter(f => 
    f && f.status === 'pending' && f.addressee_id === user?.id
  );

  const isLoading = userLoading || usersLoading || teamsLoading || friendshipsLoading;

  const handleAddFriend = async (targetId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const existing = (friendships || []).find(f =>
        f && ((f.requester_id === user.id && f.addressee_id === targetId) ||
        (f.requester_id === targetId && f.addressee_id === user.id))
      );

      if (existing) {
        if (existing.status === 'accepted') {
          await alert('Redan vänner', 'Ni är redan vänner!', { type: 'info' });
          return;
        }
        if (existing.status === 'pending') {
          if (existing.requester_id === user.id) {
            await alert('Förfrågan skickad', 'Du har redan skickat en vänförfrågan!', { type: 'info' });
          } else {
            const shouldAccept = await confirm(
              'Acceptera vänförfrågan',
              'Denna person har skickat dig en vänförfrågan. Vill du acceptera?',
              { type: 'confirm', confirmText: 'Acceptera', cancelText: 'Senare' }
            );
            if (shouldAccept) {
              await base44.entities.Friendship.update(existing.id, { status: 'accepted' });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
              
              await alert(
                'Nya vänner! 🎉',
                'Ni är nu vänner!',
                { type: 'success' }
              );
            }
          }
          return;
        }
      }

      await base44.entities.Friendship.create({
        requester_id: user.id,
        addressee_id: targetId,
        status: 'pending'
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
      
      await alert(
        'Vänförfrågan skickad! 🤝',
        'Din vänförfrågan har skickats!',
        { type: 'success' }
      );
      
    } catch (error) {
      console.error("Error adding friend:", error);
      await alert('Ett fel uppstod', 'Kunde inte skicka vänförfrågan.', { type: 'alert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptFriend = async (requestId) => {
    try {
      await base44.entities.Friendship.update(requestId, { status: 'accepted' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
      
      await alert('Nya vänner! 🎉', 'Ni är nu vänner!', { type: 'success' });
    } catch (error) {
      console.error("Error accepting friend:", error);
      await alert('Ett fel uppstod', 'Kunde inte acceptera förfrågan.', { type: 'alert' });
    }
  };

  const handleDeclineFriend = async (requestId) => {
    const shouldDecline = await confirm(
      'Neka vänförfrågan',
      'Är du säker på att du vill neka denna vänförfrågan?',
      { type: 'warning', confirmText: 'Neka', cancelText: 'Avbryt' }
    );

    if (!shouldDecline) return;

    try {
      await base44.entities.Friendship.delete(requestId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
    } catch (error) {
      console.error("Error declining friend:", error);
      await alert('Ett fel uppstod', 'Kunde inte neka förfrågan.', { type: 'alert' });
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      const response = await base44.functions.invoke('teams/createTeam', teamData);
      
      setShowCreateTeamForm(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publicTeams });
      
      await alert('Lag skapat! 🎉', `${teamData.name} har skapats!`, { type: 'success' });
    } catch (error) {
      console.error("Error creating team:", error);
      await alert('Ett fel uppstod', 'Kunde inte skapa laget.', { type: 'alert' });
    }
  };

  const handleAcceptTeamInvite = async (inviteId) => {
    try {
      await base44.entities.TeamMember.update(inviteId, { status: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamInvites(user.id) });
      
      await alert('Välkommen till laget! 🎉', 'Du är nu medlem i laget!', { type: 'success' });
    } catch (error) {
      console.error("Error accepting team invite:", error);
      await alert('Ett fel uppstod', 'Kunde inte acceptera inbjudan.', { type: 'alert' });
    }
  };

  const handleStatCardClick = (destination) => {
    if (destination === 'cups') {
      setActiveTab('cups');
    }
  };

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      {/* Create Team Modal */}
      {showCreateTeamForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-0">
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] h-[85vh] lg:h-auto lg:max-h-[85vh] mb-16 lg:mb-0 overflow-hidden"
            >
            <Suspense fallback={<AppLoading />}>
              <CreateTeamForm
                user={user}
                onSubmit={handleCreateTeam}
                onCancel={() => setShowCreateTeamForm(false)}
              />
            </Suspense>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Premium Hero Card - Improved UI */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7),0_0_40px_0px_rgba(43,168,74,0.1)] border border-[#2BA84A]/20 bg-[#0A0D0B]"
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

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
            {/* Enhanced Header with Logo - Aligned horizontally */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
              
              {/* Logo with 3D Effect - Same frame on all sizes */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotateY: -30 }}
                animate={{ 
                  scale: 1,
                  opacity: 1,
                  rotateY: 0
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut"
                }}
                className="relative group flex-shrink-0"
              >
                {/* Epic Glow */}
                <motion.div 
                  className="absolute -inset-6 bg-gradient-to-r from-[#2BA84A]/50 via-[#248232]/50 to-[#2BA84A]/50 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                {/* Logo Frame - Small border on all sizes */}
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-40 lg:h-40 rounded-3xl overflow-hidden border-2 border-[#FFFFFF]/30 shadow-[0_20px_60px_rgba(43,168,74,0.4)] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm transform group-hover:rotate-3 transition-transform duration-500 flex items-center justify-center">
                  {user?.profile_image_url ? (
                    <img 
                      src={user.profile_image_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png" 
                      alt="AllPlay" 
                      className="w-3/4 h-3/4 object-contain transform group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                </div>
              </motion.div>

              {/* Title Section - Aligned with logo */}
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl sm:text-3xl lg:text-5xl font-black text-white tracking-tight mb-1 sm:mb-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                >
                  Community 🤝
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/90 text-xs sm:text-sm lg:text-xl font-medium leading-relaxed"
                >
                  Hitta spelare, bygg lag och väx tillsammans
                </motion.p>
              </div>
            </div>

            {/* Premium Stats Grid - Centered numbers and fixed icon positions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-5 mb-4 sm:mb-6 lg:mb-8"
            >
              <motion.div 
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/30 to-[#248232]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-[#1A201D]/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#2BA84A]/20 hover:border-[#2BA84A]/50 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center ring-2 ring-[#2BA84A]/30 flex-shrink-0">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#86EFAC]" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-2xl sm:text-3xl lg:text-4xl drop-shadow-lg leading-none">
                        {friendsAccepted.length}
                      </p>
                      <span className="text-white/70 text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block">Vänner</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#9370DB]/30 to-[#7C3AED]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-[#1F1829]/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#9370DB]/20 hover:border-[#9370DB]/50 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-[#9370DB]/20 flex items-center justify-center ring-2 ring-[#9370DB]/30 flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#DDD6FE]" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-2xl sm:text-3xl lg:text-4xl drop-shadow-lg leading-none">
                        {myTeams.length}
                      </p>
                      <span className="text-white/70 text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block">Lag</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/30 to-[#D97706]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-[#2A2208]/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#F59E0B]/20 hover:border-[#F59E0B]/50 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center ring-2 ring-[#F59E0B]/30 flex-shrink-0">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#FCD34D]" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-2xl sm:text-3xl lg:text-4xl drop-shadow-lg leading-none">
                        {cupsCount}
                      </p>
                      <span className="text-white/70 text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block">Cuper</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Action Buttons - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4"
            >
              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('find')}
                className="h-12 sm:h-12 lg:h-14 w-full bg-gradient-to-r from-[#FFFFFF]/20 to-[#FFFFFF]/10 hover:from-[#FFFFFF]/30 hover:to-[#FFFFFF]/20 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-white font-black text-sm sm:text-sm lg:text-base transition-all shadow-xl"
              >
                <UserPlus className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                <span>Hitta spelare</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('teams')}
                className="h-12 sm:h-12 lg:h-14 w-full bg-gradient-to-r from-[#FFFFFF]/20 to-[#FFFFFF]/10 hover:from-[#FFFFFF]/30 hover:to-[#FFFFFF]/20 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-white font-black text-sm sm:text-sm lg:text-base transition-all shadow-xl"
              >
                <Target className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                <span>Mina Lag</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs - Dynamic colors based on active tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-2 bg-transparent border-0 p-0">
            <TabsTrigger 
              value="friends" 
              className={`gap-2 h-12 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'friends' ? TAB_COLORS.friends.active : TAB_COLORS.friends.inactive
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'friends' ? TAB_COLORS.friends.icon : ''}`} />
              <span className="hidden sm:inline">Vänner</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className={`gap-2 h-12 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'teams' ? TAB_COLORS.teams.active : TAB_COLORS.teams.inactive
              }`}
            >
              <Target className={`w-4 h-4 ${activeTab === 'teams' ? TAB_COLORS.teams.icon : ''}`} />
              <span className="hidden sm:inline">Lag</span>
            </TabsTrigger>
            <TabsTrigger 
              value="find" 
              className={`gap-2 h-12 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'find' ? TAB_COLORS.find.active : TAB_COLORS.find.inactive
              }`}
            >
              <Search className={`w-4 h-4 ${activeTab === 'find' ? TAB_COLORS.find.icon : ''}`} />
              <span className="hidden sm:inline">Hitta</span>
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className={`gap-2 h-12 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'feedback' ? TAB_COLORS.feedback.active : TAB_COLORS.feedback.inactive
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'feedback' ? TAB_COLORS.feedback.icon : ''}`} />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cups" 
              className={`gap-2 h-12 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'cups' ? TAB_COLORS.cups.active : TAB_COLORS.cups.inactive
              }`}
            >
              <Trophy className={`w-4 h-4 ${activeTab === 'cups' ? TAB_COLORS.cups.icon : ''}`} />
              <span className="hidden sm:inline">Cuper</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent key="friends" value="friends">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                >
                <Suspense fallback={<AppLoading />}>
                  <FriendsList
                    friends={friendsAccepted}
                    incomingRequests={incomingRequests}
                    onAcceptRequest={handleAcceptFriend}
                    onDeclineRequest={handleDeclineFriend}
                  />
                </Suspense>
              </motion.div>
            </TabsContent>

            <TabsContent key="teams" value="teams">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Suspense fallback={<AppLoading />}>
                  {!allTeams || allTeams.length === 0 ? (
                    <NoTeamsFound onCreateTeam={() => setShowCreateTeamForm(true)} />
                  ) : (
                    <TeamsList
                      teams={allTeams}
                      myTeams={myTeams}
                      teamInvites={teamInvites}
                      user={user}
                      onCreateTeam={() => setShowCreateTeamForm(true)}
                      onAcceptInvite={handleAcceptTeamInvite}
                    />
                  )}
                </Suspense>
              </motion.div>
            </TabsContent>

            <TabsContent key="find" value="find">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Suspense fallback={<AppLoading />}>
                  <FindPlayers
                    friendships={friendships}
                    currentUser={user}
                    onAddFriend={handleAddFriend}
                  />
                </Suspense>
              </motion.div>
            </TabsContent>

            <TabsContent key="feedback" value="feedback">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Link to={createPageUrl("Feedback")}>
                  <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-12 hover:border-[#4169E1]/30 transition-all cursor-pointer">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4169E1]/20 to-[#3457D5]/10 flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-[#4169E1]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#F4F7F5] mb-2">Feedback & Idéer</h3>
                      <p className="text-[#B6C2BC] mb-6">Dela dina tankar och hjälp oss förbättra AllPlay</p>
                      <Button className="bg-[#4169E1] hover:bg-[#3457D5] text-white px-6 py-3 text-base font-semibold rounded-xl">
                        Dela dina idéer
                      </Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </TabsContent>

            <TabsContent key="cups" value="cups">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Suspense fallback={<AppLoading />}>
                  <CupsOverview user={user} />
                </Suspense>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Floating Create Team Button - Dynamic color based on active tab */}
      {activeTab === 'teams' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateTeamForm(true)}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-[#9370DB] hover:bg-[#7C3AED] text-white rounded-full shadow-[0_4px_16px_rgba(147,112,219,0.4)] ring-2 ring-[#9370DB]/20 hover:ring-[#9370DB]/40 flex items-center justify-center z-40 transition-all duration-200"
        >
          <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
}
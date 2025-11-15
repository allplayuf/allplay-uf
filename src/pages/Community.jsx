import React, { useState, useEffect, Suspense, lazy } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  // Fetch public users via backend with OPTIMIZED caching
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: QUERY_KEYS.publicUsers,
    queryFn: async () => {
      const response = await base44.functions.invoke('getPublicUsers');
      return response.data.users || [];
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  // Fetch public teams via backend with OPTIMIZED caching
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: QUERY_KEYS.publicTeams,
    queryFn: async () => {
      const response = await base44.functions.invoke('getPublicTeams');
      const teams = response.data.teams || [];
      return user?.role === 'admin' ? teams : teams.filter(t => t.is_active !== false);
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  // Fetch friendships with OPTIMIZED caching
  const { data: friendships = [], isLoading: friendshipsLoading } = useQuery({
    queryKey: QUERY_KEYS.friendships,
    queryFn: async () => {
      const allFriendships = await base44.entities.Friendship.list();
      return allFriendships.filter(f => 
        f.requester_id === user.id || f.addressee_id === user.id
      );
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
    return <PageLoadingSkeleton />;
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
            <Suspense fallback={<PageLoadingSkeleton />}>
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
        
        {/* REDESIGNED HERO CARD - COMMUNITY THEME */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          {/* Gradient Background with Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2BA84A] via-[#248232] to-[#1A6029]"></div>
          
          {/* Animated Gradient Overlay */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Decorative Elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#0A1F11]/40 rounded-full blur-3xl"></div>
          
          {/* Floating Particles */}
          <motion.div
            className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-20 right-32 w-3 h-3 bg-white/30 rounded-full"
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute bottom-24 left-1/3 w-2 h-2 bg-white/35 rounded-full"
            animate={{
              y: [0, -25, 0],
              opacity: [0.35, 0.7, 0.35]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          <div className="relative z-10 p-5 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Profile Image with Glow */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative flex-shrink-0"
                >
                  <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl"></div>
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-2xl overflow-hidden">
                    {user?.profile_image_url ? (
                      <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                        {user?.full_name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  {/* Online Indicator */}
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#10B981] rounded-full border-2 border-white shadow-lg"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-xl sm:text-2xl lg:text-[32px] lg:leading-[40px] font-bold text-white mb-1 drop-shadow-lg">
                      Community 🤝
                    </h1>
                    <p className="text-white/90 text-xs sm:text-sm lg:text-base font-medium drop-shadow">
                      Hitta spelare, bygg lag och väx tillsammans
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden lg:flex items-center gap-2"
              >
                <Button
                  onClick={() => setActiveTab('find')}
                  className="bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 h-10 px-4 rounded-xl font-semibold shadow-lg"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Hitta spelare
                </Button>
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/30 shadow-xl hover:border-white/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                    {friendsAccepted.length}
                  </div>
                  <div className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Vänner
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.03, y: -2 }}
                onClick={() => setActiveTab('teams')}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#9370DB]/30 to-[#7C3AED]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/30 shadow-xl hover:border-[#DDD6FE]/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#9370DB]/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                    {myTeams.length}
                  </div>
                  <div className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Mina Lag
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.03, y: -2 }}
                onClick={() => handleStatCardClick('cups')}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/30 to-[#D97706]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/30 shadow-xl hover:border-[#FCD34D]/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F59E0B]/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-lg flex items-center gap-2">
                    {cupsCount}
                    {cupsCount > 0 && (
                      <motion.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                      >
                        🏆
                      </motion.span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Aktiva Cuper
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Quick Links - MOBILE ONLY */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:hidden mt-4 flex gap-2"
            >
              <button
                onClick={() => setActiveTab('find')}
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 py-2 rounded-xl font-semibold text-xs shadow-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                Hitta spelare
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 py-2 rounded-xl font-semibold text-xs shadow-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              >
                <Target className="w-3.5 h-3.5" />
                Mina Lag
              </button>
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
                <Suspense fallback={<PageLoadingSkeleton />}>
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
                <Suspense fallback={<PageLoadingSkeleton />}>
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
                <Suspense fallback={<PageLoadingSkeleton />}>
                  {!allUsers || allUsers.length === 0 ? (
                    <NoPlayersFound />
                  ) : (
                    <FindPlayers
                      allUsers={allUsers}
                      friendships={friendships}
                      currentUser={user}
                      onAddFriend={handleAddFriend}
                    />
                  )}
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
                <Suspense fallback={<PageLoadingSkeleton />}>
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
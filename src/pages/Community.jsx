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
    ...CACHE_STRATEGIES.DYNAMIC, // Use DYNAMIC to ensure fresh data on mount
    refetchOnMount: true,
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
        
        {/* Green Hero Card (Restored Style) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="relative overflow-hidden rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-0">
            {/* Animated Background Gradient */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-[#2BA84A] via-[#248232] to-[#1A6029]"
              animate={{
                background: [
                  'linear-gradient(135deg, #2BA84A 0%, #248232 50%, #1A6029 100%)',
                  'linear-gradient(135deg, #248232 0%, #1A6029 50%, #2BA84A 100%)',
                  'linear-gradient(135deg, #2BA84A 0%, #248232 50%, #1A6029 100%)'
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* GREEN RINGS */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-2 border-white/10"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border-2 border-white/10"
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Animated Orbs */}
            <motion.div
              className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-10 left-10 w-40 h-40 bg-[#0F2917]/60 rounded-full blur-3xl"
              animate={{
                x: [0, -20, 0],
                y: [0, 20, 0],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Floating Particles */}
            <motion.div
              className="absolute top-20 left-20 w-2 h-2 bg-white/40 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="relative z-10">
               {/* Header Section */}
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/30 shadow-lg">
                    {user?.profile_image_url ? (
                      <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png" 
                        alt="AllPlay" 
                        className="w-full h-full object-contain p-2"
                      />
                    )}
                  </div>
                  <div>
                     <h1 className="text-3xl font-bold text-white flex items-center gap-2">Community 🤝</h1>
                     <p className="text-white/90 font-medium">Hitta spelare, bygg lag och väx tillsammans</p>
                  </div>
               </div>

               {/* Stats Cards Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Friends Card */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all">
                     <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3 text-white">
                        <Users className="w-5 h-5" />
                     </div>
                     <div className="text-4xl font-bold text-white mb-1">{friendsAccepted.length}</div>
                     <div className="text-xs font-bold text-white/70 uppercase tracking-wider">VÄNNER</div>
                  </div>

                  {/* Teams Card */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all">
                     <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3 text-white">
                        <Target className="w-5 h-5" />
                     </div>
                     <div className="text-4xl font-bold text-white mb-1">{myTeams.length}</div>
                     <div className="text-xs font-bold text-white/70 uppercase tracking-wider">MINA LAG</div>
                  </div>

                  {/* Cups Card */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all">
                     <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3 text-white">
                        <Trophy className="w-5 h-5" />
                     </div>
                     <div className="text-4xl font-bold text-white mb-1">{cupsCount}</div>
                     <div className="text-xs font-bold text-white/70 uppercase tracking-wider">AKTIVA CUPER</div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('find')}
                    className="h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] group"
                  >
                     <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                     Hitta spelare
                  </button>
                  <button 
                    onClick={() => setActiveTab('teams')}
                    className="h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] group"
                  >
                     <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                     Mina Lag
                  </button>
               </div>
            </div>
          </Card>
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
                      onLoadMore={fetchNextPage}
                      hasMore={hasNextPage}
                      isLoadingMore={isFetchingNextPage}
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
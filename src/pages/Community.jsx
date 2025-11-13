import React, { useState, useEffect, Suspense, lazy } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, UserPlus, Trophy, Plus, Search, Target, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { NoPlayersFound, NoTeamsFound } from "../components/ui/empty-state";

const FriendsList = lazy(() => import("../components/community/FriendsList"));
const TeamDiscovery = lazy(() => import("../components/community/TeamDiscovery"));
const FindPlayers = lazy(() => import("../components/community/FindPlayers"));
const CreateTeamForm = lazy(() => import("../components/teams/CreateTeamForm"));

// Query keys
const QUERY_KEYS = {
  user: ['user'],
  publicUsers: ['publicUsers'],
  publicTeams: ['publicTeams'],
  friendships: ['friendships'],
  teamMembers: (userId) => ['teamMembers', userId],
  teamInvites: (userId) => ['teamInvites', userId],
  feedbackCount: ['feedbackCount'],
};

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('friends');
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  // Fetch current user with aggressive caching
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      
      // Update cityNormalized if needed
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
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  // Handle rate limit errors
  useEffect(() => {
    if (userError?.message?.includes('rate limit') || userError?.message?.includes('Rate limit')) {
      alert('För många förfrågningar', 'Vänta en stund och försök igen.', { type: 'alert' });
    }
  }, [userError, alert]);

  // Fetch public users via backend (cached)
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: QUERY_KEYS.publicUsers,
    queryFn: async () => {
      const response = await base44.functions.invoke('getPublicUsers');
      return response.data.users || [];
    },
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Fetch public teams via backend (cached)
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: QUERY_KEYS.publicTeams,
    queryFn: async () => {
      const response = await base44.functions.invoke('getPublicTeams');
      const teams = response.data.teams || [];
      return user?.role === 'admin' ? teams : teams.filter(t => t.is_active !== false);
    },
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Fetch friendships (cached)
  const { data: friendships = [], isLoading: friendshipsLoading } = useQuery({
    queryKey: QUERY_KEYS.friendships,
    queryFn: async () => {
      const allFriendships = await base44.entities.Friendship.list();
      return allFriendships.filter(f => 
        f.requester_id === user.id || f.addressee_id === user.id
      );
    },
    staleTime: 30 * 1000,
    enabled: !!user,
  });

  // Fetch user's teams (cached)
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
    staleTime: 60 * 1000,
    enabled: !!user && allTeams.length > 0,
  });

  // Fetch team invites (cached)
  const { data: teamInvites = [], isLoading: invitesLoading } = useQuery({
    queryKey: QUERY_KEYS.teamInvites(user?.id),
    queryFn: async () => {
      return await base44.entities.TeamMember.filter({ 
        user_id: user.id, 
        status: 'pending' 
      });
    },
    staleTime: 30 * 1000,
    enabled: !!user,
  });

  // Fetch feedback posts count
  const { data: feedbackCount = 0 } = useQuery({
    queryKey: QUERY_KEYS.feedbackCount,
    queryFn: async () => {
      const response = await base44.functions.invoke('feedback/getPosts', {
        sort: 'top',
        limit: 100
      });
      return response.data.posts?.length || 0;
    },
    staleTime: 60 * 1000,
    enabled: !!user,
  });

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
    if (destination === 'feedback') {
      setActiveTab('feedback');
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-[#2BA84A]/10 to-[#0F2917]/20 border border-[#2BA84A]/30 rounded-[20px] p-6 shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5]">Community</h1>
                <p className="text-sm text-[#B6C2BC] mt-1">Anslut, spela och ha kul tillsammans</p>
              </div>
              <Users className="w-12 h-12 text-[#2BA84A]/40" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-[#121715]/50 rounded-xl text-center">
                <p className="text-2xl font-bold text-[#F4F7F5]">{friendsAccepted.length}</p>
                <p className="text-xs text-[#B6C2BC]">Vänner</p>
              </div>
              <div className="p-4 bg-[#121715]/50 rounded-xl text-center">
                <p className="text-2xl font-bold text-[#F4F7F5]">{myTeams.length}</p>
                <p className="text-xs text-[#B6C2BC]">Lag</p>
              </div>
              <div 
                className="p-4 bg-[#121715]/50 rounded-xl text-center cursor-pointer hover:bg-[#18221E] transition-colors"
                onClick={() => handleStatCardClick('feedback')}
              >
                <p className="text-2xl font-bold text-[#F4F7F5]">{feedbackCount}</p>
                <p className="text-xs text-[#B6C2BC]">Feedback</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-2 bg-[#121715] border border-[#223029] p-2 rounded-xl">
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Vänner</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="discover-teams" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Lag</span>
            </TabsTrigger>
            <TabsTrigger value="find" className="gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Spelare</span>
            </TabsTrigger>
            <TabsTrigger value="cups" className="gap-2">
              <Trophy className="w-4 h-4" />
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

            <TabsContent key="feedback" value="feedback">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Link to={createPageUrl("Feedback")}>
                  <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-12 hover:border-[#2BA84A]/30 transition-all cursor-pointer">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-[#2BA84A] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#F4F7F5] mb-2">Feedback & Idéer</h3>
                      <p className="text-[#B6C2BC] mb-4">Dela dina tankar och hjälp oss förbättra AllPlay</p>
                      <Badge className="bg-[#2BA84A]/20 text-[#2BA84A]">{feedbackCount} aktiva förslag</Badge>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </TabsContent>

            <TabsContent key="discover-teams" value="discover-teams">
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
                    <TeamDiscovery
                      teams={allTeams}
                      myTeams={myTeams}
                      user={user}
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

            {/* NEW: Cups Tab */}
            <TabsContent key="cups" value="cups">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Link to={createPageUrl("Cups")}>
                  <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-12 hover:border-[#F4743B]/30 transition-all cursor-pointer">
                    <div className="text-center">
                      <Trophy className="w-16 h-16 text-[#F4743B] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#F4F7F5] mb-2">Turneringar</h3>
                      <p className="text-[#B6C2BC] mb-4">Tävla i organiserade turneringar och cuper</p>
                      <Badge className="bg-[#F4743B]/20 text-[#F4743B]">Upptäck turneringar</Badge>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Floating Create Team Button (only on teams tab) */}
      {activeTab === 'discover-teams' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateTeamForm(true)}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-full shadow-[0_8px_24px_rgba(43,168,74,0.4)] flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
}
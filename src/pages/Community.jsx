
import React, { useState, useEffect, Suspense, lazy } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
// Removed direct import of Friendship and TeamMember as they will now be accessed via base44.entities
// import { Friendship } from "@/entities/Friendship";
// import { TeamMember } from "@/entities/Team";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Search, Shield, Trophy, Plus, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import { NoPlayersFound, NoTeamsFound } from "../components/ui/empty-state";

// Lazy load heavy components
const FriendsList = lazy(() => import("../components/community/FriendsList"));
const TeamsList = lazy(() => import("../components/community/TeamsList"));
const FindPlayers = lazy(() => import("../components/community/FindPlayers"));
const TeamDiscovery = lazy(() => import("../components/teams/TeamDiscovery"));
const CreateTeamForm = lazy(() => import("../components/teams/CreateTeamForm"));
const FeedbackPage = lazy(() => import("../pages/Feedback"));

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

  // Fetch public teams via backend (cached) - RESTORED TO ORIGINAL
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
      const allFriendships = await base44.entities.Friendship.list(); // Updated to use base44.entities.Friendship
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
      const teamMemberships = await base44.entities.TeamMember.filter({ // Updated to use base44.entities.TeamMember
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
      return await base44.entities.TeamMember.filter({ // Updated to use base44.entities.TeamMember
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

  // Process friendships data - ADD SAFETY CHECKS
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
              await base44.entities.Friendship.update(existing.id, { status: 'accepted' }); // Updated
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

      await base44.entities.Friendship.create({ // Updated
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

  const handleAcceptFriend = async (friendshipId) => {
    try {
      await base44.entities.Friendship.update(friendshipId, { status: 'accepted' }); // Updated
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
      
      await alert(
        'Nya vänner! 🎉',
        'Ni är nu vänner!',
        { type: 'success' }
      );
    } catch (error) {
      console.error('Error accepting friend:', error);
      await alert('Kunde inte acceptera', 'Försök igen.', { type: 'alert' });
    }
  };

  const handleDeclineFriend = async (friendshipId) => {
    const shouldDecline = await confirm(
      'Neka vänförfrågan',
      'Är du säker?',
      { type: 'warning', confirmText: 'Ja, neka', cancelText: 'Avbryt' }
    );

    if (shouldDecline) {
      try {
        await base44.entities.Friendship.delete(friendshipId); // Updated
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
      } catch (error) {
        console.error('Error declining friend:', error);
      }
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      const newTeam = await base44.entities.Team.create({
        ...teamData,
        captain_id: user.id,
        current_members: 1,
        matches_played: 0,
        wins: 0,
        losses: 0,
        draws: 0
      });

      await base44.entities.TeamMember.create({ // Updated
        team_id: newTeam.id,
        user_id: user.id,
        role: 'captain',
        status: 'active'
      });

      setShowCreateTeamForm(false);
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publicTeams });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamMembers(user.id) });
    } catch (error) {
      console.error("Error creating team:", error);
      await alert('Kunde inte skapa lag', 'Försök igen.', { type: 'alert' });
    }
  };

  const handleAcceptTeamInvite = async (inviteId) => {
    try {
      await base44.entities.TeamMember.update(inviteId, { status: 'active' }); // Updated
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamInvites(user.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamMembers(user.id) });
    } catch (error) {
      console.error("Error accepting team invite:", error);
      await alert('Kunde inte acceptera', 'Försök igen.', { type: 'alert' });
    }
  };

  const handleStatCardClick = (tab) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[16px] lg:rounded-[20px] p-5 sm:p-6 lg:p-8 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029] mb-6 lg:mb-8"
        >
          <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full"></div>
          <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full"></div>
          
          <div className="relative z-10 space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-[28px] lg:leading-[34px] font-semibold text-[#EAF6EE] mb-2 flex items-center gap-3">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#EAF6EE]" />
                Community
              </h1>
              <p className="text-[13px] leading-[18px] sm:text-[14px] sm:leading-[20px] text-[#CFE8D6]">
                Anslut med spelare, hitta vänner och gå med i lag. Tillsammans är vi starkare! ⚽
              </p>
            </div>

            {/* Integrated Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <motion.button
                onClick={() => handleStatCardClick('friends')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <div className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#FFFFFF]/20 text-center transition-all hover:bg-[#FFFFFF]/15 hover:border-[#FFFFFF]/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFFFFF]/15 rounded-xl flex items-center justify-center mx-auto mb-2 ring-1 ring-[#FFFFFF]/30 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAF6EE]" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#EAF6EE] mb-1">{friendsAccepted.length}</div>
                  <div className="text-[11px] leading-[16px] sm:text-[12px] text-[#CFE8D6]/70 font-medium">Vänner</div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => handleStatCardClick('feedback')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <div className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#FFFFFF]/20 text-center transition-all hover:bg-[#FFFFFF]/15 hover:border-[#FFFFFF]/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFFFFF]/15 rounded-xl flex items-center justify-center mx-auto mb-2 ring-1 ring-[#FFFFFF]/30 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAF6EE]" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#EAF6EE] mb-1">{feedbackCount}</div>
                  <div className="text-[11px] leading-[16px] sm:text-[12px] text-[#CFE8D6]/70 font-medium">Feedback</div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => handleStatCardClick('find')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <div className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#FFFFFF]/20 text-center transition-all hover:bg-[#FFFFFF]/15 hover:border-[#FFFFFF]/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFFFFF]/15 rounded-xl flex items-center justify-center mx-auto mb-2 ring-1 ring-[#FFFFFF]/30 group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4743B]" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#EAF6EE] mb-1">{allUsers.length}</div>
                  <div className="text-[11px] leading-[16px] sm:text-[12px] text-[#CFE8D6]/70 font-medium">Aktiva</div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Create Team Modal */}
        <AnimatePresence>
          {showCreateTeamForm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] h-[80vh] lg:h-auto lg:max-h-[85vh] mb-16 lg:mb-0 lg:my-8 overflow-hidden flex flex-col"
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
        </AnimatePresence>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#121715] p-1 border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] grid grid-cols-4 w-full rounded-[16px]">
            <TabsTrigger value="friends" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold text-[12px] leading-[16px] sm:text-[13px] sm:leading-[18px] px-2 rounded-[14px] transition-all">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Vänner</span>
            </TabsTrigger>
            
            <TabsTrigger value="feedback" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold text-[12px] leading-[16px] sm:text-[13px] sm:leading-[18px] px-2 rounded-[14px] transition-all">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>

            <TabsTrigger value="discover-teams" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold text-[12px] leading-[16px] sm:text-[13px] sm:leading-[18px] px-2 rounded-[14px] transition-all">
              <Shield className="w-4 h-4" /> {/* Changed from Search to Shield */}
              <span className="hidden sm:inline">Lag</span> {/* Changed from Hitta lag to Lag */}
            </TabsTrigger>
            
            <TabsTrigger value="find" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] font-semibold text-[12px] leading-[16px] sm:text-[13px] sm:leading-[18px] px-2 rounded-[14px] transition-all">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Spelare</span>
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
                    user={user} 
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships })}
                    incomingFriendships={incomingRequests}
                    onAcceptFriend={handleAcceptFriend}
                    onDeclineFriend={handleDeclineFriend}
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
                <Suspense fallback={<PageLoadingSkeleton />}>
                  <FeedbackPage />
                </Suspense>
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
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Floating "+ Skapa nytt lag" Button */}
      {activeTab === 'discover-teams' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateTeamForm(true)}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] hover:from-[#A569C6] hover:to-[#9E44AD] text-white rounded-full shadow-[0_8px_24px_rgba(155,89,182,0.4)] flex items-center justify-center z-[60] transition-all"
        >
          <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
}

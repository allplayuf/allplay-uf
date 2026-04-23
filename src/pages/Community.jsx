import React, { useState, useEffect, Suspense, lazy } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL, getAuthHeaders } from "@/components/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Trophy, Plus, Search, Target, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TRANSITIONS } from "../components/utils/motionTokens";
import { triggerHaptic } from "../components/utils/motionTokens";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HeroSkeleton } from "../components/ui/section-skeleton";
import { TabSkeleton, TabSkeletonGrid } from "../components/ui/tab-skeleton";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { NoPlayersFound, NoTeamsFound } from "../components/ui/empty-state";
import { CUPS_QUERY_KEY } from "../components/dashboard/CupsWidget";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { PullToRefresh } from "../components/ui/pull-to-refresh";
import { AuthGateModal } from "../components/ui/auth-gate-modal";
import { LoginModal } from "../components/supabase";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { getMyProfile, getTeams, getMyTeams, createSupabaseTeam } from "../components/supabase/services";
import { isCupsEnabled } from "../lib/featureFlags";

/**
 * Supabase REST helpers — inline since these tables (friendships, team_members,
 * cups) don't yet have dedicated service files. Same logic as before, just
 * using Supabase REST instead of Base44 SDK.
 */
async function restGet(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'GET', headers });
  if (!res.ok) throw new Error(`REST GET ${path} failed: ${res.status}`);
  return res.json();
}
async function restPatch(path, body) {
  const headers = await getAuthHeaders();
  headers['Prefer'] = 'return=representation';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`REST PATCH ${path} failed: ${res.status}`);
  return res.json();
}
async function restPost(path, body) {
  const headers = await getAuthHeaders();
  headers['Prefer'] = 'return=representation';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = new Error(`REST POST ${path} failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
async function restDelete(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error(`REST DELETE ${path} failed: ${res.status}`);
  return true;
}

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
    inactive: 'bg-[#121715] text-[#9EAAA4] hover:bg-[#18221E] hover:text-[#F4F7F5]',
    icon: 'text-[#2BA84A]',
    iconInactive: ''
  },
  teams: {
    active: 'bg-[#9370DB]/16 text-[#DDD6FE] ring-1 ring-[#9370DB]/30',
    inactive: 'bg-[#121715] text-[#9EAAA4] hover:bg-[#18221E] hover:text-[#F4F7F5]',
    icon: 'text-[#DDD6FE]',
    iconInactive: ''
  },
  find: {
    active: 'bg-[#2BA84A]/16 text-[#2BA84A] ring-1 ring-[#2BA84A]/30',
    inactive: 'bg-[#121715] text-[#9EAAA4] hover:bg-[#18221E] hover:text-[#F4F7F5]',
    icon: 'text-[#2BA84A]',
    iconInactive: ''
  },
  cups: {
    active: 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30',
    inactive: 'bg-[#121715] text-[#9EAAA4] hover:bg-[#18221E] hover:text-[#F4F7F5]',
    icon: 'text-[#FCD34D]',
    iconInactive: ''
  }
};

export default function CommunityPage() {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const urlParams = new URLSearchParams(locationHook.search);
  const rawInitialTab = urlParams.get('tab') || 'friends';
  // If cups are disabled, redirect any 'cups' tab request to 'friends'
  const initialTab = (!isCupsEnabled() && rawInitialTab === 'cups') ? 'friends' : rawInitialTab;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  // Update tab from URL parameter
  useEffect(() => {
    const tab = urlParams.get('tab');
    if (tab && tab !== activeTab) {
      // Block cups tab when disabled
      if (!isCupsEnabled() && tab === 'cups') {
        setActiveTab('friends');
      } else {
        setActiveTab(tab);
      }
    }
  }, [locationHook.search, activeTab, urlParams]);

  const { user: authUser, isGuest: isGuestUser, isAuthenticated: isAuthenticatedUser, isLoading: authLoading } = useSupabaseAuth();

  // Fetch user profile from Supabase users table for profile_image_url etc.
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticatedUser && !!authUser?.id,
  });

  // Merge auth user with Supabase profile (consistent with Dashboard and Profile)
  const user = React.useMemo(() => {
    if (isGuestUser) {
      return { is_guest: true, display_name: 'Gäst', full_name: 'Gäst' };
    }
    if (!authUser) return null;
    return {
      ...authUser,
      ...userProfile,
      id: authUser.id,
      profile_image_url: userProfile?.profile_image_url || userProfile?.avatar_url || authUser?.profile_image_url || authUser?.avatar_url,
      display_name: userProfile?.display_name || userProfile?.full_name || authUser?.display_name || authUser?.full_name,
      full_name: userProfile?.full_name || userProfile?.display_name || authUser?.full_name || authUser?.display_name,
    };
  }, [authUser, userProfile, isGuestUser]);

  // Show loading until we know auth state AND have a user object (or confirmed guest)
  const userLoading = authLoading || (!isGuestUser && !user);
  const userError = null; // Errors handled by individual queries

  // Handle rate limit errors
  useEffect(() => {
    if (userError?.message?.includes('rate limit') || userError?.message?.includes('Rate limit')) {
      alert('För många förfrågningar', 'Vänta en stund och försök igen.', { type: 'alert' });
    }
  }, [userError, alert]);

  // allUsers used for friends lookup – fetch from Supabase REST
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: QUERY_KEYS.publicUsers,
    queryFn: async () => {
      const { searchPlayers } = await import("../components/supabase/services/playersService");
      const res = await searchPlayers({ limit: 200 });
      return res.players || [];
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  // Fetch teams from Supabase teams table (RLS enforced)
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: QUERY_KEYS.publicTeams,
    queryFn: async () => {
      const teams = await getTeams();
      return teams;
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    refetchOnMount: false,
    enabled: !!user,
  });

  // Fetch friendships with OPTIMIZED caching
  const { data: friendships = [], isLoading: friendshipsLoading } = useQuery({
    queryKey: QUERY_KEYS.friendships,
    queryFn: async () => {
      // Optimization: Fetch only relevant friendships instead of listing all
      const [sent, received] = await Promise.all([
        restGet(`friendships?requester_id=eq.${user.id}&select=*`),
        restGet(`friendships?addressee_id=eq.${user.id}&select=*`)
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

  // Fetch user's teams directly (JOIN team_members → teams in one query)
  const { data: myTeams = [], isLoading: myTeamsLoading } = useQuery({
    queryKey: QUERY_KEYS.teamMembers(user?.id),
    queryFn: () => getMyTeams(),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user && !isGuestUser,
  });

  // Fetch team invites with OPTIMIZED caching
  const { data: teamInvites = [], isLoading: invitesLoading } = useQuery({
    queryKey: QUERY_KEYS.teamInvites(user?.id),
    queryFn: async () => {
      return await restGet(`team_members?user_id=eq.${user.id}&status=eq.pending&select=*`);
    },
    ...CACHE_STRATEGIES.REALTIME,
    enabled: !!user,
  });

  // Fetch cups count using shared query key with OPTIMIZED caching
  // Disabled while CUPS_ENABLED is false — avoids unnecessary network calls.
  const { data: cupsData = [] } = useQuery({
    queryKey: CUPS_QUERY_KEY,
    queryFn: async () => {
      const cups = await restGet(`cups?select=*&order=created_date.desc`);
      return cups.filter(c => c.is_public !== false);
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user && isCupsEnabled(),
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

  // Don't block full page — hero skeleton handles user loading
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
              await restPatch(`friendships?id=eq.${existing.id}`, { status: 'accepted' });
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

      await restPost(`friendships`, {
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
      await restPatch(`friendships?id=eq.${requestId}`, { status: 'accepted' });
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
      await restDelete(`friendships?id=eq.${requestId}`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships });
    } catch (error) {
      console.error("Error declining friend:", error);
      await alert('Ett fel uppstod', 'Kunde inte neka förfrågan.', { type: 'alert' });
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      console.log('[Community] handleCreateTeam called with:', teamData.name, teamData.city);
      const result = await createSupabaseTeam(teamData);
      console.log('[Community] createTeam result:', JSON.stringify(result));
      
      setShowCreateTeamForm(false);
      
      // Invalidate both team lists so "Mina lag" and "Alla lag" update
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publicTeams }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamMembers(user?.id) }),
      ]);
      
      await alert('Lag skapat! ⚽', `${teamData.name} har skapats!`, { type: 'success' });

      // Navigate to team detail if we got an ID back
      const teamId = result?.team?.id || result?.team_id || result?.id;
      if (teamId) {
        navigate(`${createPageUrl("TeamOverview")}?id=${teamId}`);
      }
    } catch (error) {
      console.error("[Community] Error creating team:", error);
      const msg = error.status === 401
        ? 'Du måste vara inloggad.'
        : error.status === 409
          ? 'Ett lag med det namnet finns redan.'
          : (error.message || 'Kunde inte skapa laget. Försök igen.');
      await alert('Kunde inte skapa lag', msg, { type: 'alert' });
    }
  };

  const handleAcceptTeamInvite = async (inviteId) => {
    try {
      await restPatch(`team_members?id=eq.${inviteId}`, { status: 'active' });
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

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publicUsers }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publicTeams }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendships }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teamInvites(user?.id) }),
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY })
    ]);
  };

  // Guest users see a prompt to login
  if (isGuestUser || user?.is_guest) {
    return (
      <>
      <AuthGateModal 
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        onLogin={() => setShowLoginModal(true)}
        feature="hitta vänner, gå med i lag och delta i cuper"
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
          <h2 className="text-2xl font-bold text-[#F4F7F5] mb-3">Logga in för att se Community</h2>
          <p className="text-[#B6C2BC] mb-6">Skapa ett konto eller logga in för att hitta vänner, gå med i lag och delta i cuper.</p>
          <Button 
            onClick={() => setShowAuthGate(true)}
            className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white h-12 rounded-xl font-semibold"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Logga in / Skapa konto
          </Button>
        </Card>
      </div>
      </>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateTeamForm && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setShowCreateTeamForm(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] h-[85vh] lg:h-auto lg:max-h-[85vh] mb-16 lg:mb-0 overflow-hidden"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Premium Hero Card - show skeleton while auth loads */}
        {userLoading ? (
          <HeroSkeleton />
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[28px] border border-white/[0.06]"
          style={{
            background: 'linear-gradient(135deg, #151B18 0%, #111613 55%, #0C100E 100%)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Ambient glows — subtle, not bombastic */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#2BA84A]/18 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -left-20 w-64 h-64 bg-[#F4743B]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Hairline top highlight */}
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }}
          />

          <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            {/* Header row — compact & premium */}
            <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-7">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-2 bg-[#2BA84A]/25 rounded-full blur-lg pointer-events-none" />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-gradient-to-br from-[#1A201D] to-[#0F1513] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png"
                      alt="AllPlay"
                      className="w-3/4 h-3/4 object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 mb-1.5 px-2 py-0.5 rounded-full bg-[#2BA84A]/12 ring-1 ring-[#2BA84A]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C257]" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#86EFAC] uppercase tracking-wider">Community</span>
                </div>
                <h1 className="text-[22px] sm:text-[26px] lg:text-[34px] leading-[1.1] font-black text-white tracking-tight">
                  Hitta din nästa lagkamrat
                </h1>
                <p className="text-[12px] sm:text-[13px] lg:text-[14px] text-[#B6C2BC] font-medium mt-1.5 leading-relaxed">
                  Spelare, lag och vänner — på ett ställe
                </p>
              </div>
            </div>

            {/* Action pills — smaller, refined */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-2 sm:gap-3"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { triggerHaptic('light'); setActiveTab('find'); }}
                className="h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 text-white text-[13px] sm:text-[14px] font-bold transition-colors"
                style={{
                  background: 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)',
                  boxShadow: '0 6px 18px rgba(43,168,74,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                <UserPlus className="w-4 h-4" strokeWidth={2.4} />
                <span>Hitta spelare</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { triggerHaptic('light'); setActiveTab('teams'); }}
                className="h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 text-[#F5F8F6] text-[13px] sm:text-[14px] font-bold bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.09] transition-colors"
              >
                <Target className="w-4 h-4" strokeWidth={2.4} />
                <span>Mina lag</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
        )}

        {/* Tabs - Dynamic colors based on active tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid ${isCupsEnabled() ? 'grid-cols-4' : 'grid-cols-3'} gap-2 bg-transparent border-0 p-0`}>
            <TabsTrigger 
              value="friends" 
              className={`gap-1.5 h-12 rounded-2xl transition-all duration-200 font-semibold text-xs sm:text-sm ${
                activeTab === 'friends' ? TAB_COLORS.friends.active : TAB_COLORS.friends.inactive
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'friends' ? TAB_COLORS.friends.icon : ''}`} />
              <span>Vänner</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className={`gap-1.5 h-12 rounded-2xl transition-all duration-200 font-semibold text-xs sm:text-sm ${
                activeTab === 'teams' ? TAB_COLORS.teams.active : TAB_COLORS.teams.inactive
              }`}
            >
              <Target className={`w-4 h-4 ${activeTab === 'teams' ? TAB_COLORS.teams.icon : ''}`} />
              <span>Lag</span>
            </TabsTrigger>
            <TabsTrigger 
              value="find" 
              className={`gap-1.5 h-12 rounded-2xl transition-all duration-200 font-semibold text-xs sm:text-sm ${
                activeTab === 'find' ? TAB_COLORS.find.active : TAB_COLORS.find.inactive
              }`}
            >
              <Search className={`w-4 h-4 ${activeTab === 'find' ? TAB_COLORS.find.icon : ''}`} />
              <span>Hitta</span>
            </TabsTrigger>
            {isCupsEnabled() && (
              <TabsTrigger 
                value="cups" 
                className={`gap-1.5 h-12 rounded-2xl transition-all duration-200 font-semibold text-xs sm:text-sm ${
                  activeTab === 'cups' ? TAB_COLORS.cups.active : TAB_COLORS.cups.inactive
                }`}
              >
                <Trophy className={`w-4 h-4 ${activeTab === 'cups' ? TAB_COLORS.cups.icon : ''}`} />
                <span>Cuper</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="friends">
            <motion.div
              key="friends-content"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={TRANSITIONS.tab}
            >
              <Suspense fallback={<TabSkeletonGrid count={4} />}>
                <FriendsList
                  friends={friendsAccepted}
                  incomingRequests={incomingRequests}
                  onAcceptRequest={handleAcceptFriend}
                  onDeclineRequest={handleDeclineFriend}
                />
              </Suspense>
            </motion.div>
          </TabsContent>

          <TabsContent value="teams">
            <motion.div
              key="teams-content"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={TRANSITIONS.tab}
            >
              <Suspense fallback={<TabSkeleton rows={3} />}>
                <TeamsList
                  teams={allTeams}
                  myTeams={myTeams}
                  teamInvites={teamInvites}
                  user={user}
                  onCreateTeam={() => setShowCreateTeamForm(true)}
                  onAcceptInvite={handleAcceptTeamInvite}
                />
              </Suspense>
            </motion.div>
          </TabsContent>

          <TabsContent value="find">
            <motion.div
              key="find-content"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={TRANSITIONS.tab}
            >
              <Suspense fallback={<TabSkeletonGrid count={6} />}>
                <FindPlayers
                  friendships={friendships}
                  currentUser={user}
                  onAddFriend={handleAddFriend}
                />
              </Suspense>
            </motion.div>
          </TabsContent>

          {isCupsEnabled() && (
            <TabsContent value="cups">
              <motion.div
                key="cups-content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={TRANSITIONS.tab}
              >
                <Suspense fallback={<TabSkeleton rows={3} />}>
                  <CupsOverview user={user} />
                </Suspense>
              </motion.div>
            </TabsContent>
          )}
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
          onClick={() => { triggerHaptic('medium'); setShowCreateTeamForm(true); }}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-[#9370DB] hover:bg-[#7C3AED] text-white rounded-full shadow-[0_4px_16px_rgba(147,112,219,0.4)] ring-2 ring-[#9370DB]/20 hover:ring-[#9370DB]/40 flex items-center justify-center z-40 transition-all duration-200"
        >
          <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
    </PullToRefresh>
  );
}
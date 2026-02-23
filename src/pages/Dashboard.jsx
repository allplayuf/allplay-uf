import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { VARIANTS, TRANSITIONS, triggerHaptic } from "../components/utils/motionTokens";
import {
  Trophy,
  MapPin,
  Calendar,
  Users,
  PlayCircle,
  Award,
  ChevronRight,
  ArrowRight,
  Target,
  Clock,
  X,
  Plus,
  Zap,
  TrendingUp
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HeroSkeleton, MatchGridSkeleton, SectionSkeleton } from "../components/ui/section-skeleton";
import CreateMatchForm from "../components/matches/CreateMatchForm";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import CupsWidget from "../components/dashboard/CupsWidget";
import NearbyMatchesWidget from "../components/dashboard/NearbyMatchesWidget";
import MatchCard from "../components/matches/MatchCard";
import NotificationsSlider from "../components/dashboard/NotificationsSlider";
import NextMatchCard from "../components/dashboard/NextMatchCard";
import InboxWidget from "../components/dashboard/InboxWidget";
import { 
  createMatch as supabaseCreateMatch, 
  joinMatch as supabaseJoinMatch,
  upsertVenue,
  getVenues,
  getMyProfile,
} from "../components/supabase/services";
import { useMatchFeed, MATCH_FEED_KEY } from "../components/hooks/useMatchFeed";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { PullToRefresh } from "../components/ui/pull-to-refresh";
import { AuthGateModal } from "../components/ui/auth-gate-modal";
import { LoginModal } from "../components/supabase";

// Query keys
const QUERY_KEYS = {
  userProfile: ['supabase-userProfile'],
  venues: ['supabase-venues'],
  adminNotifications: ['adminNotifications']
};

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState(null);
  const [friendsInUpcomingMatchesCount, setFriendsInUpcomingMatchesCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: authUser, isGuest, isAuthenticated } = useSupabaseAuth();

  // Fetch user profile from Supabase users table
  const { data: userProfile, isLoading: userLoading, error: userError } = useQuery({
    queryKey: [...QUERY_KEYS.userProfile, authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id,
    retry: false,
  });

  // Combine auth user with profile - userProfile from Supabase users table has priority
  // authUser already has enriched metadata from AuthProvider
  const user = React.useMemo(() => {
    if (isGuest) {
      return { is_guest: true, display_name: 'Gäst', full_name: 'Gäst' };
    }
    if (!authUser) return null;
    
    // Merge: userProfile (Supabase users table) > authUser (enriched from AuthProvider)
    // localStorage fallback ensures avatar always displays even if backend is down
    const localAvatar = localStorage.getItem('allplay_profile_image');
    return {
      ...authUser,
      ...userProfile,
      id: authUser.id,
      // Profile from users table takes priority, then enriched authUser fields
      profile_image_url: userProfile?.profile_image_url || userProfile?.avatar_url || localAvatar || authUser?.profile_image_url || authUser?.avatar_url,
      display_name: userProfile?.display_name || userProfile?.full_name || authUser?.display_name || authUser?.full_name,
      full_name: userProfile?.full_name || userProfile?.display_name || authUser?.full_name || authUser?.display_name,
    };
  }, [authUser, userProfile, isGuest]);

  // Fetch all matches from Supabase
  const { data: allMatchesRaw = [], isLoading: matchesLoading } = useQuery({
    queryKey: QUERY_KEYS.matches,
    queryFn: async () => {
      const matches = await getPublicMatches({ status: 'upcoming' });
      return matches.map(transformMatchData);
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: true,
  });

  // Fetch venues from Supabase
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: QUERY_KEYS.venues,
    queryFn: () => getVenues(),
    ...CACHE_STRATEGIES.STATIC,
    enabled: true,
  });

  // Fetch user's participant match IDs from Supabase
  const { data: myParticipantMatchIds = [] } = useQuery({
    queryKey: [...QUERY_KEYS.myParticipantMatchIds, authUser?.id],
    queryFn: () => getMyParticipantMatchIds(),
    ...CACHE_STRATEGIES.REALTIME,
    enabled: isAuthenticated && !!authUser?.id,
  });

  // Get visible match IDs for fetching participants
  const visibleMatchIds = React.useMemo(() => {
    return allMatchesRaw.map(m => m.id);
  }, [allMatchesRaw]);

  // Fetch participants for visible matches
  const { data: allParticipants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['supabase-participantsForMatches', visibleMatchIds],
    queryFn: () => getParticipantsForMatches(visibleMatchIds),
    ...CACHE_STRATEGIES.REALTIME,
    enabled: visibleMatchIds.length > 0,
  });

  // Fetch admin notifications (keeping this as is for now - can be migrated later)
  const { data: adminNotifications = [] } = useQuery({
    queryKey: QUERY_KEYS.adminNotifications,
    queryFn: async () => {
      // TODO: Migrate to Supabase when admin_notifications table is ready
      return [];
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: true,
  });

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          displayError('Kunde inte hämta din plats. Kontrollera dina platsinställningar.');
          setUserLocation({ lat: 59.3293, lng: 18.0686 });
        }
      );
    } else {
      displayError('Din webbläsare stöder inte geolokalisering. Använder standardplats.');
      setUserLocation({ lat: 59.3293, lng: 18.0686 });
    }
  };

  const displayError = (message) => {
    setErrorMessage(message);
    setShowErrorDialog(true);
    setTimeout(() => {
      setShowErrorDialog(false);
      setErrorMessage(null);
    }, 5000);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) {
      return `${seconds} ${seconds === 1 ? 'sekund' : 'sekunder'} sedan`;
    }
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} ${minutes === 1 ? 'minut' : 'minuter'} sedan`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} ${hours === 1 ? 'timme' : 'timmar'} sedan`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? 'dag' : 'dagar'} sedan`;
  };

  const handleJoinMatch = async (matchId) => {
    try {
      if (isGuest) {
        setShowAuthGate(true);
        return;
      }
      triggerHaptic('success');
      await supabaseJoinMatch(matchId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matches });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myParticipantMatchIds });
    } catch (error) {
      console.error("Error joining match:", error);
      displayError(error.message || 'Kunde inte gå med i matchen.');
    }
  };

  const handleMatchCreated = async ({ match: matchData, venue: selectedVenue }) => {
    try {
      // Check if guest
      if (isGuest) {
        displayError('Du måste vara inloggad för att skapa en match.');
        return;
      }

      // Upsert venue first to ensure it exists in Supabase
      if (selectedVenue?.id) {
        try {
          await upsertVenue(selectedVenue);
        } catch (e) {
          console.warn('[Dashboard] Venue upsert failed (may already exist):', e.message);
        }
      }

      // Create match via Edge Function - returns { match_id, message }
      const result = await supabaseCreateMatch(matchData);

      setShowCreateMatchModal(false);
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matches });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myParticipantMatchIds });
      
      // Navigate to newly created match if we got an ID back
      if (result?.match_id) {
        navigate(`${createPageUrl("MatchDetail")}?id=${result.match_id}`);
      }
      
    } catch (error) {
      console.error("Error creating match:", error);
      displayError(error.message || 'Kunde inte skapa match. Försök igen.');
    }
  };

  // Process data when available
  const today = new Date().toISOString().split('T')[0];
  const upcomingMatches = (allMatchesRaw || []).filter(m =>
    m && m.status === 'upcoming' && m.date >= today
  );

  const userMatchIds = myParticipantMatchIds;

  // For authenticated users: show their matches
  // For guests: show all upcoming matches
  const myUpcomingMatches = isGuest 
    ? upcomingMatches
        .sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.time}`);
          const dateTimeB = new Date(`${b.date}T${b.time}`);
          return dateTimeA - dateTimeB;
        })
        .slice(0, 4)
    : upcomingMatches
        .filter(m => userMatchIds.includes(m.id) || m.organizer_id === authUser?.id)
        .sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.time}`);
          const dateTimeB = new Date(`${b.date}T${b.time}`);
          return dateTimeA - dateTimeB;
        })
        .slice(0, 2);

  const quickPlayMatches = upcomingMatches
    .filter(m =>
      m.is_open &&
      !userMatchIds.includes(m.id) &&
      m.organizer_id !== authUser?.id &&
      (m.is_spontaneous || m.current_players < m.max_players) &&
      (!m.skill_bracket || m.skill_bracket === 'mixed' || m.skill_bracket === userProfile?.skill_level)
    )
    .slice(0, 5);

  // Calculate nearby matches using venue data from matches (embedded in view)
  // Include ALL matches (both joined and not joined) for the nearby widget
  const nearbyMatches = userLocation ? upcomingMatches
    .map(match => {
      // Use embedded venue data from public_matches view
      const venueLat = match._venue_lat || match.venue_lat;
      const venueLng = match._venue_lng || match.venue_lng;
      
      if (!venueLat || !venueLng) {
        return { ...match, distance: Infinity };
      }
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(venueLat),
        parseFloat(venueLng)
      );
      return { 
        ...match, 
        distance, 
        venue: {
          name: match._venue_name || match.venue_name || 'Okänd plan',
          city: match._venue_city || match.venue_city,
          address: match._venue_address || match.venue_address,
          latitude: venueLat,
          longitude: venueLng
        }
      };
    })
    .filter(m => m.distance < 15)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5) : [];

  // Calculate weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyMatches = (allMatchesRaw || []).filter(m => {
    if (!m || m.status !== 'completed') return false;
    if (!m.completed_at) return false;
    const completedDate = new Date(m.completed_at);
    return completedDate > weekAgo && userMatchIds.includes(m.id);
  });

  const weeklyMvps = weeklyMatches.filter(m => m.mvp_user_id === authUser?.id).length;

  const weeklyStats = {
    matchesPlayed: weeklyMatches.length,
    mvps: weeklyMvps,
    goal: 5
  };

  // Räkna tid till nästa match
  const timeUntilMatch = myUpcomingMatches.length > 0 ? 
    (new Date(`${myUpcomingMatches[0].date}T${myUpcomingMatches[0].time}`) - new Date()) / (1000 * 60) : Infinity;

  // Prepare notifications
  const notifications = [
    ...adminNotifications,
    ...(nearbyMatches.length > 0 ? [{
      type: 'match',
      title: 'Ny match skapad nära dig!',
      subtitle: `${nearbyMatches[0].title} på ${nearbyMatches[0].venue?.name}`
    }] : []),
    ...(friendsInUpcomingMatchesCount > 0 ? [{
      type: 'social',
      title: `${friendsInUpcomingMatchesCount} ${friendsInUpcomingMatchesCount === 1 ? 'vän' : 'vänner'} spelar snart`,
      subtitle: 'Gå med i deras matcher'
    }] : []),
    ...(myUpcomingMatches.length > 0 && timeUntilMatch < 24 * 60 ? [{
      type: 'reminder',
      title: 'Din match är snart!',
      subtitle: `${myUpcomingMatches[0].title} börjar om ${Math.floor(timeUntilMatch / 60)}h`
    }] : []),
    ...(weeklyStats.mvps >= 2 ? [{
      type: 'achievement',
      title: 'Du är på gång!',
      subtitle: `${weeklyStats.mvps} MVPs denna vecka 🔥`
    }] : [])
  ];

  // Handle rate limit errors gracefully
  useEffect(() => {
    if (userError?.message?.includes('rate limit') || userError?.message?.includes('Rate limit')) {
      displayError('För många förfrågningar. Vänta en stund och uppdatera sidan.');
    }
  }, [userError]);

  // No full-page gate. Critical data (matches) renders skeleton inline.
  // User profile + participants load progressively without blocking.

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] }),
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] }),
      queryClient.invalidateQueries({ queryKey: ['supabase-venues'] }),
      queryClient.invalidateQueries({ queryKey: ['supabase-myParticipantMatchIds'] })
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <>
    {/* Auth Gate Modal */}
    <AuthGateModal 
      isOpen={showAuthGate}
      onClose={() => setShowAuthGate(false)}
      onLogin={() => setShowLoginModal(true)}
      feature="skapa matcher och delta"
    />
    
    {/* Login Modal */}
    <LoginModal 
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      onSuccess={() => {
        setShowLoginModal(false);
        setShowAuthGate(false);
      }}
    />
    
    <motion.div 
      variants={VARIANTS.container}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8"
    >
      {/* Error Dialog */}
      <AnimatePresence>
        {showErrorDialog && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg bg-red-600 text-white flex items-center justify-between space-x-4 max-w-sm w-full"
          >
            <p className="text-sm font-medium flex-grow">{errorMessage}</p>
            <button
              onClick={() => setShowErrorDialog(false)}
              className="p-1 rounded-full hover:bg-red-700 transition-colors"
              aria-label="Stäng meddelande"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Match Modal */}
      <AnimatePresence>
        {showCreateMatchModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-0 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] h-[80vh] lg:h-auto lg:max-h-[85vh] mb-16 lg:mb-0 lg:my-8 overflow-hidden flex flex-col"
            >
              <CreateMatchForm
                venues={venues}
                user={user}
                onSubmit={handleMatchCreated}
                onCancel={() => setShowCreateMatchModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-8">

        {/* Premium Hero Card — show skeleton while user data loads */}
        {(isAuthenticated && userLoading) ? (
          <HeroSkeleton />
        ) : (
        <motion.div
          variants={VARIANTS.item}
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
            <div className="flex items-center gap-3 sm:gap-5 lg:gap-8 mb-[20px] sm:mb-6 lg:mb-8">
              
              {/* Profile Image */}
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
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#2BA84A]/60 shadow-[0_20px_60px_rgba(43,168,74,0.4)] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center">
                  {user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFFFFF]">{(user?.display_name || user?.full_name)?.[0] || 'U'}</span>
                  )}
                  </div>
                  </motion.div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                  <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl sm:text-2xl lg:text-4xl font-black text-white tracking-tight mb-1.5 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] leading-tight"
                  >
                  Välkommen tillbaka, {(user?.display_name || user?.full_name)?.split(' ')[0]}!
                  </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/90 text-[11px] sm:text-[13px] lg:text-[15px] font-medium leading-snug"
                >
                  Dags att dominera planen idag! 🔥
                </motion.p>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <motion.div
              variants={VARIANTS.item}
              className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-[24px] sm:mb-8 lg:mb-10"
            >
              <Link to={createPageUrl('Map')}>
                <motion.div 
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/30 to-[#248232]/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-[#1A201D]/60 backdrop-blur-md border border-[#2BA84A]/20 rounded-2xl p-4 sm:p-5 lg:p-6 hover:bg-[#1A201D]/80 transition-all h-[110px] sm:h-32 lg:h-36 flex flex-col items-center justify-center gap-2 sm:gap-3 group-hover:border-[#2BA84A]/40 group-hover:shadow-[0_8px_24px_rgba(43,168,74,0.15)]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl bg-[#2BA84A]/30 flex items-center justify-center ring-2 ring-[#2BA84A]/40 flex-shrink-0">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#86EFAC]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white text-center">Hitta Planer</span>
                  </div>
                </motion.div>
              </Link>
              
              <motion.div 
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic('medium');
                  if (isGuest) {
                    setShowAuthGate(true);
                  } else {
                    setShowCreateMatchModal(true);
                  }
                }}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/30 to-[#E5683A]/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-[#2A1812]/60 backdrop-blur-md border border-[#F4743B]/20 rounded-2xl p-4 sm:p-5 lg:p-6 hover:bg-[#2A1812]/80 transition-all h-[110px] sm:h-32 lg:h-36 flex flex-col items-center justify-center gap-2 sm:gap-3 group-hover:border-[#F4743B]/40 group-hover:shadow-[0_8px_24px_rgba(244,116,59,0.15)]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl bg-[#F4743B]/30 flex items-center justify-center ring-2 ring-[#F4743B]/40 flex-shrink-0">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#FDE3D2]" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white text-center">Skapa match</span>
                </div>
              </motion.div>

              <Link to={createPageUrl('Community')}>
                <motion.div 
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#9370DB]/30 to-[#7C3AED]/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-[#1F1829]/60 backdrop-blur-md border border-[#9370DB]/20 rounded-2xl p-4 sm:p-5 lg:p-6 hover:bg-[#1F1829]/80 transition-all h-[110px] sm:h-32 lg:h-36 flex flex-col items-center justify-center gap-2 sm:gap-3 group-hover:border-[#9370DB]/40 group-hover:shadow-[0_8px_24px_rgba(147,112,219,0.15)]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl bg-[#9370DB]/30 flex items-center justify-center ring-2 ring-[#9370DB]/40 flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#DDD6FE]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[9px] sm:text-xs lg:text-sm font-bold text-white text-center leading-tight">Vänner &<br className="sm:hidden" />lag</span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Main CTA Button */}
            <motion.div variants={VARIANTS.item}>
              <Link to={createPageUrl("Matches")}>
                <motion.button
                  whileHover={{ 
                    scale: 1.02,
                    y: -4,
                    boxShadow: '0 25px 80px rgba(43,168,74,0.8)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: [
                      '0 12px 50px rgba(43,168,74,0.6)',
                      '0 18px 70px rgba(43,168,74,0.8)',
                      '0 12px 50px rgba(43,168,74,0.6)',
                    ]
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  className="relative h-[60px] sm:h-16 lg:h-20 w-full bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center gap-2 sm:gap-3 font-black text-sm sm:text-base lg:text-xl text-white overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 2
                    }}
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative z-10"
                  >
                    <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" strokeWidth={2.5} />
                  </motion.div>
                  <span className="relative z-10">Hitta spontana matcher nu</span>
                  <motion.div
                    animate={{
                      x: [0, 6, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative z-10"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" strokeWidth={3} />
                  </motion.div>
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
        )}

        {/* Inbox Widget */}
        {isAuthenticated && (
          <motion.div variants={VARIANTS.item}>
            <InboxWidget />
          </motion.div>
        )}

        {/* Notifications Slider */}
        {notifications.length > 0 && (
          <motion.div variants={VARIANTS.item}>
            <NotificationsSlider notifications={notifications} />
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-5 sm:gap-8">
          <div className="lg:col-span-8 space-y-5 sm:space-y-8">
            {/* Upcoming Matches */}
            <motion.div variants={VARIANTS.item}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#2BA84A]" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-base sm:text-xl font-bold text-[#F4F7F5]">
                    {isGuest ? 'Kommande matcher' : 'Dina kommande matcher'}
                  </h2>
                </div>
                <Link to={createPageUrl("Matches")} className="text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors group">
                  Visa alla
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </Link>
              </div>

              {matchesLoading || venuesLoading ? (
                <MatchGridSkeleton count={2} />
              ) : myUpcomingMatches.length === 0 ? (
                <div className="p-8 sm:p-10 text-center bg-gradient-to-br from-[#121715] to-[#0F2917]/20 border border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/20">
                    <Calendar className="w-8 h-8 text-[#2BA84A]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F4F7F5] mb-2">
                    {isGuest ? 'Inga matcher just nu' : 'Du har inga kommande matcher'}
                  </h3>
                  <p className="text-[#B6C2BC] text-sm mb-5 max-w-xs mx-auto">
                    {isGuest ? 'Logga in för att hitta och gå med i matcher nära dig.' : 'Hitta en match att gå med i eller skapa en egen på 10 sekunder!'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={createPageUrl("Matches")}>
                      <button className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-2xl bg-[#2BA84A] hover:bg-[#248232] text-white transition-colors">
                        {isGuest ? 'Se alla matcher' : 'Hitta matcher'}
                      </button>
                    </Link>
                    {!isGuest && (
                      <button
                        onClick={() => { triggerHaptic('medium'); setShowCreateMatchModal(true); }}
                        className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-2xl border border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Skapa match
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {myUpcomingMatches.map((match, index) => (
                    <div key={match.id} className="h-full">
                        <MatchCard 
                            match={match} 
                            venues={venues} 
                            user={user} 
                            participants={(allParticipants || []).filter(p => p.match_id === match.id)}
                            onJoin={handleJoinMatch}
                            index={index}
                        />
                    </div>
                  ))}
                </div>
              )}
              
            </motion.div>

            {/* Nearby Matches Widget */}
            <motion.div variants={VARIANTS.item}>
              <NearbyMatchesWidget
                matches={nearbyMatches}
                allParticipants={allParticipants}
                userMatchIds={userMatchIds}
                userId={authUser?.id}
                onJoin={handleJoinMatch}
                isGuest={isGuest}
              />
            </motion.div>
          </div>

          {/* Right Column */}
          <motion.div
            variants={VARIANTS.item}
            className="lg:col-span-4 space-y-5 sm:space-y-8 sticky top-24 self-start"
          >
            {/* Next Match Card — only show if user is actually signed up */}
            {!isGuest && myUpcomingMatches.length > 0 && (
              <NextMatchCard 
                match={myUpcomingMatches[0]} 
                venue={myUpcomingMatches[0]?.venue || venues.find(v => v.id === myUpcomingMatches[0]?.venue_id)}
                participants={myUpcomingMatches[0] ? allParticipants.filter(p => p.match_id === myUpcomingMatches[0].id) : []}
              />
            )}

            {/* Cups Widget in sidebar on desktop */}
            <div className="hidden lg:block">
              <CupsWidget />
            </div>
          </motion.div>
        </div>

        {/* Cups Widget on mobile - between matches and about section */}
        <motion.div variants={VARIANTS.item} className="lg:hidden">
          <CupsWidget />
        </motion.div>

        {/* About AllPlay Card */}
        <motion.div variants={VARIANTS.item}>
          <Link to={createPageUrl("AboutAllPlay")}>
            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="relative overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] bg-gradient-to-br from-[#121715] to-[#0F1513] hover:border-[#2BA84A]/30 transition-all cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 p-5 sm:p-6">
                <div className="w-full sm:w-40 h-40 sm:h-auto rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/afd97d702_P10905801.jpg"
                    alt="AllPlay Team"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0 text-center sm:text-left">
                  <div>
                    <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">
                      Lär känna AllPlay
                    </h3>
                    <p className="text-sm text-[#B6C2BC] leading-relaxed">
                      Vi bygger AllPlay för att göra spontanfotboll enkel, trygg och tillgänglig. Läs om varför appen finns, hur den funkar och vilka som står bakom.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ x: 4 }}
                    className="mt-4 inline-flex items-center justify-center sm:justify-start gap-2 text-[#2BA84A] font-semibold text-sm"
                  >
                    <span>Om AllPlay</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
    </>
    </PullToRefresh>
  );
}
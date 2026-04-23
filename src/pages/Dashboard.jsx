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
import MatchesCarousel from "../components/dashboard/MatchesCarousel";
import { isCupsEnabled } from "../lib/featureFlags";

import NextMatchCard from "../components/dashboard/NextMatchCard";
import InboxWidget from "../components/dashboard/InboxWidget";
import { 
  createMatch as supabaseCreateMatch, 
  joinMatch as supabaseJoinMatch,
  getVenues,
  getMyProfile,
  getPublicMatches,
  getMyParticipantMatchIds,
  getParticipantsForMatches,
  transformMatchData,
} from "../components/supabase/services";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { PullToRefresh } from "../components/ui/pull-to-refresh";
import { AuthGateModal } from "../components/ui/auth-gate-modal";
import { LoginModal } from "../components/supabase";

// Query keys
const QUERY_KEYS = {
  userProfile: ['supabase-userProfile'],
};

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState(null);
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

  // Fetch ALL feed data in a single coordinated query to avoid waterfall loading
  // Matches + venues + participants are fetched together so cards render complete
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['dashboard-feed', authUser?.id],
    queryFn: async () => {
      // Fire all requests in parallel — no waterfall
      const [matchesRaw, venuesData, myMatchIds] = await Promise.all([
        getPublicMatches({ status: 'upcoming' }),
        getVenues(),
        (isAuthenticated && authUser?.id) ? getMyParticipantMatchIds() : Promise.resolve([]),
      ]);

      const matches = matchesRaw.map(transformMatchData);
      const matchIds = matches.map(m => m.id);

      // Fetch participants for all visible matches (+ pre-warms user cache)
      const participants = matchIds.length > 0
        ? await getParticipantsForMatches(matchIds)
        : [];

      return { matches, venues: venuesData, myMatchIds, participants };
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    refetchOnMount: 'always', // Always fresh on tab switch
    enabled: true,
  });

  // Destructure feed data with safe defaults
  const allMatchesRaw = feedData?.matches ?? [];
  const venues = feedData?.venues ?? [];
  const myParticipantMatchIds = feedData?.myMatchIds ?? [];
  const allParticipants = feedData?.participants ?? [];
  const matchesLoading = feedLoading;
  const venuesLoading = feedLoading;

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
      queryClient.invalidateQueries({ queryKey: ['dashboard-feed'] });
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

      // Venues are already in Supabase — no upsert needed.
      // createMatch() looks up external_id from the venue UUID internally.
      const result = await supabaseCreateMatch(matchData);

      setShowCreateMatchModal(false);
      
      queryClient.invalidateQueries({ queryKey: ['dashboard-feed'] });
      
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-feed'] }),
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
          className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] lg:rounded-[28px] border border-white/[0.08]"
          style={{
            background: "linear-gradient(145deg, #070D09 0%, #0C1C12 35%, #103A1E 70%, #081410 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Pitch pattern — cinematic depth */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.045] pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
            <rect x="10" y="20" width="380" height="260" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="150" r="45" fill="none" stroke="white" strokeWidth="2" />
            <line x1="200" y1="20" x2="200" y2="280" stroke="white" strokeWidth="2" />
            <rect x="10" y="90" width="80" height="120" fill="none" stroke="white" strokeWidth="2" />
            <rect x="310" y="90" width="80" height="120" fill="none" stroke="white" strokeWidth="2" />
          </svg>

          {/* Grain for depth */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />

          {/* Ambient orbs — responsive sizing */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.75, 0.55] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 -right-14 sm:-top-24 sm:-right-20 w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(52,194,87,0.38) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.55, 0.4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute -bottom-16 -left-10 sm:-bottom-24 sm:-left-16 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(244,116,59,0.18) 0%, transparent 70%)" }}
          />

          {/* Hairline top highlight */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)" }}
          />

          {/* Deep bottom vignette */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%)" }}
          />

          <div className="relative z-10 px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-1.5 mb-3 sm:mb-4 px-2.5 py-1 rounded-full bg-white/[0.08] ring-1 ring-white/15 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C257] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#86EFAC]">Dashboard</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-5 lg:mb-6">
              {/* Avatar — responsive, cleaner */}
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1 sm:-inset-1.5 bg-white/10 rounded-[20px] blur-md pointer-events-none" />
                <div className="relative w-14 h-14 sm:w-[68px] sm:h-[68px] lg:w-[76px] lg:h-[76px] rounded-2xl overflow-hidden ring-1 ring-white/15 bg-gradient-to-br from-white/8 to-black/30 backdrop-blur-sm flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-2xl lg:text-[28px] font-black text-white">{(user?.display_name || user?.full_name)?.[0] || 'U'}</span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-[20px] sm:text-[26px] lg:text-[34px] leading-[1.1] font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] truncate">
                  <span className="sm:hidden">Hej, {(user?.display_name || user?.full_name)?.split(' ')[0]}! 👋</span>
                  <span className="hidden sm:inline">Välkommen, {(user?.display_name || user?.full_name)?.split(' ')[0]}!</span>
                </h1>
                <p className="mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] lg:text-[14px] text-white/75 leading-snug sm:leading-relaxed">
                  Dags att dominera planen idag 🔥
                </p>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <motion.div
              variants={VARIANTS.item}
              className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6 mb-5 sm:mb-8 lg:mb-10"
            >
              <Link to={createPageUrl('Map')}>
                <motion.div 
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/30 to-[#248232]/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-[#1A201D]/60 backdrop-blur-md border border-[#2BA84A]/20 rounded-2xl p-3 sm:p-5 lg:p-6 hover:bg-[#1A201D]/80 transition-all h-[92px] sm:h-32 lg:h-36 flex flex-col items-center justify-center gap-1.5 sm:gap-3 group-hover:border-[#2BA84A]/40 group-hover:shadow-[0_8px_24px_rgba(43,168,74,0.15)]">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl bg-[#2BA84A]/30 flex items-center justify-center ring-2 ring-[#2BA84A]/40 flex-shrink-0">
                      <MapPin className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#86EFAC]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white text-center leading-tight">Hitta planer</span>
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
                <div className="relative bg-[#2A1812]/60 backdrop-blur-md border border-[#F4743B]/20 rounded-2xl p-3 sm:p-5 lg:p-6 hover:bg-[#2A1812]/80 transition-all h-[92px] sm:h-32 lg:h-36 flex flex-col items-center justify-center gap-1.5 sm:gap-3 group-hover:border-[#F4743B]/40 group-hover:shadow-[0_8px_24px_rgba(244,116,59,0.15)]">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl bg-[#F4743B]/30 flex items-center justify-center ring-2 ring-[#F4743B]/40 flex-shrink-0">
                    <Plus className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#FDE3D2]" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white text-center leading-tight">Skapa match</span>
                </div>
              </motion.div>

              <Link to={createPageUrl('Community')}>
                <motion.div 
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#9370DB]/30 to-[#7C3AED]/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-[#1F1829]/60 backdrop-blur-md border border-[#9370DB]/20 rounded-2xl p-3 sm:p-5 lg:p-6 hover:bg-[#1F1829]/80 transition-all h-[92px] sm:h-32 lg:h-36 flex flex-col items-center justify-center gap-1.5 sm:gap-3 group-hover:border-[#9370DB]/40 group-hover:shadow-[0_8px_24px_rgba(147,112,219,0.15)]">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl bg-[#9370DB]/30 flex items-center justify-center ring-2 ring-[#9370DB]/40 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#DDD6FE]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white text-center leading-tight">Vänner & lag</span>
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
                  className="relative h-[52px] sm:h-16 lg:h-20 w-full bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center gap-2 sm:gap-3 font-black text-[13px] sm:text-base lg:text-xl text-white overflow-hidden"
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
                    <PlayCircle className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8" strokeWidth={2.5} />
                  </motion.div>
                  <span className="relative z-10 sm:hidden">Hitta matcher nu</span>
                  <span className="relative z-10 hidden sm:inline">Hitta spontana matcher nu</span>
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

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-5 sm:gap-8">
          <div className="lg:col-span-8 space-y-5 sm:space-y-8">
            {/* Unified Matches Carousel */}
            <motion.div variants={VARIANTS.item}>
              {matchesLoading || venuesLoading ? (
                <MatchGridSkeleton count={2} />
              ) : (
                <MatchesCarousel
                  nearbyMatches={nearbyMatches}
                  myMatches={myUpcomingMatches}
                  allParticipants={allParticipants}
                  venues={venues}
                  user={user}
                  isGuest={isGuest}
                  onJoin={handleJoinMatch}
                  onCreateMatch={() => setShowCreateMatchModal(true)}
                />
              )}
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
            {isCupsEnabled() && (
              <div className="hidden lg:block">
                <CupsWidget />
              </div>
            )}
          </motion.div>
        </div>

        {/* Cups Widget on mobile - between matches and about section */}
        {isCupsEnabled() && (
          <motion.div variants={VARIANTS.item} className="lg:hidden">
            <CupsWidget />
          </motion.div>
        )}

        {/* About AllPlay Card — Premium */}
        <motion.div variants={VARIANTS.item}>
          <Link to={createPageUrl("AboutAllPlay")}>
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.995 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="relative overflow-hidden rounded-[24px] border border-white/10 cursor-pointer group"
              style={{
                background:
                  'linear-gradient(135deg, #141917 0%, #0F1513 100%)',
                boxShadow:
                  '0 20px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Ambient green glow */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(43,168,74,0.22)' }}
              />

              <div className="flex flex-col sm:flex-row items-stretch gap-0 relative z-10">
                {/* Image with overlay */}
                <div className="relative w-full sm:w-[42%] h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                  <motion.img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/afd97d702_P10905801.jpg"
                    alt="AllPlay Team"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  {/* Readability gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0F1513] opacity-70 hidden sm:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1513] via-transparent to-transparent sm:hidden" />

                  {/* Eyebrow badge */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/15 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34C257] animate-pulse" />
                      Om oss
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center gap-4 p-5 sm:p-7">
                  <div>
                    <h3 className="text-[22px] sm:text-[24px] font-black text-white tracking-tight mb-2 leading-tight">
                      Lär känna <span className="text-[#34C257]">AllPlay</span>
                    </h3>
                    <p className="text-[14px] sm:text-[15px] text-[#B6C2BC] leading-relaxed">
                      Vi bygger AllPlay för att göra spontanfotboll enkel, trygg och tillgänglig. Läs om varför appen finns, hur den funkar och vilka som står bakom.
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="inline-flex items-center gap-2 text-[#34C257] font-bold text-[14px] self-start"
                  >
                    <span>Läs vår story</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={2.6} />
                  </motion.div>
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
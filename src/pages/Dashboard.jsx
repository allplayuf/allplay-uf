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
import DashboardHero from "../components/dashboard/DashboardHero";
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
import { haversineDistance } from "../utils/geo";

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
      avatar_url: userProfile?.avatar_url || localAvatar || authUser?.avatar_url,
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
        .slice(0, 12);

  const quickPlayMatches = upcomingMatches
    .filter(m =>
      m.is_open &&
      !userMatchIds.includes(m.id) &&
      m.organizer_id !== authUser?.id &&
      (m.is_spontaneous || m.current_players < m.max_players) &&
      (!m.skill_bracket || m.skill_bracket === 'mixed' || m.skill_bracket === userProfile?.skill_level)
    )
    .slice(0, 5);

  // "I närheten" = ALLA kommande matcher (inget avståndsfilter).
  // Sortera på datum/tid (närmast i tid först).
  const nearbyMatches = upcomingMatches
    .map(match => {
      const venueLat = match._venue_lat || match.venue_lat;
      const venueLng = match._venue_lng || match.venue_lng;

      let distance = Infinity;
      if (userLocation && venueLat && venueLng) {
        distance = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(venueLat),
          parseFloat(venueLng)
        );
      }

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
    .sort((a, b) => {
      const ta = new Date(`${a.date}T${a.time}`).getTime();
      const tb = new Date(`${b.date}T${b.time}`).getTime();
      return ta - tb;
    })
    .slice(0, 12);

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
          <motion.div variants={VARIANTS.item}>
            <DashboardHero
              user={user}
              isGuest={isGuest}
              nearbyCount={nearbyMatches.length}
              myMatchesCount={myUpcomingMatches.length}
              onCreateMatch={() => {
                if (isGuest) {
                  setShowAuthGate(true);
                } else {
                  setShowCreateMatchModal(true);
                }
              }}
            />
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
          <div className="lg:col-span-8 min-w-0 space-y-5 sm:space-y-8">
            {/* Unified Matches Carousel */}
            <motion.div variants={VARIANTS.item} className="min-w-0">
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
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  MapPin,
  Calendar,
  Users,
  PlayCircle,
  Award,
  Flame,
  ChevronRight,
  ArrowRight,
  Target,
  Clock,
  X,
  Plus,
  Zap,
  TrendingUp,
  Star,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import CreateMatchForm from "../components/matches/CreateMatchForm";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import CupsWidget from "../components/dashboard/CupsWidget";

// Query keys
const QUERY_KEYS = {
  user: ['user'],
  matches: ['matches'],
  venues: ['venues'],
  participants: ['participants'],
  userLocation: ['userLocation']
};

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState(null);
  const [friendsInUpcomingMatchesCount, setFriendsInUpcomingMatchesCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current user with OPTIMIZED caching (AUTH strategy)
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return currentUser;
    },
    ...CACHE_STRATEGIES.AUTH,
    retry: false,
  });

  // Fetch all matches with OPTIMIZED caching (SEMI_DYNAMIC strategy)
  const { data: allMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: QUERY_KEYS.matches,
    queryFn: async () => {
      return await base44.entities.Match.list('-date', 200);
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user,
  });

  // Fetch venues with OPTIMIZED caching (STATIC strategy)
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: QUERY_KEYS.venues,
    queryFn: async () => {
      return await base44.entities.Venue.list();
    },
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  // Fetch all participants with OPTIMIZED caching (REALTIME strategy)
  const { data: allParticipants = [], isLoading: participantsLoading } = useQuery({
    queryKey: QUERY_KEYS.participants,
    queryFn: async () => {
      return await base44.entities.MatchParticipant.list();
    },
    ...CACHE_STRATEGIES.REALTIME,
    enabled: !!user,
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

  const handleMatchCreated = async (matchData) => {
    try {
      if (!user?.id) {
        throw new Error("User not logged in.");
      }
      const newMatch = await base44.entities.Match.create(matchData);
      
      await base44.entities.MatchParticipant.create({
        match_id: newMatch.id,
        user_id: user.id,
        status: 'confirmed'
      });

      setShowCreateMatchModal(false);
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matches });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants });
      
    } catch (error) {
      console.error("Error creating match:", error);
      displayError('Kunde inte skapa match. Försök igen.');
    }
  };

  // Process data when available
  const today = new Date().toISOString().split('T')[0];
  const upcomingMatches = allMatches.filter(m =>
    m.status === 'upcoming' && m.date >= today
  );

  const userParticipations = allParticipants.filter(p => p.user_id === user?.id);
  const userMatchIds = userParticipations.map(p => p.match_id);

  const myUpcomingMatches = upcomingMatches
    .filter(m => userMatchIds.includes(m.id) || m.organizer_id === user?.id)
    .slice(0, 3);

  const quickPlayMatches = upcomingMatches
    .filter(m =>
      m.is_open &&
      !userMatchIds.includes(m.id) &&
      m.organizer_id !== user?.id &&
      (m.is_spontaneous || m.current_players < m.max_players) &&
      (!m.skill_bracket || m.skill_bracket === 'mixed' || m.skill_bracket === user?.skill_level)
    )
    .slice(0, 5);

  // Calculate nearby matches
  const nearbyMatches = userLocation ? upcomingMatches
    .filter(m => !userMatchIds.includes(m.id) && m.organizer_id !== user?.id)
    .map(match => {
      const venue = venues.find(v => v.id === match.venue_id);
      if (!venue || !venue.latitude || !venue.longitude) {
        return { ...match, distance: Infinity };
      }
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(venue.latitude),
        parseFloat(venue.longitude)
      );
      return { ...match, distance, venue };
    })
    .filter(m => m.distance < 10)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3) : [];

  // Calculate weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyMatches = allMatches.filter(m => {
    if (m.status !== 'completed') return false;
    if (!m.completed_at) return false;
    const completedDate = new Date(m.completed_at);
    return completedDate > weekAgo && userMatchIds.includes(m.id);
  });

  const weeklyMvps = weeklyMatches.filter(m => m.mvp_user_id === user?.id).length;

  const weeklyStats = {
    matchesPlayed: weeklyMatches.length,
    mvps: weeklyMvps,
    goal: 5
  };

  // Calculate recent activity
  const recentMatchesForActivity = allMatches
    .filter(m => m.status === 'completed' && userMatchIds.includes(m.id))
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 2);

  const recentActivity = [];

  for (const match of recentMatchesForActivity) {
    const venue = venues.find(v => v.id === match.venue_id);
    const timeAgo = getTimeAgo(new Date(match.completed_at));

    recentActivity.push({
      type: 'match_played',
      icon: Trophy,
      text: `Du spelade på ${venue?.name || 'Okänd plan'}`,
      time: timeAgo
    });
  }

  if (weeklyMvps > 0) {
    recentActivity.unshift({
      type: 'mvp',
      icon: Award,
      text: `Du blev MVP ${weeklyMvps} ${weeklyMvps === 1 ? 'gång' : 'gånger'} denna vecka!`,
      time: 'Denna vecka'
    });
  }

  // Calculate friends in upcoming matches
  useEffect(() => {
    if (user && upcomingMatches.length > 0 && allParticipants.length > 0) {
      const friendIds = user.friend_ids || [];
      const friendsPlayingMatchIds = new Set();

      if (friendIds.length > 0) {
        upcomingMatches.forEach(match => {
          if (!userMatchIds.includes(match.id) && match.organizer_id !== user.id) {
            const matchParticipants = allParticipants.filter(p => p.match_id === match.id);
            const hasFriendParticipating = matchParticipants.some(p => friendIds.includes(p.user_id));
            if (hasFriendParticipating) {
              friendsPlayingMatchIds.add(match.id);
            }
          }
        });
      }
      setFriendsInUpcomingMatchesCount(friendsPlayingMatchIds.size);
    }
  }, [user, upcomingMatches, allParticipants, userMatchIds]);

  // Handle rate limit errors gracefully
  useEffect(() => {
    if (userError?.message?.includes('rate limit') || userError?.message?.includes('Rate limit')) {
      displayError('För många förfrågningar. Vänta en stund och uppdatera sidan.');
    }
  }, [userError]);

  const isLoading = userLoading || matchesLoading || venuesLoading || participantsLoading;

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ULTIMATE HERO CARD - REDESIGNED WITH RINGS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'linear-gradient(135deg, #2BA84A 0%, #0F2917 100%)',
                'linear-gradient(135deg, #248232 0%, #1A5C2E 100%)',
                'linear-gradient(135deg, #2BA84A 0%, #0F2917 100%)',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* GREEN RINGS - Same as Profile */}
          <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full opacity-50"></div>
          <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full opacity-50"></div>

          {/* Animated Orbs */}
          <motion.div
            className="absolute top-[-100px] right-[-100px] w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(43,168,74,0.4) 0%, transparent 70%)' }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[-80px] left-[-80px] w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(15,41,23,0.6) 0%, transparent 70%)' }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}

          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            {/* Profile Section */}
            <div className="flex items-start gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-white/40 shadow-2xl overflow-hidden">
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                      {user?.full_name?.[0] || 'U'}
                    </span>
                  )}
                </div>
                {/* Online Pulse */}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#10B981] rounded-full border-3 border-white shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl lg:text-[36px] lg:leading-[44px] font-bold text-white mb-2 drop-shadow-lg flex items-center gap-2 flex-wrap"
                >
                  Välkommen tillbaka, {user?.full_name?.split(' ')[0]}!
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/90 text-sm sm:text-base lg:text-lg font-medium drop-shadow"
                >
                  Dags att dominera planen idag! 🔥
                </motion.p>
              </div>
            </div>

            {/* Stats Grid - ENHANCED */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-3 sm:gap-4 mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 shadow-xl hover:border-white/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" strokeWidth={2.5} />
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white/60" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                    {user?.matches_played || 0}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Matcher
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ delay: 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/30 to-[#F4743B]/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 shadow-xl hover:border-[#F4743B]/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4743B]" strokeWidth={2.5} fill="#F4743B" />
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#F4743B]/80" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                    {user?.mvp_count || 0}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wide">
                    MVPs
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/30 to-[#F4743B]/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 shadow-xl hover:border-[#F4743B]/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4743B]" strokeWidth={2.5} />
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#F4743B]/80" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg flex items-center gap-2">
                    {user?.current_streak || 0}
                    {(user?.current_streak || 0) > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-2xl"
                      >
                        🔥
                      </motion.span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Streak
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Primary CTA - ENHANCED */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link to={createPageUrl("Matches")}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: [
                      '0 8px 24px rgba(255, 255, 255, 0.15)',
                      '0 12px 32px rgba(255, 255, 255, 0.25)',
                      '0 8px 24px rgba(255, 255, 255, 0.15)'
                    ]
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  className="relative w-full h-14 sm:h-16 rounded-2xl overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    }}
                  />
                  <div className="relative h-full flex items-center justify-center gap-3 px-6">
                    <PlayCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                    <span className="text-base sm:text-lg font-bold text-white">
                      Hitta spontana matcher nu
                    </span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronRight className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </motion.div>
                  </div>
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Access Cards - REDESIGNED WITH EQUAL WIDTH */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl('Map')}>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#121715] to-[#18221E] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-[#2BA84A]/30 transition-all">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(43,168,74,0.4)] group-hover:shadow-[0_6px_24px_rgba(43,168,74,0.6)] transition-all"
                >
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
                </motion.div>
                <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">Hitta Planer</span>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <button onClick={() => setShowCreateMatchModal(true)} className="w-full">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#121715] to-[#18221E] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-[#F4743B]/30 transition-all">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(244,116,59,0.4)] group-hover:shadow-[0_6px_24px_rgba(244,116,59,0.6)] transition-all"
                >
                  <Plus className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
                </motion.div>
                <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">Skapa match</span>
              </div>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl('Community')}>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#121715] to-[#18221E] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-[#2BA84A]/30 transition-all">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <motion.div
                  whileHover={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(43,168,74,0.4)] group-hover:shadow-[0_6px_24px_rgba(43,168,74,0.6)] transition-all"
                >
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
                </motion.div>
                <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">Vänner & lag</span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            {/* Upcoming Matches */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">Kommande matcher</h2>
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

              {myUpcomingMatches.length === 0 ? (
                <Card className="bg-[#121715] rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-[#9FC9AC]" />
                    </div>
                    <p className="text-sm text-[#B6C2BC] mb-6">Inga kommande matcher</p>
                    <Link to={createPageUrl("Matches")}>
                      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-sm font-semibold text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 active:bg-[#2BA84A]/16">
                        Hitta matcher
                      </button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {myUpcomingMatches.map((match, index) => {
                    const venue = venues.find(v => v.id === match.venue_id);
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                          <div className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] p-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:border-[#2BA84A]/30 transition-all min-h-[90px] flex items-center gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="text-base font-bold text-[#F4F7F5] group-hover:text-[#2BA84A] transition-colors">{match.title}</h4>
                                <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-3 text-xs font-bold text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                                  {match.format}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#B6C2BC] flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {venue?.name || 'Okänd'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {match.date} {match.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {match.is_spontaneous ? (
                                <span className="text-sm font-semibold text-[#B6C2BC]">
                                  {match.current_players || 0} anmälda
                                </span>
                              ) : (
                                <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold text-[#2BA84A] ring-1 ring-[#2BA84A]/25">
                                  {match.current_players || 0}/{match.max_players}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {nearbyMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">Nära dig</h2>
                  </div>
                  <Link to={createPageUrl("Map")} className="text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors">
                    Se karta
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {nearbyMatches.map((match, index) => {
                    const venue = match.venue;
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                          <div className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] p-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:border-[#2BA84A]/30 transition-all min-h-[90px] flex items-center gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="text-base font-bold text-[#F4F7F5] group-hover:text-[#2BA84A] transition-colors">{match.title}</h4>
                                <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-3 text-xs font-bold text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                                  {match.format}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#B6C2BC] flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {venue?.name || 'Okänd'} ({match.distance?.toFixed(1)}km)
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {match.date} {match.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {match.is_spontaneous ? (
                                <span className="text-sm font-semibold text-[#B6C2BC]">
                                  {match.current_players || 0} anmälda
                                </span>
                              ) : (
                                <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold text-[#2BA84A] ring-1 ring-[#2BA84A]/25">
                                  {match.current_players || 0}/{match.max_players}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {quickPlayMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#F4743B]/20 to-[#F4743B]/10 rounded-xl flex items-center justify-center">
                      <PlayCircle className="w-5 h-5 text-[#F4743B]" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">Snabbspel</h2>
                  </div>
                  <Link to={createPageUrl("Matches")} className="text-sm font-semibold text-[#F4743B] hover:text-[#FDE3D2] flex items-center gap-1 transition-colors">
                    Se alla
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {quickPlayMatches.slice(0, 3).map((match, index) => {
                    const venue = venues.find(v => v.id === match.venue_id);
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                          <div className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] p-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:border-[#F4743B]/30 transition-all min-h-[90px] flex items-center gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="text-base font-bold text-[#F4F7F5] group-hover:text-[#F4743B] transition-colors">{match.title}</h4>
                                <span className="inline-flex h-6 items-center rounded-full bg-[#F4743B]/18 px-3 text-xs font-bold text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                                  {match.format}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#B6C2BC]">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {venue?.name || 'Okänd'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {match.date} {match.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold text-[#F4743B] ring-1 ring-[#F4743B]/25">
                                {match.current_players || 0}/{match.max_players}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
            className="space-y-5 sm:space-y-6"
          >
            {/* NEW: Cups Widget */}
            <CupsWidget />

            <Card className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029]">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-[#F4F7F5]">Denna vecka</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-[#B6C2BC]">Matcher spelade</span>
                      <span className="text-base font-bold text-[#F4F7F5]">{weeklyStats.matchesPlayed}/{weeklyStats.goal}</span>
                    </div>
                    <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(weeklyStats.matchesPlayed / weeklyStats.goal) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-[#B6C2BC]">MVPs</span>
                      <span className="text-base font-bold text-[#F4F7F5]">{weeklyStats.mvps}</span>
                    </div>
                    <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((weeklyStats.mvps / 3) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-[#F4743B] to-[#E5683A] rounded-full"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#223029]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#B6C2BC]">Streak</span>
                      <span className="text-base font-bold text-[#F4F7F5] flex items-center gap-1">
                        <Flame className="w-4 h-4 text-[#F4743B]" />
                        {user?.current_streak || 0} dagar
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029]">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F4743B]/20 to-[#F4743B]/10 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#F4743B]" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-[#F4F7F5]">Aktivitet</h3>
                </div>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 2).map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-3 p-3 bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A]/30 transition-all"
                        >
                          <div className="w-10 h-10 bg-[#2BA84A]/15 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-[#2BA84A]/25">
                            <Icon className="w-5 h-5 text-[#2BA84A]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F4F7F5]">{activity.text}</p>
                            <p className="text-xs text-[#B6C2BC] mt-1">{activity.time}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-[#B6C2BC]">Ingen aktivitet än</p>
                    <p className="text-xs text-[#B6C2BC] mt-1">Spela din första match!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom CTA - REDESIGNED */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-[#223029] p-6 sm:p-8">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(circle at 20% 50%, rgba(43,168,74,0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(43,168,74,0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(43,168,74,0.3) 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Ingen match idag?
                </h3>
                <p className="text-sm sm:text-base text-white/90">
                  Skapa eller hitta en spontan match och spela med nya vänner!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link to={createPageUrl("Map")} className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[16px] border-2 border-white/40 px-6 text-sm font-bold text-white transition-all hover:bg-white/10"
                  >
                    <MapPin className="w-5 h-5" />
                    Hitta planer
                  </motion.button>
                </Link>
                <Link to={createPageUrl("Matches")} className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[16px] bg-white/20 backdrop-blur-sm px-6 text-sm font-bold text-white ring-2 ring-white/40 transition-all hover:bg-white/30"
                  >
                    <PlayCircle className="w-5 h-5" />
                    Spontan match
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
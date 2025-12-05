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
import MatchCard from "../components/matches/MatchCard";

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

        {/* Premium Hero Card - Community Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.5)] border border-[#2BA84A]/30"
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

          <div className="relative z-10 p-4 sm:p-6 lg:p-10">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-5 lg:mb-7">
              
              {/* Profile Image - Small border */}
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
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#FFFFFF]/30 shadow-[0_20px_60px_rgba(43,168,74,0.4)] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center">
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFFFFF]">{user?.full_name?.[0] || 'U'}</span>
                  )}
                </div>
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl sm:text-2xl lg:text-4xl font-black text-white tracking-tight mb-1 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] leading-tight"
                >
                  Välkommen tillbaka, {user?.full_name?.split(' ')[0]}!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/90 text-xs sm:text-sm lg:text-base font-medium leading-snug"
                >
                  Dags att dominera planen idag! 🔥
                </motion.p>
              </div>
            </div>

            {/* Action Buttons Grid - Community Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-5"
            >
              <Link to={createPageUrl('Map')}>
                <motion.div 
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/30 to-[#248232]/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/30 sm:border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-[#2BA84A]/60 transition-all h-20 sm:h-24 lg:h-28 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center ring-2 ring-[#2BA84A]/30 flex-shrink-0">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#86EFAC]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white text-center">Hitta Planer</span>
                  </div>
                </motion.div>
              </Link>
              
              <motion.div 
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateMatchModal(true)}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/30 to-[#E5683A]/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/30 sm:border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-[#F4743B]/60 transition-all h-20 sm:h-24 lg:h-28 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-[#F4743B]/20 flex items-center justify-center ring-2 ring-[#F4743B]/30 flex-shrink-0">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#FDE3D2]" strokeWidth={2.5} />
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
                  <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/30 sm:border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-[#9370DB]/60 transition-all h-20 sm:h-24 lg:h-28 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-[#9370DB]/20 flex items-center justify-center ring-2 ring-[#9370DB]/30 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#DDD6FE]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-white text-center">Vänner & lag</span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Hitta spontana matcher - ULTRA KLICKBAR med stark animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link to={createPageUrl("Matches")}>
                <motion.button
                  whileHover={{ 
                    scale: 1.03,
                    y: -6,
                  }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    boxShadow: [
                      '0 10px 40px rgba(43,168,74,0.5), 0 0 0 0 rgba(43,168,74,0.4)',
                      '0 15px 60px rgba(43,168,74,0.7), 0 0 0 8px rgba(43,168,74,0.2)',
                      '0 10px 40px rgba(43,168,74,0.5), 0 0 0 0 rgba(43,168,74,0.4)',
                    ]
                  }}
                  transition={{
                    boxShadow: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  className="relative h-14 sm:h-16 lg:h-20 w-full bg-gradient-to-r from-[#2BA84A] via-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center gap-2 sm:gap-3 font-black text-sm sm:text-base lg:text-xl text-white overflow-hidden group"
                >
                  {/* Pulsating border glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{
                      boxShadow: [
                        'inset 0 0 20px rgba(255,255,255,0.2)',
                        'inset 0 0 40px rgba(255,255,255,0.4)',
                        'inset 0 0 20px rgba(255,255,255,0.2)',
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Multiple animated shine waves */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    animate={{
                      x: ['-200%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                      repeatDelay: 0.5
                    }}
                  />
                  
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-200%', '200%']
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 0.5
                    }}
                  />
                  
                  {/* Radial pulse from center */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)'
                    }}
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Rotating icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative z-10"
                  >
                    <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" strokeWidth={2.5} fill="white" fillOpacity={0.2} />
                  </motion.div>
                  
                  <span className="relative z-10">Hitta spontana matcher nu</span>
                  
                  {/* Bouncing arrow */}
                  <motion.div
                    animate={{
                      x: [0, 8, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative z-10"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" strokeWidth={3} />
                  </motion.div>
                  
                  {/* Sparkle particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: '50%',
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>



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
                <div className="card-base p-8 text-center bg-[#121715]">
                  <div className="w-12 h-12 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-[#2BA84A]" />
                  </div>
                  <p className="text-secondary text-sm mb-4">Inga kommande matcher</p>
                  <Link to={createPageUrl("Matches")}>
                    <button className="btn-secondary px-4 h-9 text-sm">
                      Hitta matcher
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {myUpcomingMatches.map((match, index) => (
                    <div key={match.id} className="h-full">
                        <MatchCard 
                            match={match} 
                            venues={venues} 
                            user={user} 
                            participants={allParticipants.filter(p => p.match_id === match.id)}
                            index={index}
                        />
                    </div>
                  ))}
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
                    const currentPlayersCount = (allParticipants || []).filter(p => p.match_id === match.id).length;
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
                                  {currentPlayersCount} anmälda
                                </span>
                              ) : (
                                <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold text-[#2BA84A] ring-1 ring-[#2BA84A]/25">
                                  {currentPlayersCount}/{match.max_players}
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
                    const currentPlayersCount = (allParticipants || []).filter(p => p.match_id === match.id).length;
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
                                {currentPlayersCount}/{match.max_players}
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
            className="space-y-5 sm:space-y-6 sticky top-24 self-start"
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



      </div>
    </div>
  );
}
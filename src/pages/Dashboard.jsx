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

          <div className="relative z-10 p-6 sm:p-8 lg:p-12">
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
              
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
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-3xl overflow-hidden border-2 border-[#FFFFFF]/30 shadow-[0_20px_60px_rgba(43,168,74,0.4)] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center">
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-[#FFFFFF]">{user?.full_name?.[0] || 'U'}</span>
                  )}
                </div>
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-1 sm:mb-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                >
                  Välkommen tillbaka, {user?.full_name?.split(' ')[0]}!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/90 text-xs sm:text-sm lg:text-base font-medium leading-relaxed mb-3"
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
              className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6"
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

            {/* Hitta spontana matcher - Extremt klickbar knapp */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link to={createPageUrl("Matches")}>
                <motion.button
                  whileHover={{ 
                    scale: 1.02,
                    y: -4,
                    boxShadow: '0 20px 70px rgba(43,168,74,0.6)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: [
                      '0 8px 32px rgba(43,168,74,0.4)',
                      '0 12px 48px rgba(43,168,74,0.5)',
                      '0 8px 32px rgba(43,168,74,0.4)',
                    ]
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  className="relative h-14 sm:h-16 lg:h-20 w-full bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center gap-2 sm:gap-3 font-black text-sm sm:text-base lg:text-xl text-white overflow-hidden group"
                >
                  {/* Animated background pulse */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    animate={{
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
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
                      x: [0, 5, 0]
                    }}
                    transition={{
                      duration: 1.2,
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





      </div>
    </div>
  );
}
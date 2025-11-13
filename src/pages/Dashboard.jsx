
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
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import CreateMatchForm from "../components/matches/CreateMatchForm";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import UpcomingCupsWidget from "../components/dashboard/UpcomingCupsWidget";

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
          setUserLocation({ lat: 59.3293, lng: 18.0686 }); // Stockholm fallback
        }
      );
    } else {
      displayError('Din webbläsare stöder inte geolokalisering. Använder standardplats.');
      setUserLocation({ lat: 59.3293, lng: 18.0686 }); // Stockholm fallback
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
      
      // Invalidate relevant queries to refetch data
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

        {/* Hero Card with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[16px] lg:rounded-[20px] p-5 sm:p-6 lg:p-8 shadow-[0_6px_18px_rgba(0,0,0,0.22)]"
        >
          {/* Overlay circles */}
          <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full"></div>
          <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full"></div>

          <div className="relative z-10 space-y-5">
            {/* Welcome */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-[#FFFFFF]/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-[#FFFFFF]/25 flex-shrink-0">
                {user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover rounded-2xl" loading="lazy" />
                ) : (
                  <span className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#EAF6EE]">
                    {user?.full_name?.[0] || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-[28px] lg:leading-[34px] font-semibold text-[#EAF6EE] mb-1">
                  Hej {user?.full_name?.split(' ')[0]}! ⚽
                </h1>
                <p className="text-[#CFE8D6] text-xs sm:text-sm lg:text-base">Redo för nästa match?</p>
              </div>
            </div>

            {/* Stats - OPTIMIZED FOR MOBILE */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#FFFFFF]/20 text-center">
                <div className="text-lg sm:text-xl font-semibold text-[#EAF6EE]">{user?.matches_played || 0}</div>
                <div className="text-[11px] sm:text-[12px] font-normal text-[#CFE8D6]/70 mt-0.5">Matcher</div>
              </div>
              <div className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#FFFFFF]/20 text-center">
                <div className="text-lg sm:text-xl font-semibold text-[#F4743B]">{user?.mvp_count || 0}</div>
                <div className="text-[11px] sm:text-[12px] font-normal text-[#CFE8D6]/70 mt-0.5">MVPs</div>
              </div>
              <div className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#FFFFFF]/20 text-center">
                <div className="text-lg sm:text-xl font-semibold text-[#EAF6EE] flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#F4743B]" />
                  {user?.current_streak || 0}
                </div>
                <div className="text-[11px] sm:text-[12px] font-normal text-[#CFE8D6]/70 mt-0.5">Streak</div>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="pt-3 sm:pt-4">
              <Link to={createPageUrl("Matches")} className="block">
                <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] sm:rounded-[16px] bg-[#2BA84A]/16 px-5 sm:px-6 text-sm sm:text-base font-semibold text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 hover:ring-[#2BA84A]/45 hover:scale-[1.02] active:scale-100">
                  <PlayCircle className="w-5 h-5" />
                  Hitta spontana matcher
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Quick Access Cards - UPDATED WITH BETTER ANIMATIONS */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Hitta matcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.97,
              transition: { duration: 0.1 }
            }}
          >
            <Link to={createPageUrl('Map')} className="block">
              <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
                <CardContent className="p-3 sm:p-4 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center">
                  <motion.div 
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center mb-2 ring-1 ring-[#2BA84A]/30"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                  >
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#2BA84A]" />
                  </motion.div>
                  <div className="text-center">
                    <div className="text-xs sm:text-[13px] font-semibold text-[#F4F7F5]">Hitta matcher</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Skapa match */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.97,
              transition: { duration: 0.1 }
            }}
          >
            <button onClick={() => setShowCreateMatchModal(true)} className="block w-full">
              <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
                <CardContent className="p-3 sm:p-4 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center">
                  <motion.div 
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F4743B]/20 rounded-xl flex items-center justify-center mb-2 ring-1 ring-[#F4743B]/30"
                    whileHover={{ rotate: 90, transition: { duration: 0.3 } }}
                  >
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4743B]" />
                  </motion.div>
                  <div className="text-center">
                    <div className="text-xs sm:text-[13px] font-semibold text-[#F4F7F5]">Skapa match</div>
                  </div>
                </CardContent>
              </Card>
            </button>
          </motion.div>

          {/* Vänner & lag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.97,
              transition: { duration: 0.1 }
            }}
          >
            <Link to={createPageUrl('Community')} className="block">
              <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
                <CardContent className="p-3 sm:p-4 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center">
                  <motion.div 
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center mb-2 ring-1 ring-[#2BA84A]/30"
                    whileHover={{ scale: [1, 1.1, 1], transition: { duration: 0.4, repeat: Infinity } }}
                  >
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#2BA84A]" />
                  </motion.div>
                  <div className="text-center">
                    <div className="text-xs sm:text-[13px] font-semibold text-[#F4F7F5]">Vänner & lag</div>
                  </div>
                </CardContent>
              </Card>
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
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#9FC9AC]" />
                  <h2 className="text-base sm:text-[18px] sm:leading-[24px] font-semibold text-[#F4F7F5]">Kommande matcher</h2>
                </div>
                <Link to={createPageUrl("Matches")} className="text-[12px] sm:text-[13px] leading-[18px] font-medium text-[#9FC9AC] hover:text-[#CFE8D6] hover:underline flex items-center gap-1 transition-colors">
                  Visa alla
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>

              {myUpcomingMatches.length === 0 ? (
                <Card className="bg-[#121715] rounded-[16px] sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#9FC9AC]" />
                    </div>
                    <p className="text-[13px] sm:text-[14px] leading-[20px] text-[#B6C2BC] mb-4 sm:mb-6">Inga kommande matcher</p>
                    <Link to={createPageUrl("Matches")}>
                      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-[13px] sm:text-[14px] font-semibold text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 active:bg-[#2BA84A]/16">
                        Hitta matcher
                      </button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {myUpcomingMatches.map((match, index) => {
                    const venue = venues.find(v => v.id === match.venue_id);
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                      >
                        <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                          <div className="bg-[#121715] rounded-[14px] sm:rounded-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029] p-3 sm:p-4 hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-all min-h-[84px] flex items-center gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h4 className="text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] font-semibold text-[#F4F7F5] group-hover:text-[#9FC9AC] transition-colors">{match.title}</h4>
                                <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-2.5 text-[11px] sm:text-[12px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                                  {match.format}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] sm:text-[12px] text-[#B6C2BC] flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {venue?.name || 'Okänd'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {match.date} {match.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {match.is_spontaneous ? (
                                <span className="text-[12px] sm:text-[13px] font-medium text-[#B6C2BC]">
                                  {match.current_players || 0} anmälda
                                </span>
                              ) : (
                                <span className="inline-flex h-7 items-center rounded-full bg-[#18221E] px-3 text-[12px] sm:text-[13px] font-medium text-[#9FC9AC] ring-1 ring-[#2BA84A]/25">
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

            {/* Nearby Matches */}
            {nearbyMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#9FC9AC]" />
                    <h2 className="text-base sm:text-[18px] sm:leading-[24px] font-semibold text-[#F4F7F5]">Nära dig</h2>
                  </div>
                  <Link to={createPageUrl("Map")} className="text-[12px] sm:text-[13px] leading-[18px] font-medium text-[#9FC9AC] hover:text-[#CFE8D6] hover:underline flex items-center gap-1 transition-colors">
                    Se karta
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {nearbyMatches.map((match, index) => {
                    const venue = match.venue;
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                      >
                        <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                          <div className="bg-[#121715] rounded-[14px] sm:rounded-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029] p-3 sm:p-4 hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-all min-h-[84px] flex items-center gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h4 className="text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] font-semibold text-[#F4F7F5] group-hover:text-[#9FC9AC] transition-colors">{match.title}</h4>
                                <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-2.5 text-[11px] sm:text-[12px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                                  {match.format}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] sm:text-[12px] text-[#B6C2BC] flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {venue?.name || 'Okänd'} ({match.distance?.toFixed(1)}km)
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {match.date} {match.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {match.is_spontaneous ? (
                                <span className="text-[12px] sm:text-[13px] font-medium text-[#B6C2BC]">
                                  {match.current_players || 0} anmälda
                                </span>
                              ) : (
                                <span className="inline-flex h-7 items-center rounded-full bg-[#18221E] px-3 text-[12px] sm:text-[13px] font-medium text-[#9FC9AC] ring-1 ring-[#2BA84A]/25">
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

            {/* Quick Play Matches */}
            {quickPlayMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#9FC9AC]" />
                    <h2 className="text-base sm:text-[18px] sm:leading-[24px] font-semibold text-[#F4F7F5]">Snabbspel</h2>
                  </div>
                  <Link to={createPageUrl("Matches")} className="text-[12px] sm:text-[13px] leading-[18px] font-medium text-[#9FC9AC] hover:text-[#CFE8D6] hover:underline flex items-center gap-1 transition-colors">
                    Se alla
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {quickPlayMatches.slice(0, 3).map((match, index) => {
                    const venue = venues.find(v => v.id === match.venue_id);
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                      >
                        <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                          <div className="bg-[#121715] rounded-[14px] sm:rounded-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029] p-3 sm:p-4 hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-all min-h-[84px] flex items-center gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h4 className="text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] font-semibold text-[#F4F7F5] group-hover:text-[#9FC9AC] transition-colors">{match.title}</h4>
                                <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-2.5 text-[11px] sm:text-[12px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                                  {match.format}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] sm:text-[12px] text-[#B6C2BC]">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {venue?.name || 'Okänd'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {match.date} {match.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex h-7 items-center rounded-full bg-[#18221E] px-3 text-[12px] sm:text-[13px] font-medium text-[#9FC9AC] ring-1 ring-[#2BA84A]/25">
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
            {/* Upcoming Cups Widget */}
            <UpcomingCupsWidget />

            {/* Weekly Progress - NOW DYNAMIC */}
            <Card className="bg-[#121715] rounded-[16px] sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5 sm:mb-6">
                  <Target className="w-5 h-5 text-[#9FC9AC]" />
                  <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">Denna vecka</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[12px] sm:text-[13px] leading-[18px] font-normal text-[#B6C2BC]">Matcher spelade</span>
                      <span className="text-[14px] leading-[20px] font-semibold text-[#F4F7F5]">{weeklyStats.matchesPlayed}/{weeklyStats.goal}</span>
                    </div>
                    <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                      <div className="h-full bg-[#2BA84A] rounded-full transition-all duration-500" style={{ width: `${(weeklyStats.matchesPlayed / weeklyStats.goal) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[12px] sm:text-[13px] leading-[18px] font-normal text-[#B6C2BC]">MVPs</span>
                      <span className="text-[14px] leading-[20px] font-semibold text-[#F4F7F5]">{weeklyStats.mvps}</span>
                    </div>
                    <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                      <div className="h-full bg-[#F4743B] rounded-full transition-all duration-500" style={{ width: `${Math.min((weeklyStats.mvps / 3) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#223029]">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] sm:text-[13px] leading-[18px] font-normal text-[#B6C2BC]">Streak</span>
                      <span className="text-[14px] leading-[20px] font-semibold text-[#F4F7F5] flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        {user?.current_streak || 0} dagar
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - NOW DYNAMIC */}
            <Card className="bg-[#121715] rounded-[16px] sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5 sm:mb-6">
                  <Award className="w-5 h-5 text-[#9FC9AC]" />
                  <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">Aktivitet</h3>
                </div>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 2).map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className="flex gap-3 p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                          <div className="w-10 h-10 bg-[#2BA84A]/15 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-[#2BA84A]/25">
                            <Icon className="w-5 h-5 text-[#9FC9AC]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] sm:text-[14px] leading-[20px] text-[#F4F7F5]">{activity.text}</p>
                            <p className="text-[11px] sm:text-[12px] text-[#B6C2BC] mt-1">{activity.time}</p>
                          </div>
                        </div>
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

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
        >
          <Card className="bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-[16px] sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
            <CardContent className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[16px] lg:rounded-[20px] p-5 sm:p-6 lg:p-8 shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-lg sm:text-[20px] sm:leading-[28px] lg:text-[28px] lg:leading-[34px] font-semibold text-[#EAF6EE] mb-2">
                    Ingen match idag?
                  </h3>
                  <p className="text-[13px] sm:text-[14px] leading-[20px] text-[#CFE8D6]">
                    Skapa eller hitta en spontan match och spela med nya vänner!
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link to={createPageUrl("Map")} className="w-full sm:w-auto">
                    <button className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-[14px] border border-[#EAF6EE]/35 px-5 text-[13px] sm:text-[14px] font-semibold text-[#EAF6EE] transition-all hover:bg-[#FFFFFF]/10 active:bg-[#FFFFFF]/16">
                      <MapPin className="w-4 h-4" />
                      Hitta planer
                    </button>
                  </Link>
                  <Link to={createPageUrl("Matches")} className="w-full sm:w-auto">
                    <button className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-[14px] bg-[#FFFFFF]/16 px-5 text-[13px] sm:text-[14px] font-semibold text-[#EAF6EE] ring-1 ring-[#FFFFFF]/30 transition-all hover:bg-[#FFFFFF]/24 hover:ring-[#FFFFFF]/45">
                      <PlayCircle className="w-4 h-4" />
                      Spontan match
                    </button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, MapPin, PlayCircle, Trophy, Award } from "lucide-react";

import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import CreateMatchForm from "@/components/matches/CreateMatchForm";
import { CACHE_STRATEGIES } from "@/components/providers/QueryProvider";
import CupsWidget from "@/components/dashboard/CupsWidget";

// Modular Components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import QuickAccessGrid from "@/components/dashboard/QuickAccessGrid";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardActivity from "@/components/dashboard/DashboardActivity";
import DashboardUpcoming from "@/components/dashboard/DashboardUpcoming";

// Query keys
const QUERY_KEYS = {
  user: ['user'],
  matches: ['matches'],
  venues: ['venues'],
  participants: ['participants']
};

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const queryClient = useQueryClient();

  // 1. Data Fetching with Optimized Strategies
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: () => base44.auth.me(),
    ...CACHE_STRATEGIES.AUTH,
    retry: false,
  });

  const { data: allMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: QUERY_KEYS.matches,
    queryFn: () => base44.entities.Match.list('-date', 200),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user,
  });

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: QUERY_KEYS.venues,
    queryFn: () => base44.entities.Venue.list(),
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  const { data: allParticipants = [], isLoading: participantsLoading } = useQuery({
    queryKey: QUERY_KEYS.participants,
    queryFn: () => base44.entities.MatchParticipant.list(),
    ...CACHE_STRATEGIES.REALTIME,
    enabled: !!user,
  });

  // 2. Effects
  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userError?.message?.includes('rate limit')) {
      displayError('För många förfrågningar. Vänta en stund.');
    }
  }, [userError]);

  // 3. Helpers
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation({ lat: 59.3293, lng: 18.0686 });
        }
      );
    } else {
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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s sedan`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m sedan`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h sedan`;
    return `${Math.floor(seconds / 86400)}d sedan`;
  };

  const handleMatchCreated = async (matchData) => {
    try {
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
      displayError('Kunde inte skapa match.');
    }
  };

  // 4. Data Processing
  const today = new Date().toISOString().split('T')[0];
  const upcomingMatches = allMatches.filter(m => m.status === 'upcoming' && m.date >= today);
  const userParticipations = allParticipants.filter(p => p.user_id === user?.id);
  const userMatchIds = userParticipations.map(p => p.match_id);

  const myUpcomingMatches = upcomingMatches
    .filter(m => userMatchIds.includes(m.id) || m.organizer_id === user?.id)
    .slice(0, 3);

  const quickPlayMatches = upcomingMatches
    .filter(m => 
      m.is_open && !userMatchIds.includes(m.id) && m.organizer_id !== user?.id &&
      (m.is_spontaneous || m.current_players < m.max_players) &&
      (!m.skill_bracket || m.skill_bracket === 'mixed' || m.skill_bracket === user?.skill_level)
    )
    .slice(0, 5);

  const nearbyMatches = userLocation ? upcomingMatches
    .filter(m => !userMatchIds.includes(m.id) && m.organizer_id !== user?.id)
    .map(match => {
      const venue = venues.find(v => v.id === match.venue_id);
      if (!venue?.latitude || !venue?.longitude) return { ...match, distance: Infinity };
      return { ...match, distance: calculateDistance(userLocation.lat, userLocation.lng, parseFloat(venue.latitude), parseFloat(venue.longitude)), venue };
    })
    .filter(m => m.distance < 10)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3) : [];

  // Weekly Stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyMatches = allMatches.filter(m => m.status === 'completed' && m.completed_at && new Date(m.completed_at) > weekAgo && userMatchIds.includes(m.id));
  const weeklyMvps = weeklyMatches.filter(m => m.mvp_user_id === user?.id).length;
  const weeklyStats = { matchesPlayed: weeklyMatches.length, mvps: weeklyMvps, goal: 5 };

  // Recent Activity
  const recentActivity = allMatches
    .filter(m => m.status === 'completed' && userMatchIds.includes(m.id))
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 2)
    .map(m => ({
      type: 'match_played',
      icon: Trophy,
      text: `Du spelade på ${venues.find(v => v.id === m.venue_id)?.name || 'Okänd plan'}`,
      time: getTimeAgo(new Date(m.completed_at))
    }));

  if (weeklyMvps > 0) {
    recentActivity.unshift({
      type: 'mvp',
      icon: Award,
      text: `Du blev MVP ${weeklyMvps} gånger denna vecka!`,
      time: 'Denna vecka'
    });
  }

  const isLoading = userLoading || matchesLoading || venuesLoading || participantsLoading;

  if (isLoading) return <PageLoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      {/* Error Toast */}
      <AnimatePresence>
        {showErrorDialog && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg bg-red-600 text-white flex items-center gap-4"
          >
            <p className="text-sm font-medium">{errorMessage}</p>
            <button onClick={() => setShowErrorDialog(false)}><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Match Modal */}
      <AnimatePresence>
        {showCreateMatchModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="bg-[#121715] rounded-t-[20px] lg:rounded-2xl w-full lg:max-w-2xl border border-[#223029] h-[80vh] lg:h-auto overflow-hidden flex flex-col"
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
        
        <DashboardHeader user={user} />
        
        <QuickAccessGrid setShowCreateMatchModal={setShowCreateMatchModal} />

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Left Column: Matches */}
          <div className="lg:col-span-2">
            <DashboardUpcoming 
              myUpcomingMatches={myUpcomingMatches} 
              nearbyMatches={nearbyMatches} 
              quickPlayMatches={quickPlayMatches} 
              venues={venues} 
            />
          </div>

          {/* Right Column: Widgets */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="space-y-5 sm:space-y-6"
          >
            <CupsWidget />
            <DashboardStats weeklyStats={weeklyStats} user={user} />
            <DashboardActivity recentActivity={recentActivity} />
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[24px] border border-[#223029] p-6 sm:p-8">
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ingen match idag?</h3>
                <p className="text-white/90">Skapa eller hitta en spontan match och spela med nya vänner!</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Link to={createPageUrl("Map")} className="w-full sm:w-auto">
                  <button className="h-12 w-full sm:w-auto rounded-xl border-2 border-white/40 px-6 text-sm font-bold text-white hover:bg-white/10">
                    <div className="flex items-center justify-center gap-2"><MapPin className="w-5 h-5" /> Hitta planer</div>
                  </button>
                </Link>
                <Link to={createPageUrl("Matches")} className="w-full sm:w-auto">
                  <button className="h-12 w-full sm:w-auto rounded-xl bg-white/20 backdrop-blur-sm px-6 text-sm font-bold text-white hover:bg-white/30">
                    <div className="flex items-center justify-center gap-2"><PlayCircle className="w-5 h-5" /> Spontan match</div>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
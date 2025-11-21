import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Trophy, PlayCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import CreateMatchForm from "../components/matches/CreateMatchForm";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";

// New Components
import DashboardHeader from "../components/dashboard/DashboardHeader";
import QuickAccessGrid from "../components/dashboard/QuickAccessGrid";
import DashboardStats from "../components/dashboard/DashboardStats";
import DashboardActivity from "../components/dashboard/DashboardActivity";
import DashboardUpcoming from "../components/dashboard/DashboardUpcoming";
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
  const [errorMessage, setErrorMessage] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => await base44.auth.me(),
    ...CACHE_STRATEGIES.AUTH,
    retry: false,
  });

  // Fetch data
  const { data: allMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: QUERY_KEYS.matches,
    queryFn: async () => await base44.entities.Match.list('-date', 200),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user,
  });

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: QUERY_KEYS.venues,
    queryFn: async () => await base44.entities.Venue.list(),
    ...CACHE_STRATEGIES.STATIC,
    enabled: !!user,
  });

  const { data: allParticipants = [], isLoading: participantsLoading } = useQuery({
    queryKey: QUERY_KEYS.participants,
    queryFn: async () => await base44.entities.MatchParticipant.list(),
    ...CACHE_STRATEGIES.REALTIME,
    enabled: !!user,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setUserLocation({ lat: 59.3293, lng: 18.0686 })
      );
    } else {
      setUserLocation({ lat: 59.3293, lng: 18.0686 });
    }
  }, []);

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
    if (seconds < 60) return `${seconds} sekunder sedan`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minuter sedan`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} timmar sedan`;
    return `${Math.floor(seconds / 86400)} dagar sedan`;
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
      setErrorMessage('Kunde inte skapa match. Försök igen.');
      setShowErrorDialog(true);
    }
  };

  // Derived State
  const today = new Date().toISOString().split('T')[0];
  const userParticipations = allParticipants.filter(p => p.user_id === user?.id);
  const userMatchIds = userParticipations.map(p => p.match_id);

  const upcomingMatches = allMatches.filter(m => m.status === 'upcoming' && m.date >= today);
  
  const myUpcomingMatches = upcomingMatches
    .filter(m => userMatchIds.includes(m.id) || m.organizer_id === user?.id)
    .slice(0, 3);

  const quickPlayMatches = upcomingMatches
    .filter(m => 
      m.is_open && !userMatchIds.includes(m.id) && m.organizer_id !== user?.id &&
      (m.is_spontaneous || m.current_players < m.max_players)
    )
    .slice(0, 5);

  const nearbyMatches = userLocation ? upcomingMatches
    .filter(m => !userMatchIds.includes(m.id) && m.organizer_id !== user?.id)
    .map(match => {
      const venue = venues.find(v => v.id === match.venue_id);
      if (!venue?.latitude || !venue?.longitude) return { ...match, distance: Infinity };
      return { ...match, distance: calculateDistance(userLocation.lat, userLocation.lng, venue.latitude, venue.longitude) };
    })
    .filter(m => m.distance < 10)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3) : [];

  // Stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyMatches = allMatches.filter(m => 
    m.status === 'completed' && 
    m.completed_at && 
    new Date(m.completed_at) > weekAgo && 
    userMatchIds.includes(m.id)
  );
  
  const weeklyStats = {
    matchesPlayed: weeklyMatches.length,
    mvps: weeklyMatches.filter(m => m.mvp_user_id === user?.id).length,
    goal: 5
  };

  // Activity
  const recentActivity = allMatches
    .filter(m => m.status === 'completed' && userMatchIds.includes(m.id))
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 2)
    .map(match => ({
      type: 'match_played',
      icon: Trophy,
      text: `Du spelade på ${venues.find(v => v.id === match.venue_id)?.name || 'Okänd plan'}`,
      time: getTimeAgo(new Date(match.completed_at))
    }));

  if (userLoading || matchesLoading || venuesLoading || participantsLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      {/* Modals & Dialogs */}
      <AnimatePresence>
        {showErrorDialog && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-600 text-white rounded-lg shadow-lg">
            {errorMessage}
            <button onClick={() => setShowErrorDialog(false)} className="ml-4 font-bold">X</button>
          </div>
        )}
        {showCreateMatchModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-0">
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] max-h-[90vh] overflow-y-auto"
            >
              <CreateMatchForm venues={venues} user={user} onSubmit={handleMatchCreated} onCancel={() => setShowCreateMatchModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DashboardHeader user={user} />
        
        <QuickAccessGrid onCreateMatch={() => setShowCreateMatchModal(true)} />

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DashboardUpcoming 
              title="Kommande matcher" 
              icon={Calendar} 
              matches={myUpcomingMatches} 
              venues={venues} 
              userMatchIds={userMatchIds}
              emptyText="Inga kommande matcher"
              link={createPageUrl("Matches")}
            />
            
            {nearbyMatches.length > 0 && (
              <DashboardUpcoming 
                title="Nära dig" 
                icon={MapPin} 
                matches={nearbyMatches} 
                venues={venues} 
                userMatchIds={userMatchIds}
                emptyText="Inga matcher nära dig"
                link={createPageUrl("Map")}
              />
            )}

            {quickPlayMatches.length > 0 && (
              <DashboardUpcoming 
                title="Snabbspel" 
                icon={PlayCircle} 
                matches={quickPlayMatches} 
                venues={venues} 
                userMatchIds={userMatchIds}
                emptyText="Inga snabbspelsmatcher"
                link={createPageUrl("Matches")}
              />
            )}
          </div>

          <div className="space-y-6">
            <CupsWidget />
            <DashboardStats weeklyStats={weeklyStats} currentStreak={user?.current_streak} />
            <DashboardActivity activities={recentActivity} />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[24px] shadow-xl border border-[#223029] p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left text-white">
            <h3 className="text-2xl font-bold mb-2">Ingen match idag?</h3>
            <p className="text-white/90">Hitta en spontan match och spela med nya vänner!</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Link to={createPageUrl("Map")} className="flex-1">
              <button className="w-full h-12 rounded-xl border-2 border-white/40 text-white font-bold hover:bg-white/10 transition-all px-6">Hitta planer</button>
            </Link>
            <Link to={createPageUrl("Matches")} className="flex-1">
              <button className="w-full h-12 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold hover:bg-white/30 transition-all px-6">Spontan match</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
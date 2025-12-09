import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, SlidersHorizontal, ChevronDown, ChevronUp, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CreateMatchForm from "../components/matches/CreateMatchForm";
import InfiniteMatchList from "../components/matches/InfiniteMatchList";
import MyMatches from "../components/matches/MyMatches";
import CompletedMatches from "../components/matches/CompletedMatches";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { useInfiniteMatches } from "../components/hooks/useInfiniteMatches";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { NoMatchesFound } from "../components/ui/empty-state";

// Query keys
const QUERY_KEYS = {
  venues: ['venues'],
  user: ['user'],
  participants: ['allParticipants']
};

// Simple skeleton for initial loading
const PageLoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-[#18221E] rounded-md w-3/4"></div> {/* Title */}
    <div className="h-6 bg-[#18221E] rounded-md w-1/2 mt-2"></div> {/* Subtitle */}

    <div className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] p-4">
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-16 bg-[#18221E] rounded-[14px]"></div>
        <div className="flex-1 h-16 bg-[#18221E] rounded-[14px]"></div>
        <div className="flex-1 h-16 bg-[#18221E] rounded-[14px]"></div>
      </div>
      <div className="h-10 bg-[#18221E] rounded-[12px] w-full"></div> {/* Filter Toggle */}
    </div>

    <div className="space-y-4">
      <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6 h-40"></div>
      <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6 h-40"></div>
      <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6 h-40"></div>
    </div>
  </div>
);

// Helper function for Haversine distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // Distance in km
}

export default function MatchesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [sortBy, setSortBy] = useState("all");
  const [matchSort, setMatchSort] = useState("nearest");
  const [preselectedVenueId, setPreselectedVenueId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  // Fetch user with OPTIMIZED caching
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return currentUser;
    },
    ...CACHE_STRATEGIES.AUTH,
  });

  // Fetch venues with OPTIMIZED caching (STATIC data)
  const { data: venues = [], isLoading: isVenuesLoading } = useQuery({
    queryKey: QUERY_KEYS.venues,
    queryFn: async () => {
      const venuesData = await base44.entities.Venue.list();
      return venuesData;
    },
    ...CACHE_STRATEGIES.STATIC,
  });

  // Fetch participants with OPTIMIZED caching (REALTIME data)
  const { data: allParticipants = [], isLoading: isParticipantsLoading } = useQuery({
    queryKey: QUERY_KEYS.participants,
    queryFn: async () => {
      if (!user) return [];
      const participants = await base44.entities.MatchParticipant.list();
      return participants;
    },
    ...CACHE_STRATEGIES.REALTIME,
    enabled: !!user,
  });

  // Use infinite scroll hook for matches with OPTIMIZED caching
  const {
    data: matchesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: matchesLoading
  } = useInfiniteMatches({
    skill_level: sortBy === 'my_level' ? user?.skill_level : 'all',
    date: sortBy === 'today' ? 'today' : undefined,
    venues
  });

  // Process matches data for other tabs
  // Filter out cup matches from general browsing
  const allMatches = (matchesData?.pages.flatMap(page => page.matches) || [])
    .filter(m => !m.is_cup_match);
  
  const userMatchIds = user ? allParticipants
    .filter(p => p.user_id === user.id)
    .map(p => p.match_id) : [];
  
  const myMatches = allMatches.filter(m => 
    userMatchIds.includes(m.id) || m.organizer_id === user?.id
  );
  
  // For completed matches, always fetch when enabled
  const { data: completedMatchesData = [], isLoading: completedLoading } = useQuery({
    queryKey: ['completedMatches', user?.id],
    queryFn: async () => {
      const matches = await base44.entities.Match.filter({ status: 'completed' });
      // Only include completed matches where the current user was a participant
      const userCompletedMatches = matches.filter(m => userMatchIds.includes(m.id));
      return userCompletedMatches;
    },
    enabled: !!user && userMatchIds.length > 0, // Enabled when user and their match IDs are available
    staleTime: 60 * 1000,
  });

  // Group participants by match
  const participantsByMatch = {};
  allParticipants.forEach(p => {
    if (!participantsByMatch[p.match_id]) {
      participantsByMatch[p.match_id] = [];
    }
    participantsByMatch[p.match_id].push(p);
  });

  // The filteredMatches memo logic is now expected to be handled within InfiniteMatchList
  // as it now receives the raw matchesData and sorting parameters directly.

  // Join match mutation
  const joinMatchMutation = useMutation({
    mutationFn: async ({ matchId, userId }) => {
      await base44.entities.MatchParticipant.create({
        match_id: matchId,
        user_id: userId,
        status: 'confirmed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants });
      queryClient.invalidateQueries({ queryKey: ['completedMatches'] });
    },
  });

  useEffect(() => {
    getUserLocation();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setShowCreateForm(true);
      const venueId = urlParams.get('venue');
      if (venueId) {
        setPreselectedVenueId(venueId);
      }
    }
    
    const tab = urlParams.get('tab');
    if (tab === 'my-matches') {
      setActiveTab('my-matches');
    } else if (tab === 'completed') {
      setActiveTab('completed');
    }
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
          setUserLocation({ lat: 59.3293, lng: 18.0686 }); 
        }
      );
    } else {
      setUserLocation({ lat: 59.3293, lng: 18.0686 }); 
    }
  };

  const handleMatchCreated = async (matchData) => {
    try {
      const newMatch = await base44.entities.Match.create(matchData);
      
      await base44.entities.MatchParticipant.create({
        match_id: newMatch.id,
        user_id: user.id,
        status: 'confirmed'
      });

      setShowCreateForm(false);
      setPreselectedVenueId(null);
      
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants });
      
    } catch (error) {
      console.error("Error creating match:", error);
      await alert(
        'Kunde inte skapa match',
        'Det gick inte att skapa matchen. Försök igen om en stund.',
        { type: 'alert' }
      );
    }
  };

  const handleJoinMatch = async (matchId) => {
    try {
      const match = allMatches.find(m => m.id === matchId);
      
      const existingParticipation = allParticipants.filter(p =>
        p.match_id === matchId && p.user_id === user.id
      );

      if (existingParticipation.length > 0) {
        await alert(
          'Redan anmäld',
          'Du har redan anmält dig till denna match!',
          { type: 'info' }
        );
        return;
      }

      if (!match.is_team_match && match.skill_bracket && match.skill_bracket !== 'mixed') {
        if (user.skill_level !== match.skill_bracket) {
          const shouldJoin = await confirm(
            'Annan spelarnivå',
            `Denna match är för ${match.skill_bracket}-nivå, men din nivå är ${user.skill_level}. Vill du ändå gå med?`,
            { 
              type: 'warning',
              confirmText: 'Ja, gå med',
              cancelText: 'Nej, avbryt'
            }
          );
          if (!shouldJoin) return;
        }
      }

      const currentParticipants = participantsByMatch[matchId] || [];
      if (!match.is_spontaneous && currentParticipants.length >= match.max_players) {
        await alert(
          'Match fullbokad',
          'Tyvärr är denna match redan fullbokad. Försök igen senare!',
          { type: 'warning' }
        );
        return;
      }

      await joinMatchMutation.mutateAsync({
        matchId,
        userId: user.id
      });

      // Success popup with celebration
      await alert(
        'Anmäld! 🎉',
        `Du har anmält dig till "${match.title}". Vi ses där!`,
        { type: 'success' }
      );

    } catch (error) {
      console.error("Error joining match:", error);
      await alert(
        'Ett fel uppstod',
        'Kunde inte anmäla dig till matchen. Kontrollera din internetanslutning och försök igen.',
        { type: 'alert' }
      );
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants });
    queryClient.invalidateQueries({ queryKey: ['completedMatches'] });
  };

  const handleDeleteMatch = async (matchId) => {
    const match = allMatches.find(m => m.id === matchId);
    const shouldDelete = await confirm(
      'Radera match',
      `Är du säker på att du vill ta bort "${match?.title}"? Alla deltagare kommer att meddelas.`,
      {
        type: 'warning',
        confirmText: 'Ja, radera',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldDelete) return;

    try {
      await base44.functions.invoke('deleteMatch', { matchId });

      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants });
      queryClient.invalidateQueries({ queryKey: ['completedMatches'] });

      await alert(
        'Match raderad',
        'Matchen har tagits bort',
        { type: 'success' }
      );
    } catch (error) {
      console.error("Error deleting match:", error);
      await alert(
        'Ett fel uppstod',
        'Kunde inte ta bort matchen. Försök igen.',
        { type: 'alert' }
      );
    }
  };

  const sortByLabels = {
    all: 'Alla matcher',
    my_level: 'Min nivå',
    today: 'Idag'
  };

  const matchSortLabels = {
    nearest: 'Närmast',
    earliest: 'Tidigast',
    fullest: 'Fylldast'
  };

  // WAIT for all critical data before rendering
  // matchesLoading from useInfiniteMatches also covers the initial fetch
  const isLoading = isUserLoading || isVenuesLoading || matchesLoading;


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <PageLoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      {/* Create Match Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-0 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] 
            h-[80vh] lg:h-auto lg:max-h-[85vh] mb-16 lg:mb-0 lg:my-8 overflow-hidden flex flex-col"
          >
            <CreateMatchForm
              venues={venues}
              user={user}
              preselectedVenueId={preselectedVenueId}
              onSubmit={handleMatchCreated}
              onCancel={() => {
                setShowCreateForm(false);
                setPreselectedVenueId(null);
              }}
            />
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Simple Title Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-1">Matcher</h1>
          <p className="text-sm text-[#B6C2BC]">Hitta eller skapa din nästa fotbollsmatch</p>
        </motion.div>

        {/* Tabs with Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] p-3 sm:p-4">
            {/* Segmented Control */}
            <div className="flex gap-2 mb-4">
              <motion.button
                onClick={() => setActiveTab('browse')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 h-14 sm:h-16 rounded-[14px] font-semibold text-sm sm:text-base transition-all ${
                  activeTab === 'browse'
                    ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 shadow-[0_0_12px_rgba(43,168,74,0.2)]'
                    : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#2BA84A]/8'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span>Hitta</span>
                  <span className="text-xs opacity-70">({allMatches.length})</span>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setActiveTab('my-matches')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 h-14 sm:h-16 rounded-[14px] font-semibold text-sm sm:text-base transition-all ${
                  activeTab === 'my-matches'
                    ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 shadow-[0_0_12px_rgba(43,168,74,0.2)]'
                    : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#2BA84A]/8'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span>Anmälda</span>
                  <span className="text-xs opacity-70">({myMatches.length})</span>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setActiveTab('completed')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 h-14 sm:h-16 rounded-[14px] font-semibold text-sm sm:text-base transition-all ${
                  activeTab === 'completed'
                    ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 shadow-[0_0_12px_rgba(43,168,74,0.2)]'
                    : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#2BA84A]/8'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span>Spelade</span>
                  <CheckCircle2 className="w-4 h-4 opacity-70" />
                </div>
              </motion.button>
            </div>

            {/* Filter Toggle Button */}
            {activeTab === 'browse' && (
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between p-3 bg-[#18221E] border border-[#223029] rounded-[12px] text-[#F4F7F5] hover:border-[#2BA84A]/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#9FC9AC]" />
                  <span className="text-sm font-medium">Filtrera och sortera</span>
                </div>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </motion.button>
            )}

            {/* Filters Content */}
            {activeTab === 'browse' && (
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="flex gap-3 p-3 bg-[#18221E]/50 rounded-[12px] border border-[#223029]">
                      <div className="flex-1">
                        <label className="text-xs text-[#B6C2BC] mb-2 block font-medium">Filter</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[12px] h-10">
                            <SelectValue>{sortByLabels[sortBy]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                            <SelectItem value="all">Alla matcher</SelectItem>
                            <SelectItem value="my_level">Min nivå</SelectItem>
                            <SelectItem value="today">Idag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <label className="text-xs text-[#B6C2BC] mb-2 block font-medium">Sortera</label>
                        <Select value={matchSort} onValueChange={setMatchSort}>
                          <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[12px] h-10">
                            <SelectValue>{matchSortLabels[matchSort]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                            <SelectItem value="nearest">Närmast</SelectItem>
                            <SelectItem value="earliest">Tidigast</SelectItem>
                            <SelectItem value="fullest">Fylldast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </Card>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {allMatches.length === 0 ? (
                <NoMatchesFound onCreateMatch={() => setShowCreateForm(true)} />
              ) : (
                <InfiniteMatchList
                  data={matchesData}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  isLoading={matchesLoading}
                  venues={venues}
                  user={user}
                  participants={participantsByMatch}
                  onJoin={handleJoinMatch}
                  onRefresh={handleRefresh}
                  matchSort={matchSort}
                  userLocation={userLocation}
                  haversineDistance={haversineDistance}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'my-matches' && (
            <motion.div
              key="my-matches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <MyMatches 
                matches={myMatches}
                venues={venues}
                user={user}
                onRefresh={handleRefresh}
                onDeleteMatch={handleDeleteMatch} 
                participants={participantsByMatch}
              />
            </motion.div>
          )}

          {activeTab === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <CompletedMatches 
                matches={completedMatchesData}
                venues={venues}
                user={user}
                participants={participantsByMatch}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating "+ Skapa match" Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCreateForm(true)}
        className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-[#F4743B] hover:bg-[#E5683A] text-white rounded-full shadow-[0_8px_24px_rgba(244,116,59,0.4)] flex items-center justify-center z-40 transition-all"
      >
        <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
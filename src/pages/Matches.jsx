import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, SlidersHorizontal, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TRANSITIONS, triggerHaptic } from "../components/utils/motionTokens";
import { createPageUrl } from "@/utils";

import CreateMatchForm from "../components/matches/CreateMatchForm";
import InfiniteMatchList from "../components/matches/InfiniteMatchList";
import MyMatches from "../components/matches/MyMatches";
import CompletedMatches from "../components/matches/CompletedMatches";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { useInfiniteMatches } from "../components/hooks/useInfiniteMatches";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { NoMatchesFound } from "../components/ui/empty-state";
import { PullToRefresh } from "../components/ui/pull-to-refresh";
import { MobileSelect } from "../components/ui/mobile-select";
import PremiumHero from "../components/ui/premium-hero";
import { FilterPanel, FilterField } from "../components/ui/filter-panel";
import { Calendar as CalendarIcon } from "lucide-react";
import { 
  createMatch, 
  joinMatch,
  deleteMatch,
  getVenues,
  getMyProfile,
  getMyParticipantMatchIds,
  getParticipantsForMatches,
  getCompletedMatches,
  transformMatchData
} from "../components/supabase/services";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { haversineDistance } from "../utils/geo";

// Query keys
const QUERY_KEYS = {
  venues: ['supabase-venues'],
  userProfile: ['supabase-userProfile'],
  myParticipantMatchIds: ['supabase-myParticipantMatchIds'],
  completedMatches: ['supabase-completedMatches']
};

// Simple skeleton for initial loading
const PageLoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-[#18221E] rounded-md w-3/4"></div>
    <div className="h-6 bg-[#18221E] rounded-md w-1/2 mt-2"></div>
    <div className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] p-4">
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-16 bg-[#18221E] rounded-[14px]"></div>
        <div className="flex-1 h-16 bg-[#18221E] rounded-[14px]"></div>
        <div className="flex-1 h-16 bg-[#18221E] rounded-[14px]"></div>
      </div>
      <div className="h-10 bg-[#18221E] rounded-[12px] w-full"></div>
    </div>
    <div className="space-y-4">
      <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6 h-40"></div>
      <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6 h-40"></div>
      <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6 h-40"></div>
    </div>
  </div>
);


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
  const navigate = useNavigate();
  
  // Use Supabase auth as source of truth
  const { user: authUser, isGuest, isAuthenticated } = useSupabaseAuth();

  // Fetch user profile from Supabase users table
  const { data: userProfile, isLoading: isUserLoading } = useQuery({
    queryKey: [...QUERY_KEYS.userProfile, authUser?.id],
    queryFn: () => getMyProfile(),
    ...CACHE_STRATEGIES.AUTH,
    enabled: isAuthenticated && !!authUser?.id
  });

  // Combine auth user with profile for backwards compatibility
  const user = useMemo(() => {
    if (!authUser) return null;
    return {
      ...authUser,
      ...userProfile,
      id: authUser.id // Ensure ID comes from auth
    };
  }, [authUser, userProfile]);

  // Fetch venues from Supabase
  const { data: venues = [], isLoading: isVenuesLoading } = useQuery({
    queryKey: QUERY_KEYS.venues,
    queryFn: () => getVenues(),
    ...CACHE_STRATEGIES.STATIC,
  });

  // Fetch user's participant match IDs from Supabase
  const { data: myParticipantMatchIds = [], isLoading: isParticipantIdsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.myParticipantMatchIds, authUser?.id],
    queryFn: () => getMyParticipantMatchIds(),
    ...CACHE_STRATEGIES.REALTIME,
    enabled: isAuthenticated && !!authUser?.id,
  });

  // Use infinite scroll hook for matches (already uses Supabase)
  const {
    data: matchesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: matchesLoading
  } = useInfiniteMatches({
    skill_level: sortBy === 'my_level' ? userProfile?.skill_level : 'all',
    date: sortBy === 'today' ? 'today' : undefined,
    venues
  });

  // Process matches data - filter out cup matches
  const allMatches = useMemo(() => {
    return (matchesData?.pages.flatMap(page => page.matches) || [])
      .filter(m => !m.is_cup_match);
  }, [matchesData]);

  // Get visible match IDs for fetching participants
  const visibleMatchIds = useMemo(() => {
    return allMatches.map(m => m.id);
  }, [allMatches]);

  // Fetch participants for visible matches
  const { data: visibleParticipants = [] } = useQuery({
    queryKey: ['supabase-participantsForMatches', visibleMatchIds],
    queryFn: () => getParticipantsForMatches(visibleMatchIds),
    ...CACHE_STRATEGIES.REALTIME,
    enabled: visibleMatchIds.length > 0,
  });

  // Group participants by match
  const participantsByMatch = useMemo(() => {
    const grouped = {};
    visibleParticipants.forEach(p => {
      if (!grouped[p.match_id]) {
        grouped[p.match_id] = [];
      }
      grouped[p.match_id].push(p);
    });
    return grouped;
  }, [visibleParticipants]);

  // Filter my matches from the loaded matches
  const myMatches = useMemo(() => {
    return allMatches.filter(m => 
      myParticipantMatchIds.includes(m.id) || m.organizer_id === authUser?.id
    );
  }, [allMatches, myParticipantMatchIds, authUser?.id]);
  
  // Fetch completed matches from Supabase (uses 'finished' status)
  const { data: completedMatchesRaw = [], isLoading: completedLoading } = useQuery({
    queryKey: [...QUERY_KEYS.completedMatches, authUser?.id],
    queryFn: () => getCompletedMatches(authUser?.id),
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 60 * 1000,
  });

  // Transform completed matches data
  const completedMatchesData = useMemo(() => {
    return completedMatchesRaw.map(transformMatchData);
  }, [completedMatchesRaw]);

  // Join match mutation - uses Supabase Edge Function (RLS enforced)
  const joinMatchMutation = useMutation({
    mutationFn: async ({ matchId }) => {
      await joinMatch(matchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myParticipantMatchIds });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completedMatches });
      queryClient.invalidateQueries({ queryKey: ['supabase-participantsForMatches'] });
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

  const handleMatchCreated = async ({ match: matchData, venue: selectedVenue }) => {
    try {
      // Venues are already in Supabase — no upsert needed.
      // createMatch() looks up external_id from the venue UUID internally.
      const result = await createMatch(matchData);

      setShowCreateForm(false);
      setPreselectedVenueId(null);
      
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myParticipantMatchIds });
      
      // Navigate to newly created match if we got an ID back
      if (result?.match_id) {
        navigate(`${createPageUrl("MatchDetail")}?id=${result.match_id}`);
      }
      
    } catch (error) {
      console.error("Error creating match:", error);
      await alert(
        'Kunde inte skapa match',
        error.message || 'Det gick inte att skapa matchen. Försök igen om en stund.',
        { type: 'alert' }
      );
    }
  };

  const handleJoinMatch = async (matchId) => {
    try {
      const match = allMatches.find(m => m.id === matchId);
      
      // Let backend handle all validation (auth, duplicates, capacity, skill level)
      await joinMatchMutation.mutateAsync({ matchId });

      await alert(
        'Anmäld! 🎉',
        `Du har anmält dig till "${match?.title || 'matchen'}". Vi ses där!`,
        { type: 'success' }
      );

    } catch (error) {
      console.error("Error joining match:", error);
      await alert(
        'Kunde inte gå med',
        error.message || 'Det gick inte att gå med i matchen. Försök igen.',
        { type: 'alert' }
      );
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myParticipantMatchIds }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completedMatches }),
      queryClient.invalidateQueries({ queryKey: ['supabase-participantsForMatches'] })
    ]);
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
      // Use deleteMatch service method
      await deleteMatch(matchId);

      queryClient.invalidateQueries({ queryKey: ['matches-infinite'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myParticipantMatchIds });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completedMatches });

      await alert(
        'Match raderad',
        'Matchen har tagits bort',
        { type: 'success' }
      );
    } catch (error) {
      console.error("Error deleting match:", error);
      const msg = error.status === 403 
        ? 'Endast arrangören kan radera matchen.' 
        : error.status === 401 
          ? 'Du måste vara inloggad.' 
          : (error.message || 'Det gick inte att radera matchen. Försök igen.');
      await alert('Kunde inte ta bort matchen', msg, { type: 'alert' });
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
    fullest: 'Mest fyllda'
  };

  // Only gate on venues (layout-critical). Matches stream in via infinite scroll.
  const isLoading = isVenuesLoading;

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
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      {/* Create Match Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => { setShowCreateForm(false); setPreselectedVenueId(null); }}
              className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] 
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
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        
        {/* Tabs with Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl p-2 sm:p-3">
            {/* Premium segmented tabs — glidande pill, 3 lika breda */}
            <div
              role="tablist"
              className="relative grid grid-cols-3 gap-0.5 p-1 bg-[#0F1513] border border-[#243029] rounded-2xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
            >
              {[
                { id: 'browse', label: 'Hitta', count: allMatches.length, accent: '#34C257' },
                { id: 'my-matches', label: 'Anmälda', count: myMatches.length, accent: '#FDBA74' },
                { id: 'completed', label: 'Spelade', count: null, accent: '#C4B5FD' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => { triggerHaptic('light'); setActiveTab(tab.id); }}
                    className="relative h-11 sm:h-12 rounded-xl flex items-center justify-center gap-1.5 text-[13px] sm:text-[14px] font-bold transition-colors z-10"
                    style={{ color: isActive ? '#FFFFFF' : '#9EAAA4' }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="matches-tab-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-xl -z-10"
                        style={{
                          background: `linear-gradient(180deg, ${tab.accent}38 0%, ${tab.accent}14 100%)`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${tab.accent}55`,
                        }}
                        aria-hidden
                      />
                    )}
                    <span>{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <span
                        className="text-[10px] font-black tabular-nums min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                        style={{
                          background: isActive ? `${tab.accent}30` : '#18221E',
                          color: isActive ? tab.accent : '#6B7A73',
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Premium Filter Panel */}
            {activeTab === 'browse' && (
              <div className="mt-3">
                <FilterPanel
                  open={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                  summary={`${sortByLabels[sortBy]} • ${matchSortLabels[matchSort]}`}
                  activeCount={(sortBy !== 'all' ? 1 : 0) + (matchSort !== 'nearest' ? 1 : 0)}
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <FilterField label="Filter">
                      <MobileSelect
                        value={sortBy}
                        onValueChange={setSortBy}
                        placeholder="Filter"
                        label="Filtrera matcher"
                        className="w-full bg-[#141917] border border-[#243029] text-[#F5F8F6] rounded-xl h-11 px-3 flex items-center"
                        options={[
                          { value: 'all', label: 'Alla matcher' },
                          { value: 'my_level', label: 'Min nivå' },
                          { value: 'today', label: 'Idag' }
                        ]}
                      />
                    </FilterField>
                    <FilterField label="Sortera">
                      <MobileSelect
                        value={matchSort}
                        onValueChange={setMatchSort}
                        placeholder="Sortera"
                        label="Sortera matcher"
                        className="w-full bg-[#141917] border border-[#243029] text-[#F5F8F6] rounded-xl h-11 px-3 flex items-center"
                        options={[
                          { value: 'nearest', label: 'Närmast' },
                          { value: 'earliest', label: 'Tidigast' },
                          { value: 'fullest', label: 'Mest fyllda' }
                        ]}
                      />
                    </FilterField>
                  </div>
                </FilterPanel>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
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
        onClick={() => { triggerHaptic('medium'); setShowCreateForm(true); }}
        className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-[#F4743B] hover:bg-[#E5683A] text-white rounded-full shadow-[0_8px_24px_rgba(244,116,59,0.4)] flex items-center justify-center z-40 transition-all"
      >
        <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
      </motion.button>
    </div>
    </PullToRefresh>
  );
}
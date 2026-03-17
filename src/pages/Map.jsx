import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Filter, Search, Navigation, SlidersHorizontal, List, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import {
  getVenues,
  getPublicMatches,
  getMyParticipantMatchIds,
  getParticipantsForMatches,
  transformMatchData
} from "../components/supabase/services";

import MapView from "../components/map/MapView";
import VenueCard from "../components/map/VenueCard";
import VenueDetailModal from "../components/map/VenueDetailModal";
import FilterSheet from "../components/map/FilterSheet";
import AllPlayToggle from "../components/map/AllPlayToggle";

export default function MapPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [matches, setMatches] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("map");
  const [filters, setFilters] = useState({
    format: "all",
    date: "all",
    skillLevel: "all",
    distance: 50,
    sortBy: "distance"
  });
  const [userLocation, setUserLocation] = useState({ lat: 59.3293, lng: 18.0686 });
  const [recenterFlag, setRecenterFlag] = useState(0);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenueForModal, setSelectedVenueForModal] = useState(null);
  const [showOtherVenues, setShowOtherVenues] = useState(false);
  const { user: authUser, isAuthenticated } = useSupabaseAuth();

  const formatLabels = {
    all: 'ALLA FORMAT',
    '5v5': '5V5',
    '7v7': '7V7',
    '11v11': '11V11'
  };

  const sortByLabels = {
    distance: 'AVSTÅND',
    matches: 'MEST BOKADE'
  };

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
        typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      console.warn('Invalid coordinates for distance calculation:', { lat1, lon1, lat2, lon2 });
      return Infinity;
    }

    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = venues.filter(venue => {
      if (venue.latitude == null || venue.longitude == null ||
          isNaN(parseFloat(venue.latitude)) || isNaN(parseFloat(venue.longitude))) {
        return false;
      }

      // AllPlay filter: only show non-allplay venues if toggle is on
      if (!showOtherVenues && !venue.is_allplay) {
        return false;
      }

      if (searchQuery && !venue.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !venue.address.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filters.format !== "all" && !venue.formats_supported?.includes(filters.format)) {
        return false;
      }

      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        parseFloat(venue.latitude), 
        parseFloat(venue.longitude)
      );
      
      if (distance === Infinity || distance > filters.distance) {
        return false;
      }

      return true;
    });

    filtered = filtered.map(venue => {
      const venueMatches = matches.filter(m => {
        if (m.venue_id !== venue.id) return false;
        if (m.status !== 'upcoming') return false;
        
        if (filters.skillLevel !== "all" && !m.is_team_match) {
          if (m.skill_bracket && m.skill_bracket !== 'mixed' && m.skill_bracket !== filters.skillLevel) {
            return false;
          }
        }

        if (filters.date !== "all") {
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          
          if (filters.date === "today" && m.date !== today) return false;
          if (filters.date === "tomorrow" && m.date !== tomorrow) return false;
          if (filters.date === "week") {
            const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
            if (m.date > weekFromNow) return false;
          }
        }

        return true;
      });

      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        parseFloat(venue.latitude), 
        parseFloat(venue.longitude)
      );

      return {
        ...venue,
        upcoming_matches: venueMatches,
        distance: distance === Infinity ? 999999 : distance
      };
    });

    filtered.sort((a, b) => {
      if (filters.sortBy === "distance") {
        return a.distance - b.distance;
      } else if (filters.sortBy === "rating") {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      } else if (filters.sortBy === "matches") {
        const matchesA = a.upcoming_matches?.length || 0;
        const matchesB = b.upcoming_matches?.length || 0;
        return matchesB - matchesA;
      }
      return 0;
    });

    setFilteredVenues(filtered);
  }, [venues, matches, filters, searchQuery, userLocation, calculateDistance, showOtherVenues]);

  // Fetch map data from Supabase
  const { data: mapData } = useQuery({
    queryKey: ['map-data'],
    queryFn: async () => {
      const [venuesData, matchesRaw] = await Promise.all([
        getVenues(),
        getPublicMatches({ status: 'upcoming' }),
      ]);
      const now = new Date();
      const matches = matchesRaw
        .map(transformMatchData)
        .filter(m => {
          if (!m || !m.date || !m.time) return false;
          // Keep matches that haven't ended yet (start time + duration)
          const matchStart = new Date(`${m.date}T${m.time}`);
          const durationMs = (m.duration_minutes || 90) * 60 * 1000;
          const matchEnd = new Date(matchStart.getTime() + durationMs);
          return matchEnd > now;
        });
      return { venues: venuesData, matches };
    },
    staleTime: 60 * 1000, // 1 minute — map data should be fresh
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // Refresh when user returns to app
    refetchOnMount: true,
    refetchInterval: 2 * 60 * 1000, // Poll every 2 minutes
  });

  // Fetch user's match IDs
  const { data: userMatchIds = [] } = useQuery({
    queryKey: ['map-user-match-ids', authUser?.id],
    queryFn: () => getMyParticipantMatchIds(),
    enabled: isAuthenticated && !!authUser?.id,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  // Fetch participants for visible matches
  const matchIds = (mapData?.matches || []).map(m => m.id);
  const { data: allParticipants = [] } = useQuery({
    queryKey: ['map-participants', matchIds.slice(0, 5).join(',')],
    queryFn: () => getParticipantsForMatches(matchIds),
    enabled: matchIds.length > 0,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
  });

  // Sync state from queries
  useEffect(() => {
    if (mapData?.venues) setVenues(mapData.venues);
    if (mapData?.matches) setMatches(mapData.matches);
  }, [mapData]);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getUserLocation = (recenter = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (!isNaN(lat) && !isNaN(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            setUserLocation({ lat, lng });
            if (recenter) {
              setSelectedVenue(null);
              setRecenterFlag(f => f + 1);
            }
          } else {
            setUserLocation({ lat: 59.3293, lng: 18.0686 });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation({ lat: 59.3293, lng: 18.0686 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };

  const handleVenueClick = (venue) => {
    setSelectedVenue(venue);
  };

  const handleShowDetails = (venue) => {
    setSelectedVenueForModal(venue);
    setShowVenueModal(true);
  };

  const handleCreateMatchForVenue = (venue) => {
    navigate(`${createPageUrl("Matches")}?create=true&venue=${venue.id}`);
  };

  const handleMatchClick = (matchId) => {
    navigate(`${createPageUrl("MatchDetail")}?id=${matchId}`);
  };

  const totalMatchesInRange = filteredVenues.reduce((sum, venue) => sum + (venue.upcoming_matches?.length || 0), 0);

  return (
    <div className="bg-[#0F1513]">
      <div className="lg:hidden flex flex-col" style={{ height: 'calc(100dvh - env(safe-area-inset-top) - 3.5rem - 5rem - env(safe-area-inset-bottom))' }}>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="sticky top-0 z-[50] bg-[#121715]/95 backdrop-blur-xl border-b border-[#223029]/60 p-3 space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-[#18221E]/80 rounded-full p-1 border border-[#223029]/60">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center gap-1 px-3 h-8 rounded-full text-[12px] font-semibold transition-all ${
                  viewMode === "list"
                    ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                    : 'text-[#9EAAA4]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Lista
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center justify-center gap-1 px-3 h-8 rounded-full text-[12px] font-semibold transition-all ${
                  viewMode === "map"
                    ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                    : 'text-[#9EAAA4]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Karta
              </button>
            </div>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9EAAA4] w-4 h-4" />
              <Input
                placeholder="Sök planer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-[#18221E]/80 border border-[#223029]/60 text-[#F4F7F5] placeholder:text-[#9EAAA4] focus:border-[#2BA84A]/50 rounded-full text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <AllPlayToggle showOtherVenues={showOtherVenues} onToggle={() => setShowOtherVenues(v => !v)} />
            <FilterSheet filters={filters} onFilterChange={setFilters} />
            
            <button 
              onClick={() => getUserLocation(true)}
              className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-[#2BA84A]/12 border border-[#2BA84A]/25 hover:bg-[#2BA84A]/20 text-[#2BA84A] rounded-full transition-all shadow-[0_0_12px_rgba(43,168,74,0.15)]"
            >
              <Navigation className="w-4 h-4" />
            </button>
            
            <span className="inline-flex h-7 items-center rounded-full bg-[#18221E] px-2.5 text-[11px] font-medium text-[#9EAAA4] ring-1 ring-[#223029]/60 ml-auto">
              {filteredVenues.length} planer · {filters.distance}km
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="flex-1 overflow-hidden relative"
        >
          {viewMode === "list" ? (
            <div className="h-full overflow-y-auto p-3 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredVenues.map((venue, index) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <VenueCard
                      venue={venue}
                      matches={venue.upcoming_matches || []}
                      isSelected={selectedVenue?.id === venue.id}
                      onClick={() => handleShowDetails(venue)}
                      onMatchClick={handleMatchClick}
                      userMatchIds={userMatchIds}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredVenues.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-[#248232] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Inga planer hittade</h3>
                  <p className="text-sm text-[#B6C2BC] mb-6">Prova att öka avståndet</p>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, distance: 50 }))}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A]/16 px-5 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 font-semibold"
                  >
                    Öka till 50km
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full relative z-0">
              <MapView
                venues={filteredVenues}
                matches={matches}
                allParticipants={allParticipants}
                selectedVenue={selectedVenue}
                userLocation={userLocation}
                recenterFlag={recenterFlag}
                onVenueSelect={handleVenueClick}
                onShowDetails={handleShowDetails}
                onMatchClick={handleMatchClick}
                userMatchIds={userMatchIds}
              />
            </div>
          )}
        </motion.div>
      </div>

      <div className="hidden lg:flex h-screen">
        <div className="w-96 bg-[#121715] border-r border-[#223029]/60 flex flex-col z-10">
          <div className="sticky top-0 z-10 bg-[#121715] p-4 border-b border-[#223029]/60 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-[#F4F7F5] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2BA84A]/15 flex items-center justify-center ring-1 ring-[#2BA84A]/25">
                  <MapPin className="w-4 h-4 text-[#2BA84A]" />
                </div>
                Hitta planer
              </h1>
              <button 
                onClick={() => getUserLocation(true)}
                className="h-9 w-9 flex items-center justify-center bg-[#2BA84A]/12 border border-[#2BA84A]/25 hover:bg-[#2BA84A]/20 text-[#2BA84A] rounded-full transition-all shadow-[0_0_12px_rgba(43,168,74,0.15)]"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9EAAA4] w-4 h-4" />
              <Input
                placeholder="Sök planer eller områden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-[#18221E]/80 border border-[#223029]/60 text-[#F4F7F5] placeholder:text-[#9EAAA4] focus:border-[#2BA84A]/50 rounded-full text-sm"
              />
            </div>

            <AllPlayToggle showOtherVenues={showOtherVenues} onToggle={() => setShowOtherVenues(v => !v)} />

            <div className="flex gap-2">
              <Select value={filters.format} onValueChange={(value) => setFilters(prev => ({ ...prev, format: value }))}>
                <SelectTrigger className="h-10 flex-1 bg-[#18221E]/80 border border-[#223029]/60 text-[#F4F7F5] rounded-full text-xs uppercase tracking-wide">
                  <Filter className="w-4 h-4 mr-1.5" />
                  <SelectValue>
                    {formatLabels[filters.format]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#121715] border border-[#223029] rounded-xl">
                  <SelectItem value="all">ALLA FORMAT</SelectItem>
                  <SelectItem value="5v5">5V5</SelectItem>
                  <SelectItem value="7v7">7V7</SelectItem>
                  <SelectItem value="11v11">11V11</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="h-10 flex-1 bg-[#18221E]/80 border border-[#223029]/60 text-[#F4F7F5] rounded-full text-xs uppercase tracking-wide">
                  <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                  <SelectValue>
                    {sortByLabels[filters.sortBy]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#121715] border border-[#223029] rounded-xl">
                  <SelectItem value="distance">AVSTÅND</SelectItem>
                  <SelectItem value="matches">MEST BOKADE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F7F5]">
                {filteredVenues.length} planer
              </span>
              <span className="inline-flex h-6 items-center rounded-full bg-[#18221E] px-2.5 font-medium text-[#9EAAA4] ring-1 ring-[#223029]/60 text-[11px]">
                {filteredVenues.length} planer · {filters.distance}km
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredVenues.map(venue => (
              <VenueCard
                key={venue.id}
                venue={venue}
                matches={venue.upcoming_matches || []}
                isSelected={selectedVenue?.id === venue.id}
                onClick={() => handleShowDetails(venue)}
                onMatchClick={handleMatchClick}
                userMatchIds={userMatchIds}
                allParticipants={allParticipants}
              />
            ))}
            
            {filteredVenues.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-[#248232] mx-auto mb-4 opacity-50" />
                <h3 className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] mb-2">Inga planer hittade</h3>
                <p className="text-[14px] leading-[20px] text-[#B6C2BC] mb-6">Prova att öka avståndet eller justera dina filter</p>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, distance: 50 }))}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#2BA84A]/16 px-6 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 hover:ring-[#2BA84A]/45 hover:scale-[1.02] font-semibold"
                >
                  Öka till 50km
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative z-0">
          <MapView
            venues={filteredVenues}
            matches={matches}
            allParticipants={allParticipants}
            selectedVenue={selectedVenue}
            userLocation={userLocation}
            recenterFlag={recenterFlag}
            onVenueSelect={handleVenueClick}
            onShowDetails={handleShowDetails}
            onMatchClick={handleMatchClick}
            userMatchIds={userMatchIds}
          />
        </div>
      </div>

      {showVenueModal && selectedVenueForModal && (
        <VenueDetailModal
          venue={selectedVenueForModal}
          matches={matches.filter(m => m.venue_id === selectedVenueForModal.id && m.status === 'upcoming')}
          onClose={() => {
            setShowVenueModal(false);
            setSelectedVenueForModal(null);
            setSelectedVenue(null);
          }}
          onCreateMatch={handleCreateMatchForVenue}
        />
      )}
    </div>
  );
}
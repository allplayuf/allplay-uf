import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Filter, Search, Navigation, SlidersHorizontal, List, Map as MapIcon, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import MapView from "../components/map/MapView";
import VenueCard from "../components/map/VenueCard";
import VenueDetailModal from "../components/map/VenueDetailModal";
import FilterSheet from "../components/map/FilterSheet";

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
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenueForModal, setSelectedVenueForModal] = useState(null);
  const [user, setUser] = useState(null);
  const [userMatchIds, setUserMatchIds] = useState([]);

  const formatLabels = {
    all: 'Alla format',
    '5v5': '5v5',
    '7v7': '7v7',
    '11v11': '11v11'
  };

  const sortByLabels = {
    distance: 'Närmast',
    rating: 'Betyg',
    matches: 'Matcher'
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
      if (!venue.latitude || !venue.longitude ||
          isNaN(parseFloat(venue.latitude)) || isNaN(parseFloat(venue.longitude))) {
        console.warn('Venue missing valid coordinates:', venue.name);
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
  }, [venues, matches, filters, searchQuery, userLocation, calculateDistance]);

  useEffect(() => {
    loadMapData();
    getUserLocation();
    loadUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const participations = await base44.entities.MatchParticipant.filter({ user_id: currentUser.id });
      const matchIds = participations.map(p => p.match_id);
      setUserMatchIds(matchIds);
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
      setUserMatchIds([]);
    }
  };

  const loadMapData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [venuesData, matchesData] = await Promise.all([
        base44.entities.Venue.list(),
        base44.entities.Match.filter({ status: 'upcoming' }, '-date', 100)
      ]);

      const upcomingMatches = matchesData.filter(m => m.date >= today);

      setVenues(venuesData);
      setMatches(upcomingMatches);
    } catch (error) {
      console.error("Error loading map data:", error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          console.log('User location obtained:', { lat, lng });
          
          if (!isNaN(lat) && !isNaN(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            setUserLocation({ lat, lng });
          } else {
            console.error('Invalid coordinates from geolocation:', { lat, lng });
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
    } else {
      console.log('Geolocation not supported');
      setUserLocation({ lat: 59.3293, lng: 18.0686 });
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
    <div className="min-h-screen bg-[#0F1513]">
      {/* MOBILE VIEW */}
      <div className="lg:hidden flex flex-col h-screen pb-16">
        {/* MOBILE HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="sticky top-0 z-[100] bg-gradient-to-br from-[#2BA84A] to-[#0F2917] border-b border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          {/* Decorative rings */}
          <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-[#2BA84A]/40 rounded-full opacity-50"></div>
          <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-[#0F2917]/60 rounded-full opacity-50"></div>

          <div className="relative z-10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30"
                >
                  <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white">Hitta planer</h1>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {filteredVenues.length} planer nära dig
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1 bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/30">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center justify-center gap-1 px-3 h-9 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "list"
                      ? 'bg-white/30 text-white shadow-lg'
                      : 'text-white/70'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center justify-center gap-1 px-3 h-9 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "map"
                      ? 'bg-white/30 text-white shadow-lg'
                      : 'text-white/70'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  Karta
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <Input
                placeholder="Sök planer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:border-white/50 focus:bg-white/25 rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              <FilterSheet filters={filters} onFilterChange={setFilters} />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={getUserLocation}
                className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl transition-all"
              >
                <Navigation className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">{filteredVenues.length} planer</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center rounded-full bg-white/20 backdrop-blur-sm px-3 font-semibold text-white border border-white/30">
                  {totalMatchesInRange} matcher
                </span>
                <span className="inline-flex h-6 items-center rounded-full bg-[#F4743B]/30 backdrop-blur-sm px-3 font-semibold text-white border border-[#F4743B]/40">
                  {filters.distance}km
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === "list" ? (
            <div className="h-full overflow-y-auto p-3 space-y-3 pb-4">
              {filteredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
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
              
              {filteredVenues.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-[#2BA84A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Inga planer hittade</h3>
                  <p className="text-sm text-[#B6C2BC] mb-6">Prova att öka avståndet</p>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, distance: 50 }))}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2BA84A]/16 px-5 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 font-semibold"
                  >
                    Öka till 50km
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="h-full relative z-0">
              <MapView
                venues={filteredVenues}
                matches={matches}
                selectedVenue={selectedVenue}
                userLocation={userLocation}
                onVenueSelect={handleVenueClick}
                onShowDetails={handleShowDetails}
                onMatchClick={handleMatchClick}
                userMatchIds={userMatchIds}
              />
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:flex h-screen">
        <div className="w-96 bg-[#121715] border-r border-[#223029] flex flex-col z-10">
          {/* DESKTOP HERO HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="sticky top-0 z-10 bg-gradient-to-br from-[#2BA84A] to-[#0F2917] border-b border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          >
            {/* Decorative rings */}
            <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full opacity-50"></div>
            <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-[#0F2917]/60 rounded-full opacity-50"></div>

            <div className="relative z-10 p-4 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30"
                >
                  <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Hitta planer</h1>
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Upptäck fotbollsplaner nära dig
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <Input
                  placeholder="Sök planer eller områden..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:border-white/50 focus:bg-white/25 rounded-2xl"
                />
              </div>

              <div className="flex gap-2">
                <Select value={filters.format} onValueChange={(value) => setFilters(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger className="h-12 flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/25">
                    <Filter className="w-5 h-5 mr-2" />
                    <SelectValue>
                      {formatLabels[filters.format]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#121715] border border-[#223029] rounded-2xl">
                    <SelectItem value="all">Alla format</SelectItem>
                    <SelectItem value="5v5">5v5</SelectItem>
                    <SelectItem value="7v7">7v7</SelectItem>
                    <SelectItem value="11v11">11v11</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="h-12 flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/25">
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    <SelectValue>
                      {sortByLabels[filters.sortBy]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#121715] border border-[#223029] rounded-2xl">
                    <SelectItem value="distance">Närmast</SelectItem>
                    <SelectItem value="rating">Betyg</SelectItem>
                    <SelectItem value="matches">Matcher</SelectItem>
                  </SelectContent>
                </Select>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={getUserLocation}
                  className="h-12 w-12 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-2xl transition-all"
                >
                  <Navigation className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">
                  {filteredVenues.length} planer
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 items-center rounded-full bg-white/20 backdrop-blur-sm px-3 text-xs font-semibold text-white border border-white/30">
                    {totalMatchesInRange} matcher
                  </span>
                  <span className="inline-flex h-7 items-center rounded-full bg-[#F4743B]/30 backdrop-blur-sm px-3 text-xs font-semibold text-white border border-[#F4743B]/40">
                    {filters.distance}km
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
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
            
            {filteredVenues.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-10 h-10 text-[#2BA84A]" />
                </div>
                <h3 className="text-xl font-semibold text-[#F4F7F5] mb-2">Inga planer hittade</h3>
                <p className="text-sm text-[#B6C2BC] mb-6">Prova att öka avståndet eller justera dina filter</p>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, distance: 50 }))}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2BA84A]/16 px-6 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 hover:ring-[#2BA84A]/45 hover:scale-[1.02] font-semibold"
                >
                  Öka till 50km
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex-1 relative z-0">
          <MapView
            venues={filteredVenues}
            matches={matches}
            selectedVenue={selectedVenue}
            userLocation={userLocation}
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
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Filter, Search, Navigation, SlidersHorizontal, List, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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
      <div className="lg:hidden flex flex-col h-screen pb-16">
        <div className="sticky top-0 z-[100] bg-[#121715] border-b border-[#223029] p-3 space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#F4F7F5] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2BA84A]" />
              Hitta planer
            </h1>
            
            <div className="flex gap-1 bg-[#18221E] rounded-[12px] p-1 border border-[#223029]">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center gap-1 px-3 h-9 rounded-[10px] text-[13px] leading-[18px] font-medium transition-all ${
                  viewMode === "list"
                    ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                    : 'text-[#B6C2BC]'
                }`}
              >
                <List className="w-4 h-4" />
                Lista
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center justify-center gap-1 px-3 h-9 rounded-[10px] text-[13px] leading-[18px] font-medium transition-all ${
                  viewMode === "map"
                    ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                    : 'text-[#B6C2BC]'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                Karta
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B6C2BC] w-5 h-5" />
            <Input
              placeholder="Sök planer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#B6C2BC] focus:border-[#2BA84A] rounded-[14px] text-sm"
            />
          </div>

          <div className="flex gap-2">
            <FilterSheet filters={filters} onFilterChange={setFilters} />
            
            <button 
              onClick={getUserLocation}
              className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-[#18221E] border border-[#223029] hover:bg-[#2BA84A]/20 text-[#2BA84A] rounded-[14px] transition-all"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[13px] leading-[18px]">
            <span className="font-medium text-[#F4F7F5]">{filteredVenues.length} planer</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-2 font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                {totalMatchesInRange} matcher
              </span>
              <span className="inline-flex h-6 items-center rounded-full bg-[#F4743B]/18 px-2 font-medium text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                {filters.distance}km
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === "list" ? (
            <div className="h-full overflow-y-auto p-3 space-y-3 pb-4">
              {filteredVenues.map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  matches={venue.upcoming_matches || []}
                  isSelected={selectedVenue?.id === venue.id}
                  onClick={() => handleVenueClick(venue)}
                  onMatchClick={handleMatchClick}
                  userMatchIds={userMatchIds}
                />
              ))}
              
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
                selectedVenue={selectedVenue}
                userLocation={userLocation}
                onVenueSelect={handleVenueClick}
                onMatchClick={handleMatchClick}
                userMatchIds={userMatchIds}
              />
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:flex h-screen">
        <div className="w-96 bg-[#121715] border-r border-[#223029] flex flex-col z-10">
          <div className="sticky top-0 z-10 bg-[#121715] p-4 border-b border-[#223029] space-y-3">
            <h1 className="text-[28px] leading-[34px] font-semibold text-[#F4F7F5] flex items-center gap-2">
              <MapPin className="w-6 h-6 text-[#2BA84A]" />
              Hitta planer
            </h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B6C2BC] w-5 h-5" />
              <Input
                placeholder="Sök planer eller områden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#B6C2BC] focus:border-[#2BA84A] rounded-[16px] text-base"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filters.format} onValueChange={(value) => setFilters(prev => ({ ...prev, format: value }))}>
                <SelectTrigger className="h-12 flex-1 bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[16px]">
                  <Filter className="w-5 h-5 mr-2" />
                  <SelectValue>
                    {formatLabels[filters.format]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#121715] border border-[#223029] rounded-[16px]">
                  <SelectItem value="all">Alla format</SelectItem>
                  <SelectItem value="5v5">5v5</SelectItem>
                  <SelectItem value="7v7">7v7</SelectItem>
                  <SelectItem value="11v11">11v11</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="h-12 flex-1 bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[16px]">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  <SelectValue>
                    {sortByLabels[filters.sortBy]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#121715] border border-[#223029] rounded-[16px]">
                  <SelectItem value="distance">Närmast</SelectItem>
                  <SelectItem value="rating">Betyg</SelectItem>
                  <SelectItem value="matches">Matcher</SelectItem>
                </SelectContent>
              </Select>

              <button 
                onClick={getUserLocation}
                className="h-12 w-12 flex items-center justify-center bg-[#18221E] border border-[#223029] hover:bg-[#2BA84A]/20 text-[#2BA84A] rounded-[16px] transition-all hover:scale-[1.02]"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-[#F4F7F5]">
                {filteredVenues.length} planer
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 items-center rounded-full bg-[#2BA84A]/18 px-3 text-[13px] leading-[18px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                  {totalMatchesInRange} matcher
                </span>
                <span className="inline-flex h-7 items-center rounded-full bg-[#F4743B]/18 px-3 text-[13px] leading-[18px] font-medium text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                  {filters.distance}km
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredVenues.map(venue => (
              <VenueCard
                key={venue.id}
                venue={venue}
                matches={venue.upcoming_matches || []}
                isSelected={selectedVenue?.id === venue.id}
                onClick={() => handleVenueClick(venue)}
                onMatchClick={handleMatchClick}
                userMatchIds={userMatchIds}
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
            selectedVenue={selectedVenue}
            userLocation={userLocation}
            onVenueSelect={handleVenueClick}
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
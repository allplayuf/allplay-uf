import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Filter, Search, Navigation, SlidersHorizontal, List, Map as MapIcon, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import {
  getVenues,
  getPublicMatches,
  getMyParticipantMatchIds
} from "../components/supabase/services";

import MapView from "../components/map/MapView";
import VenueCard from "../components/map/VenueCard";
import VenueDetailModal from "../components/map/VenueDetailModal";
import FilterSheet from "../components/map/FilterSheet";

export default function MapPage() {
  const navigate = useNavigate();
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("map");
  const [filters, setFilters] = useState({
    format: "all", date: "all", skillLevel: "all", distance: 50, sortBy: "distance"
  });
  const [userLocation, setUserLocation] = useState({ lat: 59.3293, lng: 18.0686 });
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenueForModal, setSelectedVenueForModal] = useState(null);

  const { user: authUser, isAuthenticated } = useSupabaseAuth();

  // All data from Supabase
  const { data: venues = [] } = useQuery({
    queryKey: ['supabase-venues'],
    queryFn: () => getVenues(),
    ...CACHE_STRATEGIES.STATIC,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['supabase-map-matches'],
    queryFn: async () => {
      const all = await getPublicMatches();
      return all.filter(m => m.status === 'upcoming' || m.status === 'ongoing');
    },
    ...CACHE_STRATEGIES.REALTIME,
  });

  const { data: userMatchIds = [] } = useQuery({
    queryKey: ['supabase-myParticipantMatchIds', authUser?.id],
    queryFn: () => getMyParticipantMatchIds(),
    ...CACHE_STRATEGIES.REALTIME,
    enabled: isAuthenticated && !!authUser?.id,
  });

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || isNaN(v))) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = venues.filter(venue => {
      if (!venue.latitude || !venue.longitude) return false;
      if (searchQuery && !venue.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !venue.address?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.format !== "all" && !venue.formats_supported?.includes(filters.format)) return false;
      const dist = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(venue.latitude), parseFloat(venue.longitude));
      if (dist === Infinity || dist > filters.distance) return false;
      return true;
    });

    filtered = filtered.map(venue => {
      const venueMatches = matches.filter(m => m.venue_id === venue.id && (m.status === 'upcoming' || m.status === 'ongoing'));
      const distance = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(venue.latitude), parseFloat(venue.longitude));
      return { ...venue, upcoming_matches: venueMatches, distance: distance === Infinity ? 999999 : distance };
    });

    filtered.sort((a, b) => {
      if (filters.sortBy === "distance") return a.distance - b.distance;
      if (filters.sortBy === "matches") return (b.upcoming_matches?.length || 0) - (a.upcoming_matches?.length || 0);
      return 0;
    });

    setFilteredVenues(filtered);
  }, [venues, matches, filters, searchQuery, userLocation, calculateDistance]);

  useEffect(() => { getUserLocation(); }, []);
  useEffect(() => { applyFilters(); }, [applyFilters]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (!isNaN(lat) && !isNaN(lng)) setUserLocation({ lat, lng });
        },
        () => setUserLocation({ lat: 59.3293, lng: 18.0686 }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleShowDetails = (venue) => { setSelectedVenueForModal(venue); setShowVenueModal(true); };
  const handleCreateMatchForVenue = (venue) => { navigate(`${createPageUrl("Matches")}?create=true&venue=${venue.id}`); };
  const handleMatchClick = (matchId) => { navigate(`${createPageUrl("MatchDetail")}?id=${matchId}`); };
  const totalMatchesInRange = filteredVenues.reduce((sum, v) => sum + (v.upcoming_matches?.length || 0), 0);

  // Shared map props
  const mapProps = {
    venues: filteredVenues,
    matches,
    allParticipants: [],
    selectedVenue,
    userLocation,
    onVenueSelect: setSelectedVenue,
    onShowDetails: handleShowDetails,
    onMatchClick: handleMatchClick,
    userMatchIds,
  };

  return (
    <div className="min-h-screen bg-[#0F1513]">
      {/* MOBILE */}
      <div className="lg:hidden flex flex-col pb-16" style={{ height: 'calc(100vh - env(safe-area-inset-top))' }}>
        <div className="sticky top-0 z-[100] bg-[#121715]/95 backdrop-blur-xl border-b border-[#223029]/60 p-3 space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          {totalMatchesInRange > 0 && viewMode === 'map' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2BA84A]/10 border border-[#2BA84A]/20">
              <div className="w-2 h-2 rounded-full bg-[#2BA84A] animate-pulse" />
              <span className="text-xs font-semibold text-[#86EFAC]">{totalMatchesInRange} matcher nära dig</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-[#18221E]/80 rounded-full p-1 border border-[#223029]/60">
              {[{ mode: 'list', icon: List, label: 'Lista' }, { mode: 'map', icon: MapIcon, label: 'Karta' }].map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-semibold transition-all ${viewMode === mode ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30' : 'text-[#9EAAA4]'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EAAA4] w-4 h-4" />
              <Input placeholder="Sök planer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-[#18221E]/80 border border-[#223029]/60 text-[#F4F7F5] placeholder:text-[#9EAAA4] rounded-full text-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <FilterSheet filters={filters} onFilterChange={setFilters} />
            <button onClick={getUserLocation} className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-[#2BA84A]/12 border border-[#2BA84A]/25 text-[#2BA84A] rounded-full">
              <Navigation className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="inline-flex h-7 items-center rounded-full bg-[#2BA84A]/12 px-2.5 text-[11px] font-bold text-[#86EFAC] ring-1 ring-[#2BA84A]/20">⚽ {totalMatchesInRange}</span>
              <span className="inline-flex h-7 items-center rounded-full bg-[#18221E] px-2.5 text-[11px] font-medium text-[#9EAAA4] ring-1 ring-[#223029]/60">{filters.distance}km</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === "list" ? (
            <div className="h-full overflow-y-auto p-3 space-y-3">
              {filteredVenues.map(venue => (
                <VenueCard key={venue.id} venue={venue} matches={venue.upcoming_matches || []} isSelected={selectedVenue?.id === venue.id}
                  onClick={() => handleShowDetails(venue)} onMatchClick={handleMatchClick} userMatchIds={userMatchIds} />
              ))}
              {filteredVenues.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-[#248232] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Inga planer hittade</h3>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full relative z-0"><MapView {...mapProps} /></div>
          )}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex h-screen">
        <div className="w-96 bg-[#121715] border-r border-[#223029]/60 flex flex-col z-10">
          <div className="sticky top-0 z-10 bg-[#121715] p-4 border-b border-[#223029]/60 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-[#F4F7F5] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2BA84A]/15 flex items-center justify-center ring-1 ring-[#2BA84A]/25"><MapPin className="w-4 h-4 text-[#2BA84A]" /></div>
                Hitta planer
              </h1>
              <button onClick={getUserLocation} className="h-9 w-9 flex items-center justify-center bg-[#2BA84A]/12 border border-[#2BA84A]/25 text-[#2BA84A] rounded-full">
                <Navigation className="w-4 h-4" />
              </button>
            </div>
            {totalMatchesInRange > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2BA84A]/8 border border-[#2BA84A]/15">
                <div className="w-2 h-2 rounded-full bg-[#2BA84A] animate-pulse" />
                <span className="text-xs font-semibold text-[#86EFAC]">{totalMatchesInRange} matcher nära dig</span>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EAAA4] w-4 h-4" />
              <Input placeholder="Sök planer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-[#18221E]/80 border border-[#223029]/60 text-[#F4F7F5] placeholder:text-[#9EAAA4] rounded-full text-sm" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F7F5]">{filteredVenues.length} planer</span>
              <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/12 px-2.5 font-bold text-[#86EFAC] ring-1 ring-[#2BA84A]/20 text-[11px]">⚽ {totalMatchesInRange}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredVenues.map(venue => (
              <VenueCard key={venue.id} venue={venue} matches={venue.upcoming_matches || []} isSelected={selectedVenue?.id === venue.id}
                onClick={() => handleShowDetails(venue)} onMatchClick={handleMatchClick} userMatchIds={userMatchIds} />
            ))}
            {filteredVenues.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-[#248232] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Inga planer hittade</h3>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 relative z-0"><MapView {...mapProps} /></div>
      </div>

      {showVenueModal && selectedVenueForModal && (
        <VenueDetailModal
          venue={selectedVenueForModal}
          matches={matches.filter(m => m.venue_id === selectedVenueForModal.id && (m.status === 'upcoming' || m.status === 'ongoing'))}
          onClose={() => { setShowVenueModal(false); setSelectedVenueForModal(null); setSelectedVenue(null); }}
          onCreateMatch={handleCreateMatchForVenue}
        />
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, Calendar, Navigation, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Optimize icon creation with memoization
const createCustomIcon = (color = '#2BA84A', isActive = false, status = 'available', hasUserMatch = false) => {
  // Color priority: User's match (blue) > Has matches (orange) > Default (green)
  let iconColor = color;
  
  if (hasUserMatch) {
    iconColor = '#4169E1'; // Royal Blue for user's matches
  } else if (status === 'has_matches') {
    iconColor = '#F4743B'; // Orange for venues with matches
  } else if (status === 'ongoing') {
    iconColor = '#FFD700'; // Gold for ongoing
  }
  
  // Simplified SVG for better mobile performance
  const svgIcon = `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${status}-${hasUserMatch}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M20 2C11.163 2 4 9.163 4 18c0 12 16 28 16 28s16-16 16-28c0-8.837-7.163-16-16-16z" 
            fill="${iconColor}" 
            filter="url(#shadow-${status}-${hasUserMatch})"
            stroke="#FFFFFF" 
            stroke-width="2"/>
      <circle cx="20" cy="18" r="6" fill="#FFFFFF"/>
      ${status === 'ongoing' ? '<circle cx="20" cy="18" r="3" fill="#FFD700"/>' : ''}
      ${hasUserMatch ? '<circle cx="20" cy="18" r="3" fill="#4169E1"/>' : ''}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50]
  });
};

// Component to handle map centering
function MapCenterController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom, {
        animate: true,
        duration: 0.5
      });
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function MapView({ 
  venues = [], 
  matches = [], 
  selectedVenue, 
  userLocation, 
  onVenueSelect,
  onMatchClick,
  userMatchIds = []
}) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // Memoize venue status calculations - NOW WITH USER MATCH CHECK
  const venueStatuses = useMemo(() => {
    const statusMap = {};
    venues.forEach(venue => {
      const venueMatches = matches.filter(m => m.venue_id === venue.id);
      const ongoingMatch = venueMatches.find(m => m.status === 'ongoing');
      const hasUserMatch = venueMatches.some(m => userMatchIds.includes(m.id));
      
      if (ongoingMatch) {
        statusMap[venue.id] = { status: 'ongoing', hasUserMatch };
      } else if (venueMatches.length > 0) { // If there are any matches (upcoming, full, etc.)
        statusMap[venue.id] = { status: 'has_matches', hasUserMatch };
      } else {
        statusMap[venue.id] = { status: 'available', hasUserMatch };
      }
    });
    return statusMap;
  }, [venues, matches, userMatchIds]);

  // Filter out invalid venues
  const validVenues = useMemo(() => {
    return venues.filter(venue => 
      venue.latitude && 
      venue.longitude && 
      !isNaN(venue.latitude) && 
      !isNaN(venue.longitude) &&
      venue.latitude >= -90 && 
      venue.latitude <= 90 &&
      venue.longitude >= -180 && 
      venue.longitude <= 180
    );
  }, [venues]);

  const defaultCenter = useMemo(() => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      return userLocation;
    }
    return { lat: 59.3293, lng: 18.0686 }; // Stockholm fallback
  }, [userLocation]);

  // Simplified marker click handler
  const handleMarkerClick = (venue) => {
    try {
      if (onVenueSelect && typeof onVenueSelect === 'function') {
        onVenueSelect(venue);
      }
    } catch (error) {
      console.error('Error handling marker click:', error);
    }
  };

  // Simplified match click handler
  const handleMatchClick = (matchId, e) => {
    try {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (onMatchClick && typeof onMatchClick === 'function') {
        onMatchClick(matchId);
      }
    } catch (error) {
      console.error('Error handling match click:', error);
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
        touchZoom={true}
        dragging={true}
        tap={true}
        ref={mapRef}
        whenReady={() => setMapReady(true)}
        // Performance optimizations for mobile
        preferCanvas={true}
        updateWhenIdle={true}
        updateWhenZooming={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          // Mobile performance optimizations
          keepBuffer={2}
          updateInterval={200}
        />

        {mapReady && <MapCenterController center={defaultCenter} zoom={selectedVenue ? 15 : 13} />}

        {/* User location marker */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background: #2BA84A;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          />
        )}

        {/* Venue markers - ENHANCED POP-UP */}
        {validVenues.map((venue) => {
          const { status, hasUserMatch } = venueStatuses[venue.id] || { status: 'available', hasUserMatch: false };
          const venueMatches = matches.filter(m => m.venue_id === venue.id && m.status === 'upcoming');
          const isSelected = selectedVenue && selectedVenue.id === venue.id;

          return (
            <Marker
              key={venue.id}
              position={[venue.latitude, venue.longitude]}
              icon={createCustomIcon('#2BA84A', isSelected, status, hasUserMatch)}
              eventHandlers={{
                click: () => handleMarkerClick(venue),
              }}
            >
              <Popup 
                className="custom-popup"
                maxWidth={300}
                minWidth={260}
                closeButton={true}
                autoPan={true}
                autoPanPadding={[50, 50]}
              >
                <div className="p-3">
                  {/* ENHANCED Venue Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-[#F4F7F5] text-base flex-1">
                        {venue.name}
                      </h3>
                      {venue.is_verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#2BA84A]/20 rounded-full flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-[#2BA84A]" />
                          <span className="text-[9px] font-bold text-[#2BA84A]">VERIFIERAD</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-[#B6C2BC] flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {venue.address}, {venue.city}
                    </p>

                    {/* Rating if available */}
                    {venue.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[#F4743B]">★</span>
                        <span className="text-sm font-semibold text-[#F4F7F5]">{venue.rating}</span>
                        <span className="text-xs text-[#7B8A83]">/5</span>
                      </div>
                    )}

                    {/* Facilities */}
                    {venue.facilities && venue.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {venue.facilities.slice(0, 3).map(facility => (
                          <span key={facility} className="text-[9px] bg-[#18221E] text-[#B6C2BC] px-2 py-0.5 rounded-full">
                            {facility === 'changing_rooms' && '🚿 Omklädning'}
                            {facility === 'parking' && '🅿️ Parkering'}
                            {facility === 'lighting' && '💡 Belysning'}
                            {facility === 'artificial_grass' && '🌱 Konstgräs'}
                            {/* Add more facilities here if needed */}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mt-2">
                      {status === 'ongoing' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFD700]/20 text-[#FFD700] rounded-full text-xs font-bold">
                          <span className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse"></span>
                          Match pågår nu!
                        </span>
                      )}
                      {status === 'has_matches' && hasUserMatch && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4169E1]/20 text-[#4169E1] rounded-full text-xs font-bold">
                          <Users className="w-3 h-3" />
                          Du spelar här
                        </span>
                      )}
                      {status === 'has_matches' && !hasUserMatch && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F4743B]/20 text-[#F4743B] rounded-full text-xs font-bold">
                          <Calendar className="w-3 h-3" />
                          {venueMatches.length} match{venueMatches.length === 1 ? '' : 'er'}
                        </span>
                      )}
                      {status === 'available' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2BA84A]/20 text-[#2BA84A] rounded-full text-xs font-bold">
                          <CheckCircle className="w-3 h-3" />
                          Tillgänglig
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ENHANCED Matches List */}
                  {venueMatches.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <p className="text-[10px] font-bold text-[#9FC9AC] uppercase tracking-wide">
                        Kommande matcher
                      </p>
                      {venueMatches.slice(0, 3).map((match) => (
                        <Link
                          key={match.id}
                          to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
                          onClick={(e) => handleMatchClick(match.id, e)}
                          className="block p-2.5 bg-[#18221E] rounded-lg hover:bg-[#223029] transition-all border border-[#223029] hover:border-[#2BA84A]/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#F4F7F5] truncate mb-1">
                                {match.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-[#B6C2BC]">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {match.date}
                                </span>
                                <span>•</span>
                                <span>{match.time}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-bold text-[#9FC9AC] bg-[#2BA84A]/10 px-2 py-0.5 rounded-full">
                                {match.format}
                              </span>
                              <span className="text-[9px] text-[#B6C2BC]">
                                {match.is_spontaneous 
                                  ? `${match.current_players || 0} spelare`
                                  : `${match.current_players || 0}/${match.max_players}`
                                }
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {venueMatches.length > 3 && (
                        <p className="text-[9px] text-[#7B8A83] text-center py-1">
                          +{venueMatches.length - 3} fler matcher
                        </p>
                      )}
                    </div>
                  )}

                  {/* ENHANCED Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkerClick(venue)}
                      className="flex-1 py-2.5 px-3 bg-[#2BA84A] hover:bg-[#248232] text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Visa detaljer
                    </button>
                    {venueMatches.length === 0 && (
                      <Link
                        to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                        className="flex-1 py-2.5 px-3 bg-[#F4743B] hover:bg-[#E5683A] text-white text-xs font-bold rounded-lg transition-all text-center"
                      >
                        Skapa match
                      </Link>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Custom CSS for popup */}
      <style jsx global>{`
        .custom-map-marker {
          background: none;
          border: none;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          background: #121715;
          border: 1px solid #223029;
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: #121715;
          border: 1px solid #223029;
        }
        
        .custom-popup a.leaflet-popup-close-button {
          color: #F4F7F5;
          font-size: 18px;
          padding: 8px 8px 0 0;
        }
        
        .custom-popup a.leaflet-popup-close-button:hover {
          color: #2BA84A;
        }
        
        /* Mobile touch optimization */
        @media (max-width: 768px) {
          .leaflet-container {
            touch-action: pan-x pan-y;
          }
          
          .custom-popup .leaflet-popup-content-wrapper {
            max-width: 90vw;
          }
        }
      `}</style>
    </div>
  );
}

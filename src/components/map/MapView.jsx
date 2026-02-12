import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence } from 'framer-motion';
import MapVenuePreview from './MapVenuePreview';

// Custom AllPlay pin - round green badge with football icon
const createAllPlayIcon = (matchCount = 0, isActive = false, isSelected = false, hasUserMatch = false) => {
  const hasMatches = matchCount > 0;
  const pulseId = `pulse-${Math.random().toString(36).substr(2, 9)}`;
  
  // Color based on state
  let bgGradient, glowColor, ringColor;
  if (hasUserMatch) {
    bgGradient = 'url(#grad-blue)';
    glowColor = 'rgba(65,105,225,0.5)';
    ringColor = '#4169E1';
  } else if (isActive) {
    bgGradient = 'url(#grad-active)';
    glowColor = 'rgba(245,158,11,0.6)';
    ringColor = '#F59E0B';
  } else if (hasMatches) {
    bgGradient = 'url(#grad-match)';
    glowColor = 'rgba(43,168,74,0.6)';
    ringColor = '#2BA84A';
  } else {
    bgGradient = 'url(#grad-default)';
    glowColor = 'rgba(43,168,74,0.3)';
    ringColor = '#2BA84A';
  }

  const size = isSelected ? 56 : 48;
  const half = size / 2;
  const r = isSelected ? 22 : 18;

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-default" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1A3A24;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0F1F15;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad-match" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2BA84A;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1A7A32;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#D97706;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4169E1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2850B8;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      
      ${(hasMatches || isActive) ? `
        <circle cx="${half}" cy="${half}" r="${r + 6}" fill="none" stroke="${ringColor}" stroke-width="2" opacity="0.3">
          <animate attributeName="r" values="${r + 4};${r + 10};${r + 4}" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="${half}" cy="${half}" r="${r + 3}" fill="none" stroke="${ringColor}" stroke-width="1.5" opacity="0.2">
          <animate attributeName="r" values="${r + 2};${r + 7};${r + 2}" dur="2s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" begin="0.3s" />
        </circle>
      ` : ''}
      
      <!-- Main circle -->
      <circle cx="${half}" cy="${half}" r="${r}" fill="${bgGradient}" filter="url(#shadow)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
      
      <!-- Football icon (simplified) -->
      <circle cx="${half}" cy="${half}" r="6" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
      <circle cx="${half}" cy="${half}" r="2.5" fill="white" opacity="0.9"/>
      <line x1="${half}" y1="${half - 6}" x2="${half}" y2="${half - 2.5}" stroke="white" stroke-width="1" opacity="0.7"/>
      <line x1="${half}" y1="${half + 2.5}" x2="${half}" y2="${half + 6}" stroke="white" stroke-width="1" opacity="0.7"/>
      <line x1="${half - 6}" y1="${half}" x2="${half - 2.5}" y2="${half}" stroke="white" stroke-width="1" opacity="0.7"/>
      <line x1="${half + 2.5}" y1="${half}" x2="${half + 6}" y2="${half}" stroke="white" stroke-width="1" opacity="0.7"/>
      
      ${matchCount > 0 ? `
        <!-- Match count badge -->
        <circle cx="${half + r - 4}" cy="${half - r + 4}" r="8" fill="white" stroke="${ringColor}" stroke-width="1.5"/>
        <text x="${half + r - 4}" y="${half - r + 4}" text-anchor="middle" dominant-baseline="central" fill="${hasUserMatch ? '#4169E1' : hasMatches ? '#1A7A32' : '#0F1F15'}" font-size="9" font-weight="800" font-family="system-ui, sans-serif">${matchCount > 9 ? '9+' : matchCount}</text>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'allplay-map-pin',
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half]
  });
};

// User location dot
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <div class="allplay-user-dot">
        <div class="allplay-user-dot-pulse"></div>
        <div class="allplay-user-dot-core"></div>
      </div>
    `,
    className: 'allplay-user-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

function MapCenterController({ center, zoom, selectedVenue }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedVenue && selectedVenue.latitude && selectedVenue.longitude) {
      map.setView([selectedVenue.latitude, selectedVenue.longitude], 16, {
        animate: true,
        duration: 0.8
      });
    } else if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom, {
        animate: true,
        duration: 0.5
      });
    }
  }, [center, zoom, selectedVenue, map]);
  
  return null;
}

export default function MapView({ 
  venues = [], 
  matches = [], 
  allParticipants = [],
  selectedVenue, 
  userLocation, 
  onVenueSelect,
  onShowDetails,
  onMatchClick,
  userMatchIds = []
}) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  const venueStatuses = useMemo(() => {
    const statusMap = {};
    venues.forEach(venue => {
      const venueMatches = matches.filter(m => m.venue_id === venue.id);
      const ongoingMatch = venueMatches.find(m => m.status === 'ongoing');
      const upcomingMatches = venueMatches.filter(m => m.status === 'upcoming');
      const hasUserMatch = venueMatches.some(m => userMatchIds.includes(m.id));
      const matchCount = upcomingMatches.length + (ongoingMatch ? 1 : 0);
      
      statusMap[venue.id] = { 
        isActive: !!ongoingMatch, 
        hasUserMatch, 
        matchCount
      };
    });
    return statusMap;
  }, [venues, matches, userMatchIds]);

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
    return { lat: 59.3293, lng: 18.0686 };
  }, [userLocation]);

  const handleMarkerClick = (venue) => {
    if (onVenueSelect && typeof onVenueSelect === 'function') {
      onVenueSelect(venue);
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Dark gradient overlay for depth */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#0F1513]/10 via-transparent to-[#0F1513]/20" />
      
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
        scrollWheelZoom={true}
        touchZoom={true}
        dragging={true}
        tap={true}
        ref={mapRef}
        whenReady={() => setMapReady(true)}
        preferCanvas={true}
        updateWhenIdle={true}
        updateWhenZooming={false}
      >
        {/* Dark Map Tiles - Carto Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
          keepBuffer={2}
          updateInterval={200}
        />

        {mapReady && <MapCenterController center={defaultCenter} zoom={13} selectedVenue={selectedVenue} />}

        {/* User location marker */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserLocationIcon()}
          />
        )}

        {/* Venue markers */}
        {validVenues.map((venue) => {
          const { isActive, hasUserMatch, matchCount } = venueStatuses[venue.id] || { isActive: false, hasUserMatch: false, matchCount: 0 };
          const isSelected = selectedVenue && selectedVenue.id === venue.id;

          return (
            <Marker
              key={venue.id}
              position={[venue.latitude, venue.longitude]}
              icon={createAllPlayIcon(matchCount, isActive, isSelected, hasUserMatch)}
              eventHandlers={{
                click: () => handleMarkerClick(venue),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Floating Venue Preview Card */}
      <AnimatePresence>
        {selectedVenue && (
          <MapVenuePreview
            key={selectedVenue.id}
            venue={selectedVenue}
            matches={matches.filter(m => m.venue_id === selectedVenue.id)}
            allParticipants={allParticipants}
            userMatchIds={userMatchIds}
            onClose={() => onVenueSelect(null)}
            onShowDetails={(v) => onShowDetails(v)}
            onMatchClick={(id) => onMatchClick(id)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .allplay-map-pin {
          background: none !important;
          border: none !important;
        }
        .allplay-user-marker {
          background: none !important;
          border: none !important;
        }
        .allplay-user-dot {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .allplay-user-dot-core {
          width: 14px;
          height: 14px;
          background: #2BA84A;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(43,168,74,0.4);
          position: relative;
          z-index: 2;
        }
        .allplay-user-dot-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background: rgba(43,168,74,0.25);
          border-radius: 50%;
          animation: userPulse 2s ease-in-out infinite;
          z-index: 1;
        }
        @keyframes userPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.15; }
        }
        
        /* Override Leaflet zoom control */
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }
        .leaflet-control-zoom a {
          background: #121715 !important;
          color: #F4F7F5 !important;
          border: 1px solid #223029 !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #18221E !important;
          color: #2BA84A !important;
        }
        
        /* Hide default attribution styling */
        .leaflet-control-attribution {
          background: rgba(18,23,21,0.7) !important;
          color: #7B8A83 !important;
          font-size: 10px !important;
          border-radius: 6px 0 0 0 !important;
        }
        .leaflet-control-attribution a {
          color: #2BA84A !important;
        }
      `}</style>
    </div>
  );
}
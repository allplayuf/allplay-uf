import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence } from 'framer-motion';
import MapVenuePreview from './MapVenuePreview';

// Optimize icon creation with memoization
const createCustomIcon = (color = '#2BA84A', isActive = false, status = 'available', hasUserMatch = false) => {
  let iconColor = color;
  
  if (hasUserMatch) {
    iconColor = '#4169E1';
  } else if (status === 'has_matches') {
    iconColor = '#F4743B';
  } else if (status === 'ongoing') {
    iconColor = '#FFD700';
  }
  
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

function MapCenterController({ center, zoom, selectedVenue }) {
  const map = useMap();
  
  useEffect(() => {
    // If a venue is selected, focus on that venue instead of user location
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
      const hasUserMatch = venueMatches.some(m => userMatchIds.includes(m.id));
      
      if (ongoingMatch) {
        statusMap[venue.id] = { status: 'ongoing', hasUserMatch, matchCount: venueMatches.length };
      } else if (venueMatches.length > 0) {
        statusMap[venue.id] = { status: 'has_matches', hasUserMatch, matchCount: venueMatches.length };
      } else {
        statusMap[venue.id] = { status: 'available', hasUserMatch, matchCount: 0 };
      }
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
    try {
      if (onVenueSelect && typeof onVenueSelect === 'function') {
        onVenueSelect(venue);
      }
    } catch (error) {
      console.error('Error handling marker click:', error);
    }
  };

  const handleShowDetailsClick = (venue, e) => {
    try {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (onShowDetails && typeof onShowDetails === 'function') {
        onShowDetails(venue);
      }
    } catch (error) {
      console.error('Error handling show details click:', error);
    }
  };

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
        preferCanvas={true}
        updateWhenIdle={true}
        updateWhenZooming={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          keepBuffer={2}
          updateInterval={200}
        />

        {mapReady && <MapCenterController center={defaultCenter} zoom={13} selectedVenue={selectedVenue} />}

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

        {/* Venue markers */}
        {validVenues.map((venue) => {
          const { status, hasUserMatch } = venueStatuses[venue.id] || { status: 'available', hasUserMatch: false };
          const isSelected = selectedVenue && selectedVenue.id === venue.id;

          return (
            <Marker
              key={venue.id}
              position={[venue.latitude, venue.longitude]}
              icon={createCustomIcon('#2BA84A', isSelected, status, hasUserMatch)}
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
            userMatchIds={userMatchIds}
            onClose={() => onVenueSelect(null)}
            onShowDetails={(v) => onShowDetails(v)}
            onMatchClick={(id) => onMatchClick(id)}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-map-marker {
          background: none;
          border: none;
        }
      `}</style>
    </div>
  );
}
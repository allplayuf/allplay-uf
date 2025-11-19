import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, Calendar, CheckCircle, Lightbulb, ParkingCircle, ShowerHead } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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

        {/* Venue markers - POPUP ONLY */}
        {validVenues.map((venue) => {
          const { status, hasUserMatch, matchCount } = venueStatuses[venue.id] || { status: 'available', hasUserMatch: false, matchCount: 0 };
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
                className="venue-popup"
                maxWidth={420}
                minWidth={360}
                closeButton={true}
                autoPan={true}
                autoPanPadding={[80, 80]}
              >
                <div className="venue-popup-content">
                  {/* Venue Name */}
                  <div className="venue-title-section">
                    <h3 className="venue-name">{venue.name}</h3>
                    {venue.is_verified && (
                      <div className="verified-badge">
                        <svg className="verified-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="venue-address">
                    <svg className="address-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    <span>{venue.address}, {venue.city}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="status-section">
                    {status === 'ongoing' && (
                      <div className="status-badge status-ongoing">
                        <span className="status-pulse"></span>
                        Match pågår nu
                      </div>
                    )}
                    {status === 'has_matches' && hasUserMatch && (
                      <div className="status-badge status-user-match">
                        <svg className="status-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                        </svg>
                        Du spelar här
                      </div>
                    )}
                    {status === 'has_matches' && !hasUserMatch && matchCount > 0 && (
                      <div className="status-badge status-has-matches">
                        <svg className="status-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                        </svg>
                        {matchCount} match{matchCount === 1 ? '' : 'er'}
                      </div>
                    )}
                    {status === 'available' && (
                      <div className="status-badge status-available">
                        <svg className="status-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                        </svg>
                        Tillgänglig
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      onClick={(e) => handleShowDetailsClick(venue, e)}
                      className="btn-info"
                    >
                      Visa info
                    </button>
                    <Link
                      to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                      className="btn-create-match"
                    >
                      Skapa match
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Enhanced CSS for popup */}
      <style jsx global>{`
        .custom-map-marker {
          background: none;
          border: none;
        }
        
        .venue-popup .leaflet-popup-content-wrapper {
          background: #121715;
          border: 1px solid #223029;
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        
        .venue-popup .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        
        .venue-popup .leaflet-popup-tip {
          background: #121715;
          border: 1px solid #223029;
        }
        
        .venue-popup a.leaflet-popup-close-button {
          color: #7B8A83;
          font-size: 28px;
          padding: 12px 16px;
          font-weight: 300;
          z-index: 10;
          transition: all 0.2s;
        }
        
        .venue-popup a.leaflet-popup-close-button:hover {
          color: #F4F7F5;
          transform: rotate(90deg);
        }
        
        .venue-popup-content {
          padding: 24px;
        }
        
        .venue-title-section {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        
        .venue-name {
          font-size: 22px;
          font-weight: 800;
          color: #F4F7F5;
          line-height: 1.2;
          flex: 1;
          letter-spacing: -0.03em;
        }
        
        .verified-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #2BA84A 0%, #248232 100%);
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(43, 168, 74, 0.4);
        }
        
        .verified-icon {
          width: 14px;
          height: 14px;
          color: #FFFFFF;
        }
        
        .venue-address {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
          padding: 0;
          background: transparent;
          border: none;
        }
        
        .address-icon {
          width: 18px;
          height: 18px;
          color: #7B8A83;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .venue-address span {
          font-size: 14px;
          color: #B6C2BC;
          line-height: 1.6;
          font-weight: 500;
        }
        
        .status-section {
          margin-bottom: 24px;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }
        
        .status-icon {
          width: 15px;
          height: 15px;
        }
        
        .status-ongoing {
          background: rgba(251, 191, 36, 0.15);
          color: #FDE68A;
          border-color: rgba(251, 191, 36, 0.4);
        }
        
        .status-pulse {
          width: 8px;
          height: 8px;
          background: #FCD34D;
          border-radius: 50%;
          animation: pulse 2s infinite;
          box-shadow: 0 0 10px rgba(252, 211, 77, 0.8);
        }
        
        .status-user-match {
          background: rgba(65, 105, 225, 0.15);
          color: #B0C4DE;
          border-color: rgba(65, 105, 225, 0.4);
        }
        
        .status-has-matches {
          background: rgba(244, 116, 59, 0.15);
          color: #FDE3D2;
          border-color: rgba(244, 116, 59, 0.4);
        }
        
        .status-available {
          background: rgba(43, 168, 74, 0.15);
          color: #CFE8D6;
          border-color: rgba(43, 168, 74, 0.4);
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.9);
          }
        }
        
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 0;
        }
        
        .btn-info {
          width: 100%;
          padding: 16px 24px;
          background: transparent;
          color: #F4F7F5;
          border: 1.5px solid #223029;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        
        .btn-info:hover {
          background: rgba(43, 168, 74, 0.08);
          border-color: #2BA84A;
          transform: translateY(-1px);
          color: #CFE8D6;
        }
        
        .btn-info:active {
          transform: translateY(0);
        }
        
        .btn-create-match {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #2BA84A 0%, #248232 100%);
          color: #FFFFFF;
          border: 1.5px solid transparent;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(43, 168, 74, 0.35);
        }
        
        .btn-create-match:hover {
          background: linear-gradient(135deg, #248232 0%, #1F6B29 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(43, 168, 74, 0.45);
        }
        
        .btn-create-match:active {
          transform: translateY(0);
        }
        
        @media (max-width: 768px) {
          .leaflet-container {
            touch-action: pan-x pan-y;
          }
          
          .venue-popup .leaflet-popup-content-wrapper {
            max-width: 90vw;
            border-radius: 16px;
          }
          
          .venue-popup-content {
            padding: 20px;
          }
          
          .venue-name {
            font-size: 19px;
          }
          
          .venue-address span {
            font-size: 13px;
          }
          
          .status-badge {
            font-size: 13px;
            padding: 9px 14px;
          }
          
          .btn-info,
          .btn-create-match {
            padding: 14px 20px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
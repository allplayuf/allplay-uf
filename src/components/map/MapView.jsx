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

  const venueStatuses = useMemo(() => {
    const statusMap = {};
    venues.forEach(venue => {
      const venueMatches = matches.filter(m => m.venue_id === venue.id);
      const ongoingMatch = venueMatches.find(m => m.status === 'ongoing');
      const hasUserMatch = venueMatches.some(m => userMatchIds.includes(m.id));
      
      if (ongoingMatch) {
        statusMap[venue.id] = { status: 'ongoing', hasUserMatch };
      } else if (venueMatches.length > 0) {
        statusMap[venue.id] = { status: 'has_matches', hasUserMatch };
      } else {
        statusMap[venue.id] = { status: 'available', hasUserMatch };
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
                className="venue-popup"
                maxWidth={320}
                minWidth={280}
                closeButton={true}
                autoPan={true}
                autoPanPadding={[50, 50]}
              >
                <div className="venue-popup-content">
                  {/* Header */}
                  <div className="venue-header">
                    <div className="venue-title-row">
                      <h3 className="venue-name">{venue.name}</h3>
                      {venue.is_verified && (
                        <div className="verified-badge">
                          <svg className="verified-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                          </svg>
                          <span>VERIFIERAD</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="venue-address">
                      <svg className="address-icon" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                      </svg>
                      <span>{venue.address}, {venue.city}</span>
                    </div>

                    {/* Facilities with icons */}
                    {venue.facilities && venue.facilities.length > 0 && (
                      <div className="facilities">
                        {venue.facilities.includes('lighting') && (
                          <div className="facility-item">
                            💡 <span>Belysning</span>
                          </div>
                        )}
                        {venue.facilities.includes('parking') && (
                          <div className="facility-item">
                            🅿️ <span>Parkering</span>
                          </div>
                        )}
                        {(venue.facilities.includes('changing_rooms') || venue.facilities.includes('showers')) && (
                          <div className="facility-item">
                            🚿 <span>Omklädningsrum</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="status-badge-container">
                      {status === 'ongoing' && (
                        <div className="status-badge status-ongoing">
                          <span className="status-pulse"></span>
                          Match pågår nu!
                        </div>
                      )}
                      {status === 'has_matches' && hasUserMatch && (
                        <div className="status-badge status-user-match">
                          <svg className="status-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                            <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
                            <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                          </svg>
                          Du spelar här
                        </div>
                      )}
                      {status === 'has_matches' && !hasUserMatch && (
                        <div className="status-badge status-has-matches">
                          <svg className="status-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                          </svg>
                          {venueMatches.length} match{venueMatches.length === 1 ? '' : 'er'}
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
                  </div>

                  {/* Action Buttons - MATCHING DESIGN FROM IMAGE */}
                  <div className="action-buttons">
                    <button
                      onClick={() => handleMarkerClick(venue)}
                      className="btn-details"
                    >
                      Visa detaljer
                    </button>
                    <Link
                      to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                      className="btn-create"
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

      {/* Enhanced CSS for popup matching the design */}
      <style jsx global>{`
        .custom-map-marker {
          background: none;
          border: none;
        }
        
        /* Popup container */
        .venue-popup .leaflet-popup-content-wrapper {
          background: #1a1f1e;
          border: none;
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          overflow: hidden;
        }
        
        .venue-popup .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        
        .venue-popup .leaflet-popup-tip {
          background: #1a1f1e;
        }
        
        .venue-popup a.leaflet-popup-close-button {
          color: #9CA3AF;
          font-size: 24px;
          padding: 12px 16px;
          font-weight: 300;
          z-index: 10;
        }
        
        .venue-popup a.leaflet-popup-close-button:hover {
          color: #FFFFFF;
        }
        
        /* Content */
        .venue-popup-content {
          padding: 20px;
          padding-top: 16px;
        }
        
        /* Header */
        .venue-header {
          margin-bottom: 16px;
        }
        
        .venue-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .venue-name {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.3;
          flex: 1;
        }
        
        .verified-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          flex-shrink: 0;
        }
        
        .verified-icon {
          width: 12px;
          height: 12px;
          color: #22C55E;
        }
        
        .verified-badge span {
          font-size: 9px;
          font-weight: 700;
          color: #22C55E;
          letter-spacing: 0.5px;
        }
        
        .venue-address {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }
        
        .address-icon {
          width: 14px;
          height: 14px;
          color: #9CA3AF;
          flex-shrink: 0;
        }
        
        .venue-address span {
          font-size: 13px;
          color: #9CA3AF;
          line-height: 1.4;
        }
        
        /* Facilities */
        .facilities {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .facility-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 12px;
          color: #D1D5DB;
        }
        
        /* Status Badge */
        .status-badge-container {
          margin-top: 12px;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .status-icon {
          width: 14px;
          height: 14px;
        }
        
        .status-ongoing {
          background: rgba(251, 191, 36, 0.15);
          color: #FCD34D;
        }
        
        .status-pulse {
          width: 8px;
          height: 8px;
          background: #FCD34D;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .status-user-match {
          background: rgba(59, 130, 246, 0.15);
          color: #93C5FD;
        }
        
        .status-has-matches {
          background: rgba(249, 115, 22, 0.15);
          color: #FB923C;
        }
        
        .status-available {
          background: rgba(34, 197, 94, 0.15);
          color: #86EFAC;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        /* Action Buttons - MATCHING DESIGN */
        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }
        
        .btn-details {
          padding: 12px 16px;
          background: #2BA84A;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        
        .btn-details:hover {
          background: #248232;
          transform: translateY(-1px);
        }
        
        .btn-details:active {
          transform: translateY(0);
        }
        
        .btn-create {
          padding: 12px 16px;
          background: #F4743B;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-create:hover {
          background: #E5683A;
          transform: translateY(-1px);
        }
        
        .btn-create:active {
          transform: translateY(0);
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .leaflet-container {
            touch-action: pan-x pan-y;
          }
          
          .venue-popup .leaflet-popup-content-wrapper {
            max-width: 90vw;
            border-radius: 16px;
          }
          
          .venue-popup-content {
            padding: 16px;
          }
          
          .venue-name {
            font-size: 18px;
          }
          
          .action-buttons {
            gap: 8px;
          }
          
          .btn-details,
          .btn-create {
            padding: 10px 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
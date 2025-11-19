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
                maxWidth={400}
                minWidth={340}
                closeButton={true}
                autoPan={true}
                autoPanPadding={[80, 80]}
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
                          Du spelar här · {matchCount} match{matchCount === 1 ? '' : 'er'}
                        </div>
                      )}
                      {status === 'has_matches' && !hasUserMatch && (
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
                  </div>

                  {/* Matches List */}
                  {venue.upcoming_matches && venue.upcoming_matches.length > 0 && (
                    <div className="matches-list">
                      <div className="matches-header">
                        <svg className="matches-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                        </svg>
                        <span>{venue.upcoming_matches.length} kommande match{venue.upcoming_matches.length === 1 ? '' : 'er'}</span>
                      </div>
                      {venue.upcoming_matches.slice(0, 2).map(match => (
                        <button
                          key={match.id}
                          onClick={(e) => handleMatchClick(match.id, e)}
                          className="match-item"
                        >
                          <div className="match-info">
                            <div className="match-title">{match.title}</div>
                            <div className="match-meta">
                              <span>{match.date}</span>
                              <span>•</span>
                              <span>{match.time}</span>
                            </div>
                          </div>
                          <div className="match-players">
                            <svg className="players-icon" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                            </svg>
                            {match.is_spontaneous 
                              ? match.current_players || 0
                              : `${match.current_players || 0}/${match.max_players}`
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      onClick={(e) => handleShowDetailsClick(venue, e)}
                      className="btn-details"
                    >
                      <svg className="btn-icon" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                      </svg>
                      Visa all info
                    </button>
                    <Link
                      to={`${createPageUrl("Matches")}?create=true&venue=${venue.id}`}
                      className="btn-create"
                    >
                      <svg className="btn-icon-create" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                      </svg>
                      Skapa match här
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
          background: linear-gradient(145deg, #1A211E 0%, #121715 100%);
          border: 1.5px solid rgba(43, 168, 74, 0.25);
          border-radius: 20px;
          padding: 0;
          box-shadow: 
            0 24px 80px rgba(0,0,0,0.8),
            0 0 0 1px rgba(43, 168, 74, 0.1) inset;
          overflow: hidden;
        }
        
        .venue-popup .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        
        .venue-popup .leaflet-popup-tip {
          background: linear-gradient(145deg, #1F2421 0%, #161A18 100%);
          border: 1px solid rgba(43, 168, 74, 0.15);
        }
        
        .venue-popup a.leaflet-popup-close-button {
          color: #6B7280;
          font-size: 26px;
          padding: 14px 18px;
          font-weight: 300;
          z-index: 10;
          transition: all 0.2s;
        }
        
        .venue-popup a.leaflet-popup-close-button:hover {
          color: #FFFFFF;
          transform: rotate(90deg);
        }
        
        .venue-popup-content {
          padding: 20px;
          max-width: 400px;
        }
        
        .venue-header {
          margin-bottom: 20px;
        }
        
        .venue-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        
        .venue-name {
          font-size: 20px;
          font-weight: 800;
          color: #F4F7F5;
          line-height: 1.3;
          flex: 1;
          letter-spacing: -0.02em;
        }
        
        .verified-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.15));
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 14px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
        }
        
        .verified-icon {
          width: 13px;
          height: 13px;
          color: #22C55E;
        }
        
        .verified-badge span {
          font-size: 9px;
          font-weight: 800;
          color: #4ADE80;
          letter-spacing: 0.5px;
        }
        
        .venue-address {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: rgba(43, 168, 74, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(43, 168, 74, 0.15);
        }
        
        .address-icon {
          width: 16px;
          height: 16px;
          color: #2BA84A;
          flex-shrink: 0;
          margin-top: 1px;
        }
        
        .venue-address span {
          font-size: 13px;
          color: #E5E7EB;
          line-height: 1.5;
          font-weight: 500;
        }
        
        .facilities {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        
        .facility-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          background: rgba(24, 34, 30, 0.8);
          border: 1px solid rgba(43, 168, 74, 0.2);
          border-radius: 10px;
          font-size: 12px;
          color: #CFE8D6;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .facility-item:hover {
          background: rgba(43, 168, 74, 0.15);
          border-color: rgba(43, 168, 74, 0.35);
          transform: translateY(-1px);
        }
        
        .status-badge-container {
          margin-bottom: 16px;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          border: 1px solid;
        }
        
        .status-icon {
          width: 15px;
          height: 15px;
        }
        
        .status-ongoing {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.20), rgba(251, 191, 36, 0.10));
          color: #FCD34D;
          border-color: rgba(251, 191, 36, 0.3);
        }
        
        .status-pulse {
          width: 9px;
          height: 9px;
          background: #FCD34D;
          border-radius: 50%;
          animation: pulse 2s infinite;
          box-shadow: 0 0 8px rgba(252, 211, 77, 0.6);
        }
        
        .status-user-match {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.20), rgba(59, 130, 246, 0.10));
          color: #93C5FD;
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .status-has-matches {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.20), rgba(249, 115, 22, 0.10));
          color: #FB923C;
          border-color: rgba(249, 115, 22, 0.3);
        }
        
        .status-available {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.20), rgba(34, 197, 94, 0.10));
          color: #86EFAC;
          border-color: rgba(34, 197, 94, 0.3);
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
        
        .matches-list {
          margin-bottom: 18px;
          padding: 14px;
          background: rgba(15, 21, 19, 0.6);
          border: 1px solid rgba(43, 168, 74, 0.15);
          border-radius: 14px;
        }
        
        .matches-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 13px;
          font-weight: 700;
          color: #CFE8D6;
        }
        
        .matches-icon {
          width: 16px;
          height: 16px;
          color: #2BA84A;
        }
        
        .match-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: rgba(24, 34, 30, 0.6);
          border: 1px solid rgba(43, 168, 74, 0.15);
          border-radius: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        
        .match-item:last-child {
          margin-bottom: 0;
        }
        
        .match-item:hover {
          background: rgba(43, 168, 74, 0.12);
          border-color: rgba(43, 168, 74, 0.35);
          transform: translateX(3px);
        }
        
        .match-info {
          flex: 1;
          min-width: 0;
        }
        
        .match-title {
          font-size: 13px;
          font-weight: 700;
          color: #F4F7F5;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .match-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #9FC9AC;
          font-weight: 500;
        }
        
        .match-players {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(43, 168, 74, 0.15);
          border: 1px solid rgba(43, 168, 74, 0.25);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #CFE8D6;
          flex-shrink: 0;
        }
        
        .players-icon {
          width: 14px;
          height: 14px;
          color: #2BA84A;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        
        .btn-details {
          position: relative;
          flex: 1;
          padding: 14px 20px;
          background: linear-gradient(135deg, rgba(43, 168, 74, 0.15) 0%, rgba(36, 130, 50, 0.12) 100%);
          color: #CFE8D6;
          border: 1.5px solid rgba(43, 168, 74, 0.35);
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          overflow: hidden;
        }
        
        .btn-details:hover {
          background: linear-gradient(135deg, rgba(43, 168, 74, 0.25) 0%, rgba(36, 130, 50, 0.20) 100%);
          border-color: rgba(43, 168, 74, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(43, 168, 74, 0.3);
          color: #EAF6EE;
        }
        
        .btn-details:active {
          transform: translateY(0);
        }
        
        .btn-icon {
          width: 16px;
          height: 16px;
          transition: transform 0.25s;
        }
        
        .btn-details:hover .btn-icon {
          transform: scale(1.1);
        }
        
        .btn-create {
          position: relative;
          flex: 1;
          padding: 14px 20px;
          background: linear-gradient(135deg, #F4743B 0%, #E5683A 100%);
          color: #FFFFFF;
          border: 1.5px solid rgba(244, 116, 59, 0.5);
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(244, 116, 59, 0.4);
          overflow: hidden;
        }
        
        .btn-create::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s;
        }
        
        .btn-create:hover::before {
          left: 100%;
        }
        
        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(244, 116, 59, 0.55);
          border-color: rgba(244, 116, 59, 0.7);
        }
        
        .btn-create:active {
          transform: translateY(0);
        }
        
        .btn-icon-create {
          width: 18px;
          height: 18px;
          transition: transform 0.25s;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }
        
        .btn-create:hover .btn-icon-create {
          transform: rotate(90deg);
        }
        
        @media (max-width: 768px) {
          .leaflet-container {
            touch-action: pan-x pan-y;
          }
          
          .venue-popup .leaflet-popup-content-wrapper {
            max-width: 95vw;
            border-radius: 18px;
          }
          
          .venue-popup-content {
            padding: 18px;
          }
          
          .venue-name {
            font-size: 18px;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 8px;
          }
          
          .btn-details,
          .btn-create {
            padding: 13px 16px;
            font-size: 13px;
            border-radius: 12px;
          }
          
          .btn-icon,
          .btn-icon-create {
            width: 15px;
            height: 15px;
          }
          
          .match-item {
            padding: 10px;
          }
          
          .match-title {
            font-size: 12px;
          }
          
          .match-meta {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
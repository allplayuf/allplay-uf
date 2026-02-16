import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence } from 'framer-motion';
import MapVenuePreview from './MapVenuePreview';

/* ─── STATUS HELPERS ─── */
function getMatchStatus(match) {
  if (match.status === 'ongoing') return 'live';
  const now = new Date();
  const matchTime = new Date(`${match.date}T${match.time}`);
  const diffH = (matchTime - now) / 3600000;
  const isFull = !match.is_spontaneous && match.max_players && match.current_players >= match.max_players;
  if (isFull) return 'full';
  if (diffH <= 3 && diffH > 0) return 'soon';
  return 'later';
}

const STATUS_RING = {
  live:  { color: '#F59E0B', pulse: true  },
  soon:  { color: '#2BA84A', pulse: false },
  later: { color: '#4169E1', pulse: false },
  full:  { color: '#9EAAA4', pulse: false },
};

/* ─── VENUE PIN (drop-shape, green — no active matches) ─── */
function createVenuePin(isSelected) {
  const s = isSelected ? 36 : 28;
  const w = s + 4; // extra space for shadow filter
  const h = s + 14;
  const cx = w / 2;
  const bodyR = s / 2 - 2;
  const cy = bodyR + 4;
  const fillColor = '#0F2917';
  const strokeColor = '#2BA84A';
  const shadowOp = isSelected ? 0.5 : 0.3;

  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="vs${s}"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="${shadowOp}"/></filter></defs>
    <g filter="url(#vs${s})">
      <path d="M${cx},${h - 3} L${cx - 5},${cy + bodyR - 2} Q${cx},${cy + bodyR + 3} ${cx + 5},${cy + bodyR - 2} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.2"/>
      <circle cx="${cx}" cy="${cy}" r="${bodyR}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isSelected ? 2 : 1.5}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="none" stroke="${strokeColor}" stroke-width="1.2" opacity="0.8"/>
    <circle cx="${cx}" cy="${cy}" r="1.8" fill="${strokeColor}" opacity="0.8"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'allplay-venue-puck',
    iconSize: [w, h],
    iconAnchor: [cx, h - 2],
    popupAnchor: [0, -(h - 2)],
  });
}

/* ─── MATCH PIN (drop shape — orange for match, blue if user joined) ─── */
function createMatchPin(matchCount, status, isSelected, hasUserMatch) {
  const s = isSelected ? 42 : 34;
  const w = s + 6; // extra space for shadow + pulse
  const h = s + 16;
  const cx = w / 2;
  const bodyR = s / 2 - 3;
  const cy = bodyR + 4;

  // Color scheme: blue = user joined, orange = has match
  const ringColor = hasUserMatch ? '#4169E1' : '#F4743B';
  const bodyFill = hasUserMatch ? '#142244' : '#2A1208';
  const iconColor = hasUserMatch ? '#93B4F5' : '#FDE3D2';
  const cfg = STATUS_RING[status] || STATUS_RING.later;
  const shadowOp = isSelected ? 0.55 : 0.35;

  const pulse = (cfg.pulse || status === 'live') ? `
    <circle cx="${cx}" cy="${cy}" r="${bodyR + 6}" fill="none" stroke="${ringColor}" stroke-width="1.5" opacity="0.4">
      <animate attributeName="r" values="${bodyR + 4};${bodyR + 10};${bodyR + 4}" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite"/>
    </circle>` : '';

  const badge = matchCount > 1 ? `
    <circle cx="${cx + bodyR - 1}" cy="${cy - bodyR + 1}" r="7" fill="white" stroke="${ringColor}" stroke-width="1.2"/>
    <text x="${cx + bodyR - 1}" y="${cy - bodyR + 1}" text-anchor="middle" dominant-baseline="central"
      fill="${hasUserMatch ? '#142244' : '#2A1208'}" font-size="8" font-weight="800" font-family="system-ui">${matchCount > 9 ? '9+' : matchCount}</text>` : '';

  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="ms${s}"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="${shadowOp}"/></filter></defs>
    ${pulse}
    <g filter="url(#ms${s})">
      <path d="M${cx},${h - 3} L${cx - 5},${cy + bodyR - 3} Q${cx},${cy + bodyR + 3} ${cx + 5},${cy + bodyR - 3} Z" fill="${bodyFill}" stroke="${ringColor}" stroke-width="1.2"/>
      <circle cx="${cx}" cy="${cy}" r="${bodyR}" fill="${bodyFill}" stroke="${ringColor}" stroke-width="${isSelected ? 2.5 : 2}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${iconColor}" stroke-width="1.2" opacity="0.85"/>
    <circle cx="${cx}" cy="${cy}" r="1.8" fill="${iconColor}" opacity="0.85"/>
    <line x1="${cx}" y1="${cy - 5}" x2="${cx}" y2="${cy - 1.8}" stroke="${iconColor}" stroke-width="0.8" opacity="0.6"/>
    <line x1="${cx}" y1="${cy + 1.8}" x2="${cx}" y2="${cy + 5}" stroke="${iconColor}" stroke-width="0.8" opacity="0.6"/>
    <line x1="${cx - 5}" y1="${cy}" x2="${cx - 1.8}" y2="${cy}" stroke="${iconColor}" stroke-width="0.8" opacity="0.6"/>
    <line x1="${cx + 1.8}" y1="${cy}" x2="${cx + 5}" y2="${cy}" stroke="${iconColor}" stroke-width="0.8" opacity="0.6"/>
    ${badge}
  </svg>`;

  return L.divIcon({
    html: svg,
    className: 'allplay-match-pin',
    iconSize: [w, h],
    iconAnchor: [cx, h - 2],
    popupAnchor: [0, -(h - 2)],
  });
}

/* ─── SELECTED TOOLTIP ─── */
function createSelectedTooltip(match, spotsLeft) {
  const timeStr = match.time || '';
  const spotsText = match.is_spontaneous ? 'Spontan' : (spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} platser kvar` : 'Full');
  const html = `<div style="
    background:#121715;border:1px solid #223029;border-radius:10px;padding:5px 10px;
    font-family:system-ui;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.5);
    display:flex;align-items:center;gap:6px;pointer-events:none;
  ">
    <span style="color:#2BA84A;font-weight:700;font-size:11px;">${timeStr}</span>
    <span style="color:#9EAAA4;font-size:10px;">·</span>
    <span style="color:#B6C2BC;font-size:10px;font-weight:600;">${spotsText}</span>
  </div>`;
  return html;
}

/* ─── CLUSTER ICON ─── */
function createClusterIcon(count) {
  const s = 40;
  const r = s / 2;
  const svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="cs"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/></filter></defs>
    <circle cx="${r}" cy="${r}" r="${r - 3}" fill="#18221E" stroke="#2BA84A" stroke-width="2" filter="url(#cs)"/>
    <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central" fill="#2BA84A" font-size="13" font-weight="800" font-family="system-ui">${count}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'allplay-cluster',
    iconSize: [s, s],
    iconAnchor: [r, r],
  });
}

/* ─── USER LOCATION DOT ─── */
function createUserLocationIcon() {
  return L.divIcon({
    html: `<div class="allplay-user-dot">
      <div class="allplay-user-dot-pulse"></div>
      <div class="allplay-user-dot-core"></div>
    </div>`,
    className: 'allplay-user-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

/* ─── MAP CENTER CONTROLLER ─── */
function MapCenterController({ center, zoom, selectedVenue }) {
  const map = useMap();
  useEffect(() => {
    if (selectedVenue?.latitude && selectedVenue?.longitude) {
      map.setView([selectedVenue.latitude, selectedVenue.longitude], 16, { animate: true, duration: 0.8 });
    } else if (center?.lat && center?.lng) {
      map.setView([center.lat, center.lng], zoom, { animate: true, duration: 0.5 });
    }
  }, [center, zoom, selectedVenue, map]);
  return null;
}

/* ─── CLUSTERING LAYER ─── */
function ClusteredMarkers({ venues, venueStatuses, selectedVenue, onMarkerClick, matches }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const group = L.layerGroup();

    if (zoom >= 14) {
      // No clustering at close zoom — render individually
      venues.forEach(venue => {
        const st = venueStatuses[venue.id] || { isActive: false, hasUserMatch: false, matchCount: 0 };
        const isSelected = selectedVenue?.id === venue.id;
        const hasMatches = st.matchCount > 0;

        let icon;
        if (hasMatches) {
          const venueMatches = matches.filter(m => m.venue_id === venue.id && (m.status === 'upcoming' || m.status === 'ongoing'));
          const bestMatch = venueMatches[0];
          const status = bestMatch ? getMatchStatus(bestMatch) : 'later';
          icon = createMatchPin(st.matchCount, status, isSelected, st.hasUserMatch);
        } else {
          icon = createVenuePin(isSelected);
        }

        const marker = L.marker([venue.latitude, venue.longitude], { icon });
        marker.on('click', () => onMarkerClick(venue));

        // Selected tooltip
        if (isSelected && hasMatches) {
          const venueMatches = matches.filter(m => m.venue_id === venue.id && (m.status === 'upcoming' || m.status === 'ongoing'));
          const bestMatch = venueMatches[0];
          if (bestMatch) {
            const spotsLeft = bestMatch.is_spontaneous ? null : (bestMatch.max_players - (bestMatch.current_players || 0));
            marker.bindTooltip(createSelectedTooltip(bestMatch, spotsLeft), {
              permanent: true, direction: 'top', offset: [0, -10], className: 'allplay-tooltip',
            });
          }
        }

        group.addLayer(marker);
      });
    } else {
      // Cluster nearby venues using a simple grid
      const gridSize = zoom <= 10 ? 0.05 : zoom <= 12 ? 0.02 : 0.01;
      const clusters = {};

      venues.forEach(venue => {
        const gx = Math.floor(venue.latitude / gridSize);
        const gy = Math.floor(venue.longitude / gridSize);
        const key = `${gx}_${gy}`;
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(venue);
      });

      Object.values(clusters).forEach(clusterVenues => {
        if (clusterVenues.length === 1) {
          const venue = clusterVenues[0];
          const st = venueStatuses[venue.id] || { matchCount: 0 };
          const hasMatches = st.matchCount > 0;
          const icon = hasMatches
            ? createMatchPin(st.matchCount, 'later', false, st.hasUserMatch)
            : createVenuePin(false);
          const marker = L.marker([venue.latitude, venue.longitude], { icon });
          marker.on('click', () => onMarkerClick(venue));
          group.addLayer(marker);
        } else {
          const avgLat = clusterVenues.reduce((s, v) => s + v.latitude, 0) / clusterVenues.length;
          const avgLng = clusterVenues.reduce((s, v) => s + v.longitude, 0) / clusterVenues.length;
          const totalMatches = clusterVenues.reduce((s, v) => s + (venueStatuses[v.id]?.matchCount || 0), 0);
          const icon = createClusterIcon(clusterVenues.length);
          const marker = L.marker([avgLat, avgLng], { icon });
          marker.on('click', () => {
            map.setView([avgLat, avgLng], zoom + 2, { animate: true });
          });
          group.addLayer(marker);
        }
      });
    }

    group.addTo(map);
    layerRef.current = group;

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [venues, venueStatuses, selectedVenue, zoom, matches, map, onMarkerClick]);

  return null;
}

/* ─── MAIN COMPONENT ─── */
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
      statusMap[venue.id] = { isActive: !!ongoingMatch, hasUserMatch, matchCount };
    });
    return statusMap;
  }, [venues, matches, userMatchIds]);

  const validVenues = useMemo(() => {
    return venues.filter(v =>
      v.latitude && v.longitude &&
      !isNaN(v.latitude) && !isNaN(v.longitude) &&
      v.latitude >= -90 && v.latitude <= 90 &&
      v.longitude >= -180 && v.longitude <= 180
    );
  }, [venues]);

  const defaultCenter = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) return userLocation;
    return { lat: 59.3293, lng: 18.0686 };
  }, [userLocation]);

  const handleMarkerClick = useCallback((venue) => {
    if (onVenueSelect) onVenueSelect(venue);
  }, [onVenueSelect]);

  return (
    <div className="w-full h-full relative">
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
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
          keepBuffer={2}
          updateInterval={200}
        />

        {mapReady && <MapCenterController center={defaultCenter} zoom={13} selectedVenue={selectedVenue} />}

        {userLocation?.lat && userLocation?.lng && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserLocationIcon()} />
        )}

        {mapReady && (
          <ClusteredMarkers
            venues={validVenues}
            venueStatuses={venueStatuses}
            selectedVenue={selectedVenue}
            onMarkerClick={handleMarkerClick}
            matches={matches}
          />
        )}
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

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[2] flex items-center gap-2.5 bg-[#121715]/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-[#223029]">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0F2917] border border-[#2BA84A]" />
          <span className="text-[9px] text-[#9EAAA4]">Plan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F4743B]" />
          <span className="text-[9px] text-[#9EAAA4]">Match</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4169E1]" />
          <span className="text-[9px] text-[#9EAAA4]">Anmäld</span>
        </div>
      </div>

      <style>{`
        .allplay-venue-puck, .allplay-match-pin, .allplay-cluster {
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
        .allplay-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .allplay-tooltip::before {
          display: none !important;
        }
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
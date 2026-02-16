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

/* ─── PIN COLOR TOKENS ─── */
const PIN_COLORS = {
  venue:  { fill: '#0D2818', stroke: '#2BA84A', icon: '#4ADE80' },
  match:  { fill: '#2A1208', stroke: '#F4743B', icon: '#FDBA74' },
  joined: { fill: '#0E1B3D', stroke: '#4169E1', icon: '#93B4F5' },
  live:   { fill: '#2A1F08', stroke: '#F59E0B', icon: '#FDE68A' },
};

function getPinColors(hasMatch, hasUserMatch, status) {
  if (!hasMatch) return PIN_COLORS.venue;
  if (status === 'live') return PIN_COLORS.live;
  if (hasUserMatch) return PIN_COLORS.joined;
  return PIN_COLORS.match;
}

/* ─── VENUE PIN (green teardrop — no match) ─── */
function createVenuePin(isSelected) {
  const s = isSelected ? 38 : 30;
  const w = s + 8;       // extra for shadow room
  const h = s + 16;
  const cx = w / 2;
  const r = s / 2 - 1;
  const cy = r + 4;      // body center
  const tipY = h - 3;
  const c = PIN_COLORS.venue;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <ellipse cx="${cx}" cy="${tipY}" rx="${r*0.35}" ry="2.5" fill="rgba(0,0,0,0.35)"/>
    <path d="M${cx},${tipY - 1}
             C${cx},${tipY - 1} ${cx - r*0.5},${cy + r*0.65} ${cx - r},${cy}
             A${r},${r} 0 1,1 ${cx + r},${cy}
             C${cx + r*0.5},${cy + r*0.65} ${cx},${tipY - 1} ${cx},${tipY - 1}Z"
          fill="${c.fill}" stroke="${c.stroke}" stroke-width="${isSelected ? 2.5 : 1.8}"/>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="none" stroke="${c.icon}" stroke-width="1.4" opacity="0.85"/>
    <circle cx="${cx}" cy="${cy}" r="1.8" fill="${c.icon}" opacity="0.9"/>
  </svg>`;

  return L.divIcon({
    html: `<div class="ap-pin${isSelected ? ' ap-sel' : ''}">${svg}</div>`,
    className: '',
    iconSize: [w, h],
    iconAnchor: [cx, tipY],
    popupAnchor: [0, -h + 6],
  });
}

/* ─── MATCH PIN (orange/blue/gold teardrop) ─── */
function createMatchPin(matchCount, status, isSelected, hasUserMatch) {
  const s = isSelected ? 44 : 36;
  const w = s + 10;
  const h = s + 18;
  const cx = w / 2;
  const r = s / 2 - 1;
  const cy = r + 5;
  const tipY = h - 3;
  const c = getPinColors(true, hasUserMatch, status);

  // Pulse ring for live matches
  const pulse = status === 'live' ? `
    <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="${c.stroke}" stroke-width="1.5" opacity="0.3">
      <animate attributeName="r" values="${r+4};${r+10};${r+4}" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0.08;0.4" dur="1.6s" repeatCount="indefinite"/>
    </circle>` : '';

  // Badge for multiple matches
  const badge = matchCount > 1 ? `
    <circle cx="${cx + r - 4}" cy="${cy - r + 4}" r="8" fill="#FFFFFF" stroke="${c.stroke}" stroke-width="1.4"/>
    <text x="${cx + r - 4}" y="${cy - r + 4}" text-anchor="middle" dominant-baseline="central"
          fill="#111" font-size="9" font-weight="800" font-family="system-ui">${matchCount > 9 ? '9+' : matchCount}</text>` : '';

  // Football icon in center
  const icon = `
    <circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="${c.icon}" stroke-width="1.4" opacity="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="2.2" fill="${c.icon}" opacity="0.9"/>
    <line x1="${cx}" y1="${cy - 6}" x2="${cx}" y2="${cy - 2.2}" stroke="${c.icon}" stroke-width="0.8" opacity="0.55"/>
    <line x1="${cx}" y1="${cy + 2.2}" x2="${cx}" y2="${cy + 6}" stroke="${c.icon}" stroke-width="0.8" opacity="0.55"/>
    <line x1="${cx - 6}" y1="${cy}" x2="${cx - 2.2}" y2="${cy}" stroke="${c.icon}" stroke-width="0.8" opacity="0.55"/>
    <line x1="${cx + 2.2}" y1="${cy}" x2="${cx + 6}" y2="${cy}" stroke="${c.icon}" stroke-width="0.8" opacity="0.55"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${pulse}
    <ellipse cx="${cx}" cy="${tipY}" rx="${r*0.4}" ry="3" fill="rgba(0,0,0,0.4)"/>
    <path d="M${cx},${tipY - 1}
             C${cx},${tipY - 1} ${cx - r*0.5},${cy + r*0.65} ${cx - r},${cy}
             A${r},${r} 0 1,1 ${cx + r},${cy}
             C${cx + r*0.5},${cy + r*0.65} ${cx},${tipY - 1} ${cx},${tipY - 1}Z"
          fill="${c.fill}" stroke="${c.stroke}" stroke-width="${isSelected ? 2.8 : 2.2}"/>
    ${icon}
    ${badge}
  </svg>`;

  const cls = `ap-pin ap-pin-match${isSelected ? ' ap-sel' : ''}${status === 'live' ? ' ap-live' : ''}`;
  return L.divIcon({
    html: `<div class="${cls}">${svg}</div>`,
    className: '',
    iconSize: [w, h],
    iconAnchor: [cx, tipY],
    popupAnchor: [0, -h + 6],
  });
}

/* ─── TOOLTIP ─── */
function createSelectedTooltip(match, spotsLeft) {
  const timeStr = match.time || '';
  const spotsText = match.is_spontaneous ? 'Spontan' : (spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} platser kvar` : 'Full');
  return `<div style="
    background:#121715;border:1px solid #223029;border-radius:10px;padding:5px 10px;
    font-family:system-ui;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.6);
    display:flex;align-items:center;gap:6px;pointer-events:none;
  ">
    <span style="color:#2BA84A;font-weight:700;font-size:11px;">${timeStr}</span>
    <span style="color:#9EAAA4;font-size:10px;">·</span>
    <span style="color:#B6C2BC;font-size:10px;font-weight:600;">${spotsText}</span>
  </div>`;
}

/* ─── CLUSTER ICON ─── */
function createClusterIcon(count, hasAnyMatch) {
  const s = 44;
  const half = s / 2;
  const stroke = hasAnyMatch ? '#F4743B' : '#2BA84A';
  const textColor = hasAnyMatch ? '#FDBA74' : '#86EFAC';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${half}" cy="${half}" r="${half - 4}" fill="#121715" stroke="${stroke}" stroke-width="2.2"/>
    <circle cx="${half}" cy="${half}" r="${half - 4}" fill="${stroke}" fill-opacity="0.12"/>
    <text x="${half}" y="${half}" text-anchor="middle" dominant-baseline="central"
          fill="${textColor}" font-size="15" font-weight="800" font-family="system-ui">${count}</text>
  </svg>`;

  return L.divIcon({
    html: `<div class="ap-pin ap-cluster">${svg}</div>`,
    className: '',
    iconSize: [s, s],
    iconAnchor: [half, half],
  });
}

/* ─── USER LOCATION DOT ─── */
function createUserLocationIcon() {
  return L.divIcon({
    html: `<div class="ap-user-dot">
      <div class="ap-user-pulse"></div>
      <div class="ap-user-core"></div>
    </div>`,
    className: '',
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

  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const group = L.layerGroup();

    if (zoom >= 14) {
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

        if (isSelected && hasMatches) {
          const venueMatches = matches.filter(m => m.venue_id === venue.id && (m.status === 'upcoming' || m.status === 'ongoing'));
          const bestMatch = venueMatches[0];
          if (bestMatch) {
            const spotsLeft = bestMatch.is_spontaneous ? null : (bestMatch.max_players - (bestMatch.current_players || 0));
            marker.bindTooltip(createSelectedTooltip(bestMatch, spotsLeft), {
              permanent: true, direction: 'top', offset: [0, -10], className: 'ap-tooltip',
            });
          }
        }

        group.addLayer(marker);
      });
    } else {
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
          const hasAnyMatch = clusterVenues.some(v => (venueStatuses[v.id]?.matchCount || 0) > 0);
          const icon = createClusterIcon(clusterVenues.length, hasAnyMatch);
          const marker = L.marker([avgLat, avgLng], { icon });
          marker.on('click', () => map.setView([avgLat, avgLng], zoom + 2, { animate: true }));
          group.addLayer(marker);
        }
      });
    }

    group.addTo(map);
    layerRef.current = group;
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
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

      {/* Floating Venue Preview */}
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
      <div className="absolute bottom-3 left-3 z-[2] flex items-center gap-3 bg-[#121715]/92 backdrop-blur-md rounded-xl px-3 py-2 border border-[#223029] shadow-lg">
        <div className="flex items-center gap-1.5">
          <svg width="10" height="14" viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13C5 13 1 8 1 5a4 4 0 118 0c0 3-4 8-4 8z" fill="#0D2818" stroke="#2BA84A" strokeWidth="1.2"/>
          </svg>
          <span className="text-[10px] font-medium text-[#9EAAA4]">Plan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="10" height="14" viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13C5 13 1 8 1 5a4 4 0 118 0c0 3-4 8-4 8z" fill="#2A1208" stroke="#F4743B" strokeWidth="1.2"/>
          </svg>
          <span className="text-[10px] font-medium text-[#9EAAA4]">Match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="10" height="14" viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13C5 13 1 8 1 5a4 4 0 118 0c0 3-4 8-4 8z" fill="#0E1B3D" stroke="#4169E1" strokeWidth="1.2"/>
          </svg>
          <span className="text-[10px] font-medium text-[#9EAAA4]">Anmäld</span>
        </div>
      </div>

      <style>{`
        /* Pin base */
        .ap-pin {
          transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
          cursor: pointer;
        }
        .ap-pin:hover {
          transform: scale(1.15) translateY(-3px);
        }
        .ap-pin:active {
          transform: scale(0.93);
        }
        .ap-sel {
          transform: scale(1.18) translateY(-4px);
          z-index: 1000 !important;
        }
        .ap-cluster:hover {
          transform: scale(1.2);
        }
        .ap-cluster:active {
          transform: scale(0.9);
        }

        /* Leaflet icon reset */
        .leaflet-marker-icon {
          background: none !important;
          border: none !important;
        }

        /* User location dot */
        .ap-user-dot {
          position: relative;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
        }
        .ap-user-core {
          width: 14px; height: 14px;
          background: #2BA84A;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(43,168,74,0.4);
          position: relative; z-index: 2;
        }
        .ap-user-pulse {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 32px; height: 32px;
          background: rgba(43,168,74,0.25);
          border-radius: 50%;
          animation: apPulse 2s ease-in-out infinite;
          z-index: 1;
        }
        @keyframes apPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.15; }
        }

        /* Tooltip */
        .ap-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .ap-tooltip::before { display: none !important; }

        /* Leaflet controls */
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
          width: 36px !important; height: 36px !important;
          line-height: 36px !important; font-size: 16px !important;
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
        .leaflet-control-attribution a { color: #2BA84A !important; }
      `}</style>
    </div>
  );
}
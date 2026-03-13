import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion } from 'framer-motion';
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
  venue:  { fill: '#0D2818', stroke: '#2BA84A', icon: '#4ADE80' },   // green – plain venue
  match:  { fill: '#2A1208', stroke: '#F4743B', icon: '#FDBA74' },   // orange – match exists
  soon:   { fill: '#2A0A1A', stroke: '#EC4899', icon: '#F9A8D4' },   // pink – starting within 3h
  full:   { fill: '#1A0D0D', stroke: '#DC2626', icon: '#FCA5A5' },   // red – no spots left
  joined: { fill: '#0E1B3D', stroke: '#4169E1', icon: '#93B4F5' },   // blue – user signed up
  live:   { fill: '#2A1F08', stroke: '#F59E0B', icon: '#FDE68A' },   // gold – ongoing
};

function getPinColors(hasMatch, hasUserMatch, status) {
  if (!hasMatch) return PIN_COLORS.venue;
  if (status === 'live') return PIN_COLORS.live;
  if (hasUserMatch) return PIN_COLORS.joined;
  if (status === 'full') return PIN_COLORS.full;
  if (status === 'soon') return PIN_COLORS.soon;
  return PIN_COLORS.match;
}

/* ─── VENUE PIN (rounded standard map pin) ─── */
function createVenuePin(isSelected, hasMatch = false, hasUserMatch = false) {
  const w = isSelected ? 36 : 28;
  const h = isSelected ? 46 : 36;
  const cx = w / 2;
  const r = w / 2 - 2;
  const cy = r + 2;
  // Pick color based on state: user signed up > has match > plain venue
  const c = hasUserMatch ? PIN_COLORS.joined : hasMatch ? PIN_COLORS.match : PIN_COLORS.venue;
  const sw = isSelected ? 2.2 : 1.6;

  // Inner icon: football for match, checkmark for joined, dot for plain venue
  let innerIcon;
  if (hasUserMatch) {
    // Checkmark icon
    innerIcon = `<polyline points="${cx-r*0.2},${cy} ${cx-r*0.05},${cy+r*0.15} ${cx+r*0.2},${cy-r*0.15}" fill="none" stroke="${c.icon}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (hasMatch) {
    // Football circle with lines
    innerIcon = `<circle cx="${cx}" cy="${cy}" r="${r*0.3}" fill="none" stroke="${c.icon}" stroke-width="1.3" opacity="0.9"/>
      <line x1="${cx-r*0.2}" y1="${cy}" x2="${cx+r*0.2}" y2="${cy}" stroke="${c.icon}" stroke-width="1" opacity="0.7"/>
      <line x1="${cx}" y1="${cy-r*0.2}" x2="${cx}" y2="${cy+r*0.2}" stroke="${c.icon}" stroke-width="1" opacity="0.7"/>`;
  } else {
    innerIcon = `<circle cx="${cx}" cy="${cy}" r="${r*0.38}" fill="${c.icon}" opacity="0.9"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><filter id="vs${isSelected?1:0}"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.35"/></filter></defs>
    <path d="M${cx} ${h-1} C${cx} ${h-1} ${cx-r*0.6} ${cy+r*0.8} ${cx-r} ${cy}
             a${r} ${r} 0 1 1 ${r*2} 0
             C${cx+r*0.6} ${cy+r*0.8} ${cx} ${h-1} ${cx} ${h-1}Z"
          fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" filter="url(#vs${isSelected?1:0})" stroke-linejoin="round"/>
    ${innerIcon}
  </svg>`;

  return L.divIcon({
    html: `<div class="ap-pin${isSelected ? ' ap-sel' : ''}">${svg}</div>`,
    className: '',
    iconSize: [w, h],
    iconAnchor: [cx, h - 1],
    popupAnchor: [0, -h + 4],
  });
}

/* ─── MATCH PIN (rounded standard map pin — orange/blue/gold) ─── */
function createMatchPin(matchCount, status, isSelected, hasUserMatch) {
  const w = isSelected ? 40 : 32;
  const h = isSelected ? 52 : 42;
  const cx = w / 2;
  const r = w / 2 - 2;
  const cy = r + 2;
  const c = getPinColors(true, hasUserMatch, status);
  const sw = isSelected ? 2.4 : 1.8;

  const pulse = status === 'live' ? `
    <circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="none" stroke="${c.stroke}" stroke-width="1.2" opacity="0.3">
      <animate attributeName="r" values="${r+3};${r+9};${r+3}" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.6s" repeatCount="indefinite"/>
    </circle>` : '';

  const badge = matchCount > 1 ? `
    <circle cx="${cx + r - 2}" cy="${cy - r + 2}" r="7" fill="#FFF" stroke="${c.stroke}" stroke-width="1.2"/>
    <text x="${cx + r - 2}" y="${cy - r + 2}" text-anchor="middle" dominant-baseline="central"
          fill="#111" font-size="8" font-weight="800" font-family="system-ui">${matchCount > 9 ? '9+' : matchCount}</text>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><filter id="ms${isSelected?1:0}"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.4"/></filter></defs>
    ${pulse}
    <path d="M${cx} ${h-1} C${cx} ${h-1} ${cx-r*0.6} ${cy+r*0.8} ${cx-r} ${cy}
             a${r} ${r} 0 1 1 ${r*2} 0
             C${cx+r*0.6} ${cy+r*0.8} ${cx} ${h-1} ${cx} ${h-1}Z"
          fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" filter="url(#ms${isSelected?1:0})" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r*0.42}" fill="${c.icon}" opacity="0.9"/>
    ${badge}
  </svg>`;

  const cls = `ap-pin ap-pin-match${isSelected ? ' ap-sel' : ''}${status === 'live' ? ' ap-live' : ''}`;
  return L.divIcon({
    html: `<div class="${cls}">${svg}</div>`,
    className: '',
    iconSize: [w, h],
    iconAnchor: [cx, h - 1],
    popupAnchor: [0, -h + 4],
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
function MapCenterController({ center, zoom, selectedVenue, recenterFlag }) {
  const map = useMap();
  const hasReceivedRealLocation = useRef(false);
  const prevVenueRef = useRef(null);
  const lastRecenterFlag = useRef(0);
  const prevCenterRef = useRef(null);

  useEffect(() => {
    if (selectedVenue?.latitude != null && selectedVenue?.longitude != null) {
      // Fly to selected venue with smooth animation
      map.flyTo([selectedVenue.latitude, selectedVenue.longitude], 16, { duration: 0.8, easeLinearity: 0.25 });
      prevVenueRef.current = selectedVenue;
    } else if (prevVenueRef.current) {
      // Venue was deselected (close button) — stay where we are, don't re-center
      prevVenueRef.current = null;
    } else if (recenterFlag > lastRecenterFlag.current && center?.lat && center?.lng) {
      // Green button pressed — fly to user location
      lastRecenterFlag.current = recenterFlag;
      map.flyTo([center.lat, center.lng], 14, { duration: 1.0, easeLinearity: 0.25 });
    } else if (center?.lat && center?.lng) {
      const centerChanged = !prevCenterRef.current || 
        prevCenterRef.current.lat !== center.lat || 
        prevCenterRef.current.lng !== center.lng;
      
      if (!hasReceivedRealLocation.current && centerChanged) {
        // Smooth fly to user location when it first arrives
        map.flyTo([center.lat, center.lng], zoom, { duration: 1.2, easeLinearity: 0.25 });
        const isDefaultStockholm = Math.abs(center.lat - 59.3293) < 0.001 && Math.abs(center.lng - 18.0686) < 0.001;
        if (!isDefaultStockholm) {
          hasReceivedRealLocation.current = true;
        }
      }
      prevCenterRef.current = { lat: center.lat, lng: center.lng };
    }
  }, [center, zoom, selectedVenue, recenterFlag, map]);
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
          icon = createVenuePin(isSelected, false, false);
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
            : createVenuePin(false, false, false);
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
  recenterFlag = 0,
  onVenueSelect,
  onShowDetails,
  onMatchClick,
  userMatchIds = []
}) {
  const [mapReady, setMapReady] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef(null);

  const venueStatuses = useMemo(() => {
    const statusMap = {};
    venues.forEach(venue => {
      const venueMatches = matches.filter(m => m.venue_id === venue.id);
      // Only count upcoming + ongoing as "active" matches for pin coloring
      const activeMatches = venueMatches.filter(m => m.status === 'upcoming' || m.status === 'ongoing');
      const ongoingMatch = activeMatches.find(m => m.status === 'ongoing');
      const hasUserMatch = activeMatches.some(m => userMatchIds.includes(m.id));
      const matchCount = activeMatches.length;
      // Priority: BLUE (user joined) > ORANGE (match exists) > GREEN (no match)
      // finished/cancelled matches => treated as no active match => GREEN
      statusMap[venue.id] = { isActive: !!ongoingMatch, hasUserMatch, matchCount };
    });
    return statusMap;
  }, [venues, matches, userMatchIds]);

  const validVenues = useMemo(() => {
    const valid = venues.filter(v =>
      v.latitude != null && v.longitude != null &&
      !isNaN(v.latitude) && !isNaN(v.longitude) &&
      v.latitude >= -90 && v.latitude <= 90 &&
      v.longitude >= -180 && v.longitude <= 180
    );
    console.log(`[MapView] validVenues: ${valid.length}/${venues.length} passed coordinate filter`);
    return valid;
  }, [venues]);

  const defaultCenter = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) return userLocation;
    return { lat: 59.3293, lng: 18.0686 };
  }, [userLocation?.lat, userLocation?.lng]);

  const handleMarkerClick = useCallback((venue) => {
    if (onVenueSelect) onVenueSelect(venue);
  }, [onVenueSelect]);

  return (
    <div className={`w-full h-full relative transition-opacity duration-500 ease-out ${mapVisible ? 'opacity-100' : 'opacity-0'}`}>
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
        whenReady={() => {
          setMapReady(true);
          // Slight delay for tiles to render before fade-in
          requestAnimationFrame(() => {
            setTimeout(() => setMapVisible(true), 80);
          });
        }}
        preferCanvas={true}
        updateWhenIdle={false}
        updateWhenZooming={true}
        fadeAnimation={true}
        zoomAnimation={true}
        markerZoomAnimation={true}
        inertia={true}
        inertiaDeceleration={3000}
        inertiaMaxSpeed={1500}
        easeLinearity={0.2}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
          keepBuffer={4}
          updateInterval={100}
          tileSize={256}
          detectRetina={true}
        />

        {mapReady && <MapCenterController center={defaultCenter} zoom={13} selectedVenue={selectedVenue} recenterFlag={recenterFlag} />}

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
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: mapVisible ? 1 : 0, y: mapVisible ? 0 : 10 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        className="absolute bottom-3 left-3 z-[2] flex items-center gap-2 bg-[#121715]/92 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-[#223029] shadow-lg flex-wrap"
      >
        <div className="flex items-center gap-1">
          <svg width="10" height="14" viewBox="0 0 10 14"><path d="M5 13C5 13 2.5 8.5 1.5 5.5a4 4 0 117 0C7.5 8.5 5 13 5 13z" fill="#0D2818" stroke="#2BA84A" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" fill="#4ADE80"/></svg>
          <span className="text-[9px] font-medium text-[#9EAAA4]">Plan</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="10" height="14" viewBox="0 0 10 14"><path d="M5 13C5 13 2.5 8.5 1.5 5.5a4 4 0 117 0C7.5 8.5 5 13 5 13z" fill="#2A1208" stroke="#F4743B" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" fill="#FDBA74"/></svg>
          <span className="text-[9px] font-medium text-[#9EAAA4]">Match</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="10" height="14" viewBox="0 0 10 14"><path d="M5 13C5 13 2.5 8.5 1.5 5.5a4 4 0 117 0C7.5 8.5 5 13 5 13z" fill="#2A0A1A" stroke="#EC4899" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" fill="#F9A8D4"/></svg>
          <span className="text-[9px] font-medium text-[#9EAAA4]">Snart</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="10" height="14" viewBox="0 0 10 14"><path d="M5 13C5 13 2.5 8.5 1.5 5.5a4 4 0 117 0C7.5 8.5 5 13 5 13z" fill="#1A0D0D" stroke="#DC2626" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" fill="#FCA5A5"/></svg>
          <span className="text-[9px] font-medium text-[#9EAAA4]">Full</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="10" height="14" viewBox="0 0 10 14"><path d="M5 13C5 13 2.5 8.5 1.5 5.5a4 4 0 117 0C7.5 8.5 5 13 5 13z" fill="#0E1B3D" stroke="#4169E1" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" fill="#93B4F5"/></svg>
          <span className="text-[9px] font-medium text-[#9EAAA4]">Anmäld</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="10" height="14" viewBox="0 0 10 14"><path d="M5 13C5 13 2.5 8.5 1.5 5.5a4 4 0 117 0C7.5 8.5 5 13 5 13z" fill="#2A1F08" stroke="#F59E0B" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" fill="#FDE68A"/></svg>
          <span className="text-[9px] font-medium text-[#9EAAA4]">Live</span>
        </div>
      </motion.div>

      <style>{`
        /* GPU-accelerate the entire map container for silky panning/zooming */
        .leaflet-container {
          will-change: transform;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        .leaflet-tile-container {
          will-change: transform;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        .leaflet-tile {
          will-change: opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .leaflet-zoom-anim .leaflet-zoom-animated {
          will-change: transform;
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        .leaflet-fade-anim .leaflet-popup {
          transition: opacity 0.2s ease-out !important;
        }
        .leaflet-marker-pane {
          will-change: transform;
        }

        /* Pin base — smooth spring transitions */
        .ap-pin {
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease-out;
          cursor: pointer;
          display: block;
          line-height: 0;
          font-size: 0;
          box-sizing: content-box;
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .ap-pin svg {
          display: block;
          max-width: none;
          filter: none;
          transform: none;
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
        .ap-cluster {
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .ap-cluster:hover {
          transform: scale(1.2);
        }
        .ap-cluster:active {
          transform: scale(0.9);
        }

        /* Leaflet icon reset — cross-platform consistency */
        .leaflet-marker-icon {
          background: none !important;
          border: none !important;
          filter: none !important;
          image-rendering: auto;
          transition: opacity 0.15s ease-out;
        }
        .leaflet-marker-icon img {
          max-width: none !important;
          filter: none !important;
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
          transition: opacity 0.2s ease-out !important;
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
          transition: background 0.15s ease, color 0.15s ease !important;
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
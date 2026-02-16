/**
 * PlanMarker — Reusable venue/pitch marker for AllPlay maps
 * 
 * States:
 *  - empty:    No planned match — muted dark pin
 *  - active:   Has match(es) — filled green with glow
 *  - busy:     Multiple matches / high activity — green with count badge
 *  - live:     Ongoing match — amber/gold with pulse
 *  - joined:   User is signed up — royal blue accent
 * 
 * Props:
 *  - state: 'empty' | 'active' | 'busy' | 'live' | 'joined'
 *  - selected: boolean
 *  - count: number (match count, shown as badge when > 1)
 *  - size: 'sm' | 'md' (default 'md')
 */

import L from 'leaflet';

/* ─── COLOR TOKENS PER STATE ─── */
const STATE_COLORS = {
  empty: {
    fill: '#1A201D',
    stroke: '#3A4A42',
    glow: 'none',
    icon: '#6B7B73',
    badge: null,
  },
  active: {
    fill: '#0D2818',
    stroke: '#2BA84A',
    glow: 'rgba(43,168,74,0.35)',
    icon: '#86EFAC',
    badge: null,
  },
  busy: {
    fill: '#0D2818',
    stroke: '#2BA84A',
    glow: 'rgba(43,168,74,0.45)',
    icon: '#86EFAC',
    badge: '#2BA84A',
  },
  live: {
    fill: '#2A1F08',
    stroke: '#F59E0B',
    glow: 'rgba(245,158,11,0.4)',
    icon: '#FDE68A',
    badge: '#F59E0B',
  },
  joined: {
    fill: '#0E1B3D',
    stroke: '#4169E1',
    glow: 'rgba(65,105,225,0.35)',
    icon: '#93B4F5',
    badge: '#4169E1',
  },
};

/**
 * Generate the SVG string for a plan marker
 */
function generatePlanMarkerSVG({ state = 'empty', selected = false, count = 0 }) {
  const c = STATE_COLORS[state] || STATE_COLORS.empty;

  // Sizing: 44px minimum tap target, larger when selected
  const bodySize = selected ? 44 : 38;
  const w = bodySize + 14; // padding for glow/shadow
  const h = bodySize + 22;
  const cx = w / 2;
  const r = bodySize / 2 - 1;
  const cy = r + 6;
  const tipY = h - 4;
  const strokeW = selected ? 3 : 2.2;

  // Glow is handled via CSS box-shadow on the wrapper div (not SVG filters)
  // SVG filters in Leaflet divIcon can cause rendering issues
  const glowFilter = '';
  const filterAttr = '';

  // Ground shadow
  const shadow = `<ellipse cx="${cx}" cy="${tipY + 1}" rx="${r * 0.38}" ry="3" fill="rgba(0,0,0,0.5)"/>`;

  // Pin body (teardrop)
  const pinBody = `
    <path d="M${cx},${tipY}
             C${cx},${tipY} ${cx - r * 0.52},${cy + r * 0.68} ${cx - r},${cy}
             A${r},${r} 0 1,1 ${cx + r},${cy}
             C${cx + r * 0.52},${cy + r * 0.68} ${cx},${tipY} ${cx},${tipY}Z"
          fill="${c.fill}" stroke="${c.stroke}" stroke-width="${strokeW}"${filterAttr}/>`;

  // Football pitch icon (minimal, clean) — always present
  const pitchIcon = generatePitchIcon(cx, cy, c.icon, state === 'empty' ? 0.5 : 0.85);

  // Activity dot (small pulsing dot for active state without badge)
  const activityDot = state === 'active' && count <= 1 ? `
    <circle cx="${cx + r * 0.55}" cy="${cy - r * 0.55}" r="4" fill="${c.stroke}" stroke="#0F1513" stroke-width="1.5">
      <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
    </circle>` : '';

  // Count badge (for busy / live / joined with multiple matches)
  const badge = count > 1 && c.badge ? `
    <circle cx="${cx + r * 0.5}" cy="${cy - r * 0.5}" r="9" fill="#FFFFFF" stroke="${c.badge}" stroke-width="1.8"/>
    <text x="${cx + r * 0.5}" y="${cy - r * 0.5}" text-anchor="middle" dominant-baseline="central"
          fill="#111" font-size="10" font-weight="800" font-family="system-ui">${count > 9 ? '9+' : count}</text>` : '';

  // Pulse ring for live matches
  const pulse = state === 'live' ? `
    <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="${c.stroke}" stroke-width="1.5" opacity="0.3">
      <animate attributeName="r" values="${r + 4};${r + 12};${r + 4}" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite"/>
    </circle>` : '';

  // Selected ring (subtle outer highlight)
  const selRing = selected ? `
    <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${c.stroke}" stroke-width="1" opacity="0.5" stroke-dasharray="3 3"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${glowFilter}
    ${pulse}
    ${selRing}
    ${shadow}
    ${pinBody}
    ${pitchIcon}
    ${activityDot}
    ${badge}
  </svg>`;
}

/**
 * Mini football pitch icon — clean, premium, not cartoon
 */
function generatePitchIcon(cx, cy, color, opacity) {
  const s = 7; // half-size of the pitch rectangle
  return `
    <g opacity="${opacity}">
      <!-- Pitch outline -->
      <rect x="${cx - s}" y="${cy - s * 0.7}" width="${s * 2}" height="${s * 1.4}" rx="1.5" 
            fill="none" stroke="${color}" stroke-width="1.2"/>
      <!-- Center line -->
      <line x1="${cx}" y1="${cy - s * 0.7}" x2="${cx}" y2="${cy + s * 0.7}" 
            stroke="${color}" stroke-width="0.8"/>
      <!-- Center circle -->
      <circle cx="${cx}" cy="${cy}" r="${s * 0.3}" fill="none" stroke="${color}" stroke-width="0.8"/>
      <!-- Center dot -->
      <circle cx="${cx}" cy="${cy}" r="1" fill="${color}"/>
    </g>`;
}

/**
 * Create a Leaflet DivIcon for a plan marker
 */
export function createPlanIcon({ state = 'empty', selected = false, count = 0 } = {}) {
  const bodySize = selected ? 44 : 38;
  const w = bodySize + 14;
  const h = bodySize + 22;
  const cx = w / 2;
  const tipY = h - 4;

  const svg = generatePlanMarkerSVG({ state, selected, count });

  const stateClass = `ap-plan ap-plan-${state}${selected ? ' ap-plan-sel' : ''}`;

  return L.divIcon({
    html: `<div class="${stateClass}" style="width:${w}px;height:${h}px;">${svg}</div>`,
    className: '',
    iconSize: [w, h],
    iconAnchor: [cx, tipY],
    popupAnchor: [0, -h + 8],
  });
}

/**
 * Determine the marker state from venue + match data
 */
export function getMarkerState({ matchCount = 0, hasUserMatch = false, hasLiveMatch = false }) {
  if (hasLiveMatch) return 'live';
  if (hasUserMatch) return 'joined';
  if (matchCount > 1) return 'busy';
  if (matchCount === 1) return 'active';
  return 'empty';
}

/**
 * CSS styles for PlanMarker animations
 */
export const PLAN_MARKER_CSS = `
  /* Plan marker base */
  .ap-plan {
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
    cursor: pointer;
    /* Ensure 44px minimum tap area */
    min-width: 44px;
    min-height: 44px;
  }
  .ap-plan:hover {
    transform: scale(1.12) translateY(-3px);
  }
  .ap-plan:active {
    transform: scale(0.92);
    transition-duration: 0.08s;
  }
  .ap-plan-sel {
    transform: scale(1.08) translateY(-4px);
    z-index: 1000 !important;
  }
  .ap-plan-sel:hover {
    transform: scale(1.12) translateY(-5px);
  }

  /* State-specific hover enhancements */
  .ap-plan-active:hover,
  .ap-plan-busy:hover,
  .ap-plan-live:hover,
  .ap-plan-joined:hover {
    filter: brightness(1.1);
  }
  .ap-plan-empty:hover {
    filter: brightness(1.25);
  }
`;

export default {
  createPlanIcon,
  getMarkerState,
  PLAN_MARKER_CSS,
};
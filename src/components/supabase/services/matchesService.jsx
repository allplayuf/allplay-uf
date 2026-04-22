/**
 * Matches Service
 * 
 * ARCHITECTURE: Backend (Supabase RLS) is source of truth
 * - No frontend security filtering
 * - RLS determines what each user can see
 * - Frontend only controls UI actions (join/leave/kick buttons)
 * 
 * All write operations go through Edge Functions.
 * Read operations use REST API with RLS enforcement.
 */

import { callEdgeFunction, callPublicEdgeFunction } from '../callEdgeFunction';
import { getAuthHeaders, SUPABASE_URL } from '../config';
import { EDGE } from '../edgeNames';

// Dev mode check for console logging
const IS_DEV = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Valid level values for Supabase 'matches_level_check' constraint
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'pro'];

// Map UI labels/values to valid DB values
const LEVEL_MAP = {
  // Direct values (lowercase)
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'advanced': 'advanced',
  'pro': 'pro',
  // Swedish labels
  'nybörjare': 'beginner',
  'medel': 'intermediate',
  'avancerad': 'advanced',
  'proffs': 'pro',
  // Legacy values that might come from old code
  'elite': 'pro',
  'mixed': 'intermediate', // Default fallback for "mixed"
};

/**
 * Normalize level value to valid DB constraint value
 * @param {string} level - Level from UI (can be label or value)
 * @returns {string} Valid level for DB
 */
function normalizeLevel(level) {
  if (!level) return 'intermediate'; // Default
  
  const normalized = String(level).trim().toLowerCase();
  
  // Direct match to valid level
  if (VALID_LEVELS.includes(normalized)) {
    return normalized;
  }
  
  // Map from label/legacy value
  if (LEVEL_MAP[normalized]) {
    return LEVEL_MAP[normalized];
  }
  
  // Fallback
  console.warn(`[matchesService] Unknown level "${level}", defaulting to "intermediate"`);
  return 'intermediate';
}

/**
 * Create a new match
 * 
 * The edge function `create_match` requires `external_id` (the venue's
 * external identifier) — NOT the Supabase UUID `venue_id`.
 * We look up the external_id via a REST query before calling the edge.
 *
 * @param {object} payload - Match data from CreateMatchForm
 * @returns {Promise<{match_id: string, message: string}>}
 */
export async function createMatch(payload) {
  // Check if payload is wrapped in { match: ... } from CreateMatchForm
  const matchData = payload.match || payload;
  
  console.log('[matchesService] createMatch incoming:', { 
    hasMatchWrapper: !!payload.match,
    venue_id: matchData.venue_id,
    matchData 
  });
  
  // Normalize level to valid DB value
  const rawLevel = matchData.skill_bracket || matchData.level;
  const level = normalizeLevel(rawLevel);
  
  // Require venue_id (UUID) from frontend
  const venueUuid = matchData.venue_id;
  if (!venueUuid) {
    throw new Error('Välj en plats/plan');
  }

  // ── Look up external_id from Supabase venues table ──
  const headers = await getAuthHeaders();
  const venueRes = await fetch(
    `${SUPABASE_URL}/rest/v1/venues?id=eq.${encodeURIComponent(venueUuid)}&select=external_id&limit=1`,
    { method: 'GET', headers }
  );
  if (!venueRes.ok) {
    throw new Error(`Kunde inte hämta plan-info: ${venueRes.status}`);
  }
  const venueRows = await venueRes.json();
  const externalId = venueRows?.[0]?.external_id;

  if (!externalId) {
    throw new Error('Plan saknar external_id. Kontakta admin.');
  }

  // Build starts_at
  const startsAt = matchData.starts_at || (matchData.date && matchData.time ? `${matchData.date}T${matchData.time}:00` : null);
  if (!startsAt) {
    throw new Error('starts_at is required');
  }

  // Build backend payload — use external_id, NOT venue_id
  const backendPayload = {
    request_id: matchData.request_id || null,
    external_id: externalId,
    starts_at: startsAt,
    level,
    is_public: matchData.is_public !== false && !matchData.is_private,
    format: matchData.format || '5v5',
    max_players: matchData.is_spontaneous ? null : (matchData.max_players || 10),
    title: matchData.title || null,
    notes: matchData.notes || null,
    is_spontaneous: matchData.is_spontaneous || false
  };
  
  // Debug log right before invoke — verify external_id is present
  console.log('[matchesService] createMatch → edge payload:', JSON.stringify(backendPayload, null, 2));
  console.log('[matchesService] external_id present:', !!backendPayload.external_id);

  // Edge Function returns { match_id, message } on success
  const result = await callEdgeFunction(EDGE.createMatch, backendPayload);
  console.log('[matchesService] createMatch result:', result);
  return result;
}

// Export for use in other components
export { VALID_LEVELS, LEVEL_MAP, normalizeLevel };

/**
 * Join a match
 * 
 * @param {string} matchId - Match UUID
 */
export async function joinMatch(matchId) {
  return callEdgeFunction(EDGE.joinMatch, { match_id: matchId });
}

/**
 * Leave a match
 * 
 * @param {string} matchId - Match UUID
 */
export async function leaveMatch(matchId) {
  console.log('[matchesService] leaveMatch called with matchId:', matchId);
  const result = await callEdgeFunction(EDGE.leaveMatch, { match_id: matchId });
  console.log('[matchesService] leaveMatch result:', result);
  return result;
}

/**
 * Check in to a match (location verified)
 * 
 * @param {string} matchId - Match UUID
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 */
export async function checkInMatch(matchId, userLat, userLng) {
  return callEdgeFunction(EDGE.checkInMatch, {
    match_id: matchId,
    user_lat: userLat,
    user_lng: userLng
  });
}

/**
 * Get public matches feed (guest allowed)
 * Reads from public_matches view via REST API
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - No frontend filtering of is_public
 * - RLS determines what anon/authenticated users can see
 * - Always sort by starts_at ASC
 * 
 * @param {object} filters - Optional filters
 * @param {string} [filters.status] - Filter by status (upcoming/ongoing/completed)
 */
export async function getPublicMatches(filters = {}) {
  const headers = await getAuthHeaders();
  
  // Build query - always sort by starts_at ASC (backend is source of truth)
  let queryParams = 'select=*&order=starts_at.asc';
  
  if (filters.status === 'upcoming') {
    queryParams += '&status=eq.upcoming';
  }
  
  // NO frontend filtering of is_public - RLS handles this
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/public_matches?${queryParams}`, {
    method: 'GET',
    headers
  });
  
  if (!res.ok) {
    const error = await res.text().catch(() => '');
    console.error('[matchesService] Failed to fetch public_matches:', res.status, error);
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }
  
  const matches = await res.json();
  if (IS_DEV) {
    console.log('[matchesService] Fetched', matches.length, 'matches');
  }
  
  return matches;
}

/**
 * Get match details
 * 
 * @param {string} matchId - Match UUID
 * @returns {Promise<object>} - Match object with venue and participant data
 */
export async function getMatchDetails(matchId) {
  if (!matchId) {
    throw new Error('matchId is required');
  }
  
  const result = await callPublicEdgeFunction(EDGE.getMatchDetails, { match_id: matchId });
  
  // Log result shape for debugging
  if (IS_DEV) {
    console.log('[matchesService] getMatchDetails response:', {
      type: typeof result,
      isArray: Array.isArray(result),
      hasMatch: !!result?.match,
      hasParticipants: !!result?.participants,
      participantsType: typeof result?.participants,
      participantsIsArray: Array.isArray(result?.participants)
    });
  }
  
  return result;
}

/**
 * Get current user's participation in a match
 * Let backend return null for guests - no frontend guard needed
 * 
 * @param {string} matchId - Match UUID
 */
export async function getMyParticipation(matchId) {
  try {
    return await callPublicEdgeFunction(EDGE.getMyParticipation, { match_id: matchId });
  } catch (e) {
    // Backend returns null for guests or non-participants
    return null;
  }
}

/**
 * Get match participants (all participants visible - RLS handles access)
 * 
 * ARCHITECTURE: Show ALL participants for a match
 * - Backend determines who can see based on RLS
 * - Frontend does NOT filter participants
 * - Only hide ACTION buttons (join/leave/kick) based on auth
 * 
 * @param {string} matchId - Match UUID
 * @returns {Promise<Array>} - Array of participant objects
 */
export async function getMatchParticipants(matchId) {
  if (!matchId) {
    throw new Error('matchId is required');
  }
  
  const result = await callPublicEdgeFunction(EDGE.getMatchParticipants, { match_id: matchId });
  
  // CRITICAL: Ensure result is array
  let list = [];
  if (!result) list = [];
  else if (Array.isArray(result)) list = result;
  else if (result.participants && Array.isArray(result.participants)) list = result.participants;
  else {
    if (IS_DEV) {
      console.warn('[matchesService] getMatchParticipants unexpected format:', {
        type: typeof result,
        isArray: Array.isArray(result),
        keys: Object.keys(result || {})
      });
    }
    return [];
  }
  
  // Filter out participants that have left/cancelled — backend soft-deletes via status
  // Keep rows where status is active/registered/confirmed/checked_in OR status is missing
  const INACTIVE_STATUSES = new Set(['left', 'cancelled', 'removed', 'kicked', 'no_show']);
  return list.filter(p => {
    const status = (p?.status || '').toLowerCase();
    if (!status) return true; // no status field → treat as active
    return !INACTIVE_STATUSES.has(status);
  });
}

/**
 * Get match feed - preferred method for listing matches
 * Uses get_match_feed Edge Function which respects RLS
 * 
 * @param {object} filters - Optional filters
 */
export async function getMatchFeed(filters = {}) {
  return callPublicEdgeFunction(EDGE.getMatchFeed, filters);
}

/**
 * Finish a match (organizer only)
 * 
 * @param {string} matchId - Match UUID
 * @param {number} [homeScore] - Home team score
 * @param {number} [awayScore] - Away team score
 * @param {string} [notes] - Optional notes
 */
export async function finishMatch(matchId, { home_score, away_score, notes } = {}) {
  if (!matchId) throw new Error('matchId is required');
  
  const payload = { match_id: matchId };
  if (home_score !== undefined && home_score !== null) payload.home_score = home_score;
  if (away_score !== undefined && away_score !== null) payload.away_score = away_score;
  if (notes) payload.notes = notes;
  
  return callEdgeFunction(EDGE.finishMatch, payload);
}

/**
 * Delete a match (organizer only) via Edge Function
 * Uses singular `delete_match` — the only deployed function name.
 * 
 * @param {string} matchId - Match UUID
 */
export async function deleteMatch(matchId) {
  if (!matchId) {
    throw new Error('matchId is required');
  }
  return callEdgeFunction(EDGE.deleteMatch, { match_id: matchId });
}

/**
 * Delete a match via REST API (admin — RLS enforced)
 */
export async function deleteMatchRest(matchId) {
  if (!matchId) throw new Error('matchId is required');
  const headers = await getAuthHeaders();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?id=eq.${encodeURIComponent(matchId)}`,
    { method: 'DELETE', headers }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Kunde inte radera match: ${res.status} ${err}`);
  }
  return { ok: true };
}
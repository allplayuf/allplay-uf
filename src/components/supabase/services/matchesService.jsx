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
import { track } from '@/lib/analytics';

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
 * Passes pitch_id (UUID) directly — create_match edge function resolves
 * the venue internally, so the extra REST lookup is unnecessary.
 *
 * @param {object} payload - Match data from CreateMatchForm
 * @returns {Promise<object>} - Created match object
 */
export async function createMatch(payload) {
  const matchData = payload.match || payload;

  const rawLevel = matchData.skill_bracket || matchData.level;
  const level = normalizeLevel(rawLevel);

  const venueUuid = matchData.venue_id;
  if (!venueUuid) {
    throw new Error('Välj en plats/plan');
  }

  const startsAt = matchData.starts_at || (matchData.date && matchData.time ? `${matchData.date}T${matchData.time}:00` : null);
  if (!startsAt) {
    throw new Error('starts_at is required');
  }

  const backendPayload = {
    request_id: matchData.request_id || null,
    pitch_id: venueUuid,
    starts_at: startsAt,
    level,
    is_public: matchData.is_public !== false && !matchData.is_private,
    format: matchData.format || '5v5',
    max_players: matchData.is_spontaneous ? null : (matchData.max_players || 10),
    title: matchData.title || null,
    notes: matchData.notes || null,
    is_spontaneous: matchData.is_spontaneous || false
  };

  const result = await callEdgeFunction(EDGE.createMatch, backendPayload);
  track('match_created', {
    match_id: result?.match?.id || result?.id || null,
    venue_id: venueUuid,
    format: backendPayload.format,
    level,
    is_public: backendPayload.is_public,
    is_spontaneous: backendPayload.is_spontaneous,
    max_players: backendPayload.max_players,
  });
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
  const result = await callEdgeFunction(EDGE.joinMatch, { match_id: matchId });
  track('match_joined', { match_id: matchId });
  return result;
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
  track('match_left', { match_id: matchId });
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
  const result = await callEdgeFunction(EDGE.checkInMatch, {
    match_id: matchId,
    user_lat: userLat,
    user_lng: userLng
  });
  track('match_checked_in', { match_id: matchId });
  return result;
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
 * @param {number} [filters.limit=200] - Max rows to return
 * @param {number} [filters.offset=0] - Row offset for pagination
 */
export async function getPublicMatches(filters = {}) {
  const headers = await getAuthHeaders();
  const { status, limit = 200, offset = 0 } = filters;

  let queryParams = `select=*&order=starts_at.asc&limit=${limit}&offset=${offset}`;

  if (status === 'upcoming') {
    queryParams += '&status=eq.upcoming';
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/public_matches?${queryParams}`, {
    method: 'GET',
    headers
  });

  if (!res.ok) {
    const error = await res.text().catch(() => '');
    console.error('[matchesService] Failed to fetch public_matches:', res.status, error);
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }

  return res.json();
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

  const result = await callEdgeFunction(EDGE.finishMatch, payload);
  track('match_finished', { match_id: matchId, has_score: payload.home_score !== undefined });
  return result;
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
  const result = await callEdgeFunction(EDGE.deleteMatch, { match_id: matchId });
  track('match_deleted', { match_id: matchId });
  return result;
}

/**
 * Delete a match (admin) — tries Edge Function first, then falls back to
 * soft-delete via REST PATCH (sets status='cancelled' + deleted_at).
 * Match lists already filter by status.
 */
export async function deleteMatchRest(matchId) {
  if (!matchId) throw new Error('matchId is required');

  // Try edge function first
  try {
    const result = await callEdgeFunction(EDGE.deleteMatch, { match_id: matchId });
    return { ok: true, ...result };
  } catch (edgeError) {
    console.warn('[matchesService] Edge delete_match unavailable, trying REST:', edgeError.message);
  }

  const headers = await getAuthHeaders();

  // Try hard DELETE via REST
  const delRes = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?id=eq.${encodeURIComponent(matchId)}`,
    {
      method: 'DELETE',
      headers: { ...headers, 'Prefer': 'return=representation' }
    }
  );
  const delBody = await delRes.text().catch(() => '');
  if (delRes.ok) {
    let deleted = [];
    try { deleted = JSON.parse(delBody); } catch (_) {}
    if (Array.isArray(deleted) && deleted.length > 0) {
      return { ok: true, deleted };
    }
  }

  // Fallback: soft-delete via PATCH (set status='cancelled')
  console.warn('[matchesService] Hard DELETE blocked, trying soft-delete via PATCH');
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?id=eq.${encodeURIComponent(matchId)}`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        status: 'cancelled',
        deleted_at: new Date().toISOString(),
      })
    }
  );
  const patchBody = await patchRes.text().catch(() => '');
  if (!patchRes.ok) {
    throw new Error(`Kunde inte radera match: ${patchRes.status} ${patchBody}`);
  }
  let rows = [];
  try { rows = JSON.parse(patchBody); } catch (_) {}
  if (Array.isArray(rows) && rows.length === 0) {
    throw new Error('Ingen ändring gjordes. RLS blockerar DELETE/UPDATE för admin. Uppdatera RLS-policy för matches-tabellen.');
  }

  return { ok: true, soft_deleted: true };
}
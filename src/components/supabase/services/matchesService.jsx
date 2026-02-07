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
import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';
import { EDGE } from '../edgeNames';

// Dev mode check for console logging
const IS_DEV = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname.includes('base44'));

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
 * @param {object} payload - Match data
 * @param {string} payload.pitch_id - External venue ID (Base44 pitch ID)
 * @param {string} payload.starts_at - ISO datetime string
 * @param {string} payload.level - Skill level (beginner/intermediate/advanced/pro)
 * @param {boolean} payload.is_public - Whether match is public
 * @param {string} [payload.format] - Match format (5v5/7v7/11v11)
 * @param {number} [payload.max_players] - Max players (null for spontaneous)
 * @param {string} [payload.title] - Match title
 * @param {string} [payload.notes] - Additional notes
 * @param {boolean} [payload.is_spontaneous] - Whether match is spontaneous
 * @returns {Promise<{match_id: string, message: string}>} - Created match ID and message
 */
export async function createMatch(payload) {
  // Check if payload is wrapped in { match: ... } from CreateMatchForm
  const matchData = payload.match || payload;
  
  // Log incoming payload for debugging
  if (IS_DEV) {
    console.log('[matchesService] createMatch incoming:', { 
      hasMatchWrapper: !!payload.match,
      matchData 
    });
  }
  
  // Normalize level to valid DB value
  const rawLevel = matchData.skill_bracket || matchData.level;
  const level = normalizeLevel(rawLevel);
  
  // Get the venue UUID from frontend
  const venueUuid = matchData.venue_id || matchData.pitch_id;
  
  // Transform frontend format to backend format
  // venue_id = UUID (matches.venue_id uuid column)
  // pitch_id = text fallback (matches.pitch_id text NOT NULL column)
  const backendPayload = {
    request_id: matchData.request_id || null, // Idempotency key
    venue_id: venueUuid,
    pitch_id: String(venueUuid),
    starts_at: matchData.starts_at || (matchData.date && matchData.time ? `${matchData.date}T${matchData.time}:00` : null),
    level,
    is_public: matchData.is_public !== false && !matchData.is_private,
    format: matchData.format || '5v5',
    max_players: matchData.is_spontaneous ? null : (matchData.max_players || 10),
    title: matchData.title || null,
    notes: matchData.notes || null,
    is_spontaneous: matchData.is_spontaneous || false
  };
  
  // Log the full payload being sent to backend
  if (IS_DEV) {
    console.log('[matchesService] createMatch backendPayload:', JSON.stringify(backendPayload, null, 2));
  }
  
  // Validate required fields before sending
  if (!backendPayload.venue_id) {
    throw new Error('Venue/venue_id is required');
  }
  if (!backendPayload.starts_at) {
    throw new Error('starts_at is required');
  }
  
  // Edge Function returns { match_id, message } on success
  const result = await callEdgeFunction(EDGE.createMatch, backendPayload);
  if (IS_DEV) {
    console.log('[matchesService] createMatch result:', result);
  }
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
  return callEdgeFunction(EDGE.leaveMatch, { match_id: matchId });
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
  const config = await getSupabaseConfig();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
  }
  
  // Include auth token if authenticated (RLS will handle access)
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }
  
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
  if (!result) return [];
  if (Array.isArray(result)) return result;
  
  // If wrapped in { participants: [...] }
  if (result.participants && Array.isArray(result.participants)) {
    return result.participants;
  }
  
  // Log unexpected format
  if (IS_DEV) {
    console.warn('[matchesService] getMatchParticipants unexpected format:', {
      type: typeof result,
      isArray: Array.isArray(result),
      keys: Object.keys(result || {})
    });
  }
  
  return [];
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
 * Delete a match (organizer only)
 * 
 * @param {string} matchId - Match UUID
 */
export async function deleteMatch(matchId) {
  if (!matchId) {
    throw new Error('matchId is required');
  }
  return callEdgeFunction(EDGE.deleteMatch, { match_id: matchId });
}
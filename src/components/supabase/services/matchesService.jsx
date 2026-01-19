/**
 * Matches Service
 * 
 * All match-related operations using Supabase Edge Functions and REST API.
 */

import { callEdgeFunction, callPublicEdgeFunction } from '../callEdgeFunction';
import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

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
 */
export async function createMatch(payload) {
  // Normalize level to valid DB value
  const rawLevel = payload.skill_bracket || payload.level;
  const level = normalizeLevel(rawLevel);
  
  // Transform frontend format to backend format
  const backendPayload = {
    pitch_id: payload.venue_id || payload.pitch_id,
    starts_at: payload.starts_at || `${payload.date}T${payload.time}:00`,
    level,
    is_public: payload.is_public !== false && !payload.is_private,
    format: payload.format || '5v5',
    max_players: payload.is_spontaneous ? null : (payload.max_players || 10),
    title: payload.title || null,
    notes: payload.notes || null,
    is_spontaneous: payload.is_spontaneous || false
  };
  
  console.log('[matchesService] createMatch payload:', { rawLevel, normalizedLevel: level });
  
  return callEdgeFunction('create_match', backendPayload);
}

// Export for use in other components
export { VALID_LEVELS, LEVEL_MAP, normalizeLevel };

/**
 * Join a match
 * 
 * @param {string} matchId - Match UUID
 */
export async function joinMatch(matchId) {
  return callEdgeFunction('join_match', { match_id: matchId });
}

/**
 * Leave a match
 * 
 * @param {string} matchId - Match UUID
 */
export async function leaveMatch(matchId) {
  return callEdgeFunction('leave_match', { match_id: matchId });
}

/**
 * Check in to a match (location verified)
 * 
 * @param {string} matchId - Match UUID
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 */
export async function checkInMatch(matchId, userLat, userLng) {
  return callEdgeFunction('check_in_match', {
    match_id: matchId,
    user_lat: userLat,
    user_lng: userLng
  });
}

/**
 * Get public matches feed (guest allowed)
 * Reads from public_matches view via REST API
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
  
  // Build query params for public_matches VIEW
  let queryParams = 'select=*&order=starts_at.asc';
  
  if (filters.status === 'upcoming') {
    queryParams += '&status=eq.upcoming';
  }
  
  // Only show public matches or include private if user has access
  if (!sessionStore.isAuthenticated) {
    queryParams += '&is_public=eq.true';
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
  
  const matches = await res.json();
  console.log('[matchesService] Fetched', matches.length, 'matches from public_matches view');
  
  return matches;
}

/**
 * Get match details
 * 
 * @param {string} matchId - Match UUID
 */
export async function getMatchDetails(matchId) {
  return callPublicEdgeFunction('get_match_details', { match_id: matchId });
}

/**
 * Get current user's participation in a match
 * 
 * @param {string} matchId - Match UUID
 */
export async function getMyParticipation(matchId) {
  if (!sessionStore.isAuthenticated) {
    return null;
  }
  
  try {
    return await callEdgeFunction('my_participation', { match_id: matchId });
  } catch (e) {
    console.error('[matchesService] Failed to get participation:', e);
    return null;
  }
}

/**
 * Get match participants
 * 
 * @param {string} matchId - Match UUID
 */
export async function getMatchParticipants(matchId) {
  return callPublicEdgeFunction('get_match_participants', { match_id: matchId });
}
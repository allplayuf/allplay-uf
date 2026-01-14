/**
 * Supabase Match Service
 * 
 * All match operations go through Supabase RPC functions.
 * Direct table writes are blocked by RLS.
 */

import { sessionStore } from './client';

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';

// Cache for anon key
let cachedAnonKey = null;

/**
 * Get Supabase anon key (cached)
 */
async function getAnonKey() {
  if (cachedAnonKey) return cachedAnonKey;
  
  try {
    const { base44 } = await import('@/api/base44Client');
    const response = await base44.functions.invoke('getSupabaseConfig');
    if (response?.data?.anonKey) {
      cachedAnonKey = response.data.anonKey;
      return cachedAnonKey;
    }
  } catch (e) {
    console.error('Failed to get anon key:', e);
  }
  return null;
}

/**
 * Helper to call Supabase RPC functions
 */
async function callRpc(functionName, params = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const anonKey = await getAnonKey();
  if (anonKey) {
    headers['apikey'] = anonKey;
  }

  // Add auth token if authenticated
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `RPC error: ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Read public matches from view (guest allowed)
 * CRITICAL: Uses public_matches view, NOT matches table directly
 */
export async function getPublicMatches(filters = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const anonKey = await getAnonKey();
  if (anonKey) {
    headers['apikey'] = anonKey;
  }

  // Build query params - read from public_matches VIEW
  let queryParams = 'select=*&order=starts_at.asc';
  
  // Filter by status if specified
  if (filters.status === 'upcoming') {
    queryParams += `&status=eq.upcoming`;
  }

  // IMPORTANT: Call /rest/v1/public_matches (the VIEW), NOT /rest/v1/matches
  const res = await fetch(`${SUPABASE_URL}/rest/v1/public_matches?${queryParams}`, {
    method: 'GET',
    headers
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error('Failed to fetch public_matches:', res.status, errorText);
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }

  const matches = await res.json();
  console.log('[matchService] Fetched from public_matches view:', matches.length, 'matches');
  return matches;
}

/**
 * Get match details (authenticated only for full data)
 */
export async function getMatchDetails(matchId) {
  if (!sessionStore.isAuthenticated) {
    throw new Error('Authentication required');
  }
  return callRpc('get_match_details', { p_match_id: matchId });
}

/**
 * Get current user's participation status in a match
 */
export async function getMyParticipation(matchId) {
  if (!sessionStore.isAuthenticated) {
    return null;
  }
  return callRpc('my_participation', { p_match_id: matchId });
}

/**
 * Upsert venue before creating match
 * This ensures the venue exists in Supabase with the external_id mapping
 */
export async function upsertVenue(venue) {
  if (!venue || !venue.id) {
    console.warn('[matchService] No venue to upsert');
    return null;
  }

  console.log('[matchService] Upserting venue:', venue.id, venue.name);
  
  return callRpc('upsert_venue', {
    p_external_id: venue.id,  // Base44 pitch ID (text like "68db...")
    p_name: venue.name || 'Okänd plan',
    p_city: venue.city || null,
    p_address: venue.address || null,
    p_lat: venue.latitude || venue.lat || null,
    p_lng: venue.longitude || venue.lng || null
  });
}

/**
 * Create a new match (authenticated only)
 * IMPORTANT: venue_id is the external_id (Base44 pitch ID), NOT a UUID
 */
export async function createMatch(matchData, venue = null) {
  if (!sessionStore.isAuthenticated) {
    throw new Error('Du måste vara inloggad för att skapa en match');
  }

  // Upsert venue first if provided
  if (venue) {
    try {
      await upsertVenue(venue);
    } catch (e) {
      console.warn('[matchService] Venue upsert failed (may already exist):', e.message);
    }
  }

  console.log('[matchService] Creating match with venue_id:', matchData.venue_id);

  return callRpc('create_match', {
    p_venue_id: matchData.venue_id,  // external_id (text)
    p_starts_at: `${matchData.date}T${matchData.time}:00`,
    p_level: matchData.skill_bracket || 'mixed',
    p_is_public: !matchData.is_private,
    p_format: matchData.format,
    p_max_players: matchData.is_spontaneous ? null : matchData.max_players,
    p_title: matchData.title,
    p_notes: matchData.notes || null,
    p_is_spontaneous: matchData.is_spontaneous || false
  });
}

/**
 * Join a match (authenticated only)
 */
export async function joinMatch(matchId) {
  if (!sessionStore.isAuthenticated) {
    throw new Error('Du måste vara inloggad för att gå med i en match');
  }

  return callRpc('join_match', { p_match_id: matchId });
}

/**
 * Leave a match (authenticated only)
 */
export async function leaveMatch(matchId) {
  if (!sessionStore.isAuthenticated) {
    throw new Error('Du måste vara inloggad för att lämna en match');
  }

  return callRpc('leave_match', { p_match_id: matchId });
}

/**
 * Check in to a match with location verification (authenticated only)
 */
export async function checkInMatch(matchId, userLat, userLng) {
  if (!sessionStore.isAuthenticated) {
    throw new Error('Du måste vara inloggad för att checka in');
  }

  return callRpc('check_in_match_500m', {
    p_match_id: matchId,
    p_user_lat: userLat,
    p_user_lng: userLng
  });
}

/**
 * Check if user can check in to a match
 */
export async function canCheckIn(matchId) {
  if (!sessionStore.isAuthenticated) {
    return false;
  }

  try {
    const result = await callRpc('can_check_in', { p_match_id: matchId });
    return result === true;
  } catch (e) {
    console.error('canCheckIn error:', e);
    return false;
  }
}

/**
 * Check if user is a guest (not authenticated)
 */
export function isGuest() {
  return !sessionStore.isAuthenticated;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return sessionStore.isAuthenticated;
}
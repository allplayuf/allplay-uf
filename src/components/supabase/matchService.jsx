/**
 * Supabase Match Service
 * 
 * All match operations go through Supabase RPC functions.
 * Direct table writes are blocked by RLS.
 */

import { supabaseClient, sessionStore } from './client';

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';

/**
 * Helper to call Supabase RPC functions
 */
async function callRpc(functionName, params = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Get anon key
  try {
    const { base44 } = await import('@/api/base44Client');
    const response = await base44.functions.invoke('getSupabaseConfig');
    if (response?.data?.anonKey) {
      headers['apikey'] = response.data.anonKey;
    }
  } catch (e) {
    console.error('Failed to get anon key:', e);
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
 */
export async function getPublicMatches(filters = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const { base44 } = await import('@/api/base44Client');
    const response = await base44.functions.invoke('getSupabaseConfig');
    if (response?.data?.anonKey) {
      headers['apikey'] = response.data.anonKey;
    }
  } catch (e) {
    console.error('Failed to get anon key:', e);
  }

  // Build query params
  let queryParams = 'select=*&order=starts_at.asc';
  
  // Filter upcoming matches only
  if (filters.status === 'upcoming') {
    queryParams += `&status=eq.upcoming`;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/public_matches?${queryParams}`, {
    method: 'GET',
    headers
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }

  return await res.json();
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
 * Create a new match (authenticated only)
 */
export async function createMatch(matchData) {
  if (!sessionStore.isAuthenticated) {
    throw new Error('Du måste vara inloggad för att skapa en match');
  }

  return callRpc('create_match', {
    p_venue_id: matchData.venue_id,
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
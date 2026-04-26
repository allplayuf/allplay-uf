/**
 * Matches Queries Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - Pure read operations via REST API
 * - No frontend authorization checks
 */

import { getAuthHeaders, SUPABASE_URL } from '../config';
import { waitForAuth } from '../client';

/**
 * Get matches by IDs
 * @param {string[]} ids - Array of match IDs
 */
export async function getMatchesByIds(ids) {
  if (!ids || ids.length === 0) return [];

  const headers = await getAuthHeaders();
  
  try {
    const idsParam = `(${ids.join(',')})`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/public_matches?id=in.${idsParam}&select=*`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch matches: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    console.error('[matchesQueries] Failed to fetch matches by IDs:', e);
    return [];
  }
}

/**
 * Get user's matches (matches they are actively participating in).
 * Single embedded REST call: match_players → matches → venues.
 *
 * @param {string} userId - User ID
 * @param {string} status - Filter by match status (optional: 'upcoming', 'finished')
 */
export async function getMyMatches(userId, status = null) {
  if (!userId) return [];

  await waitForAuth();
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_players?user_id=eq.${userId}&status=in.(joined,checked_in)&select=match:matches(*,venue:venues(id,external_id,name,address,city,lat,lng))`,
      { method: 'GET', headers }
    );

    if (!res.ok) throw new Error(`Failed to fetch my matches: ${res.status}`);

    const rows = await res.json();

    let matches = rows
      .map(row => row.match)
      .filter(Boolean)
      .map(m => ({
        ...m,
        venue_external_id: m.venue?.external_id ?? null,
        venue_name: m.venue?.name ?? null,
        venue_city: m.venue?.city ?? null,
        venue_address: m.venue?.address ?? null,
        venue_lat: m.venue?.lat ?? null,
        venue_lng: m.venue?.lng ?? null,
      }));

    if (status) {
      matches = matches.filter(m => m.status === status);
    }

    matches.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

    return matches;
  } catch (e) {
    console.error('[matchesQueries] Failed to fetch my matches:', e);
    return [];
  }
}

/**
 * Get completed matches for user
 * IMPORTANT: Supabase uses 'finished' status, not 'completed'
 * 
 * @param {string} userId - User ID
 */
export async function getCompletedMatches(userId) {
  return getMyMatches(userId, 'finished');
}

/**
 * Transform match data from Supabase view format to app format
 * @param {object} match - Match from public_matches view
 */
export function transformMatchData(match) {
  if (!match) return null;
  
  return {
    ...match,
    date: match.starts_at ? match.starts_at.split('T')[0] : null,
    time: match.starts_at ? match.starts_at.split('T')[1]?.substring(0, 5) : null,
    skill_bracket: match.level || 'mixed',
    venue_id: match.venue_id,
    venue_external_id: match.venue_external_id,
    _venue_name: match.venue_name,
    _venue_city: match.venue_city,
    _venue_address: match.venue_address,
    _venue_lat: match.venue_lat,
    _venue_lng: match.venue_lng,
    // Map 'finished' to 'completed' for UI consistency
    status: match.status === 'finished' ? 'completed' : match.status
  };
}
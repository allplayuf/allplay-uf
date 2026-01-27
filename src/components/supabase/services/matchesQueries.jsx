/**
 * Matches Queries Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - Pure read operations via REST API
 * - No frontend authorization checks
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

/**
 * Get matches by IDs
 * @param {string[]} ids - Array of match IDs
 */
export async function getMatchesByIds(ids) {
  if (!ids || ids.length === 0) {
    return [];
  }

  const config = await getSupabaseConfig();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
  }
  
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }
  
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
 * Get user's matches (matches they created or are participating in)
 * Uses match_participants to find user's matches
 * 
 * @param {string} userId - User ID
 * @param {string} status - Filter by status (optional: 'upcoming', 'finished')
 */
export async function getMyMatches(userId, status = null) {
  if (!userId) {
    return [];
  }

  const config = await getSupabaseConfig();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
  }
  
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }
  
  try {
    // First get user's participant match IDs
    const participantRes = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?user_id=eq.${userId}&select=match_id`,
      { method: 'GET', headers }
    );
    
    if (!participantRes.ok) {
      throw new Error(`Failed to fetch participant match IDs: ${participantRes.status}`);
    }
    
    const participantData = await participantRes.json();
    const matchIds = participantData.map(p => p.match_id);
    
    if (matchIds.length === 0) {
      return [];
    }
    
    // Now fetch matches
    let query = `${SUPABASE_URL}/rest/v1/public_matches?id=in.(${matchIds.join(',')})&select=*&order=starts_at.asc`;
    
    if (status) {
      query += `&status=eq.${status}`;
    }
    
    const matchesRes = await fetch(query, { method: 'GET', headers });
    
    if (!matchesRes.ok) {
      throw new Error(`Failed to fetch matches: ${matchesRes.status}`);
    }
    
    return await matchesRes.json();
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
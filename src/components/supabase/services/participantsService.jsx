/**
 * Participants Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All reads use REST API with RLS enforcement
 * - No frontend authorization checks
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

/**
 * Get current user's participant match IDs
 * Returns array of match_ids the user is registered for
 */
export async function getMyParticipantMatchIds() {
  if (!sessionStore.user?.id) {
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
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?user_id=eq.${sessionStore.user.id}&select=match_id`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch participant match IDs: ${res.status}`);
    }
    
    const data = await res.json();
    return data.map(p => p.match_id);
  } catch (e) {
    console.error('[participantsService] Failed to fetch participant match IDs:', e);
    return [];
  }
}

/**
 * Get participants for multiple matches
 * @param {string[]} matchIds - Array of match IDs
 */
export async function getParticipantsForMatches(matchIds) {
  if (!matchIds || matchIds.length === 0) {
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
    const idsParam = `(${matchIds.join(',')})`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?match_id=in.${idsParam}&select=*`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch participants: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    console.error('[participantsService] Failed to fetch participants:', e);
    return [];
  }
}

/**
 * Get all participants (for compatibility during migration)
 * Returns all participants visible to the user based on RLS
 */
export async function getAllParticipants() {
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
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?select=*`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch all participants: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    console.error('[participantsService] Failed to fetch all participants:', e);
    return [];
  }
}
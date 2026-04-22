/**
 * Participants Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All reads use REST API with RLS enforcement
 * - No frontend authorization checks
 * - Participants enriched with public user data from cache
 */

import { getAuthHeaders, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';
import { fetchUsersMissing } from './userCache';

// Statuses that mean the user is NO LONGER in the match.
// Backend soft-deletes via status change instead of row removal.
const INACTIVE_STATUSES = new Set(['left', 'cancelled', 'removed', 'kicked', 'no_show']);

function isActiveParticipant(p) {
  const status = (p?.status || '').toLowerCase();
  if (!status) return true; // no status field → treat as active
  return !INACTIVE_STATUSES.has(status);
}

/**
 * Get current user's participant match IDs
 * Returns array of match_ids the user is registered for
 */
export async function getMyParticipantMatchIds() {
  await waitForAuth();
  if (!sessionStore.user?.id) return [];

  const headers = await getAuthHeaders();
  
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?user_id=eq.${sessionStore.user.id}&select=match_id,status`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch participant match IDs: ${res.status}`);
    }
    
    const data = await res.json();
    // Filter out matches the user has left/been removed from
    return data.filter(isActiveParticipant).map(p => p.match_id);
  } catch (e) {
    console.error('[participantsService] Failed to fetch participant match IDs:', e);
    return [];
  }
}

/**
 * Get participants for multiple matches
 * Enriches with public user data from cache
 * @param {string[]} matchIds - Array of match IDs
 * @returns {Promise<Array>} Participants with user data
 */
export async function getParticipantsForMatches(matchIds) {
  if (!matchIds || matchIds.length === 0) return [];

  const headers = await getAuthHeaders();
  
  try {
    const idsParam = `(${matchIds.join(',')})`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?match_id=in.${idsParam}&select=*`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch participants: ${res.status}`);
    }
    
    const participantsRaw = await res.json();
    // Exclude users that have left/been removed
    const participants = participantsRaw.filter(isActiveParticipant);
    
    // Bulk-fetch user data for all participants
    const userIds = [...new Set(participants.map(p => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      await fetchUsersMissing(userIds);
    }
    
    return participants;
  } catch (e) {
    console.error('[participantsService] Failed to fetch participants:', e);
    return [];
  }
}

/**
 * Get all participants (for compatibility during migration)
 * Returns all participants visible to the user based on RLS
 * Enriches with public user data from cache
 */
export async function getAllParticipants() {
  const headers = await getAuthHeaders();
  
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/match_participants?select=*`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch all participants: ${res.status}`);
    }
    
    const participantsRaw = await res.json();
    const participants = participantsRaw.filter(isActiveParticipant);
    
    // Bulk-fetch user data for all participants
    const userIds = [...new Set(participants.map(p => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      await fetchUsersMissing(userIds);
    }
    
    return participants;
  } catch (e) {
    console.error('[participantsService] Failed to fetch all participants:', e);
    return [];
  }
}
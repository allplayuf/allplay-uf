/**
 * Users Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All reads use REST API with RLS enforcement
 * - No frontend authorization checks
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';
import { callEdgeFunction } from '../callEdgeFunction';
import { EDGE } from '../edgeNames';
import { primeUsers } from './userCache';

/**
 * Fetch users directly from Supabase REST API (fallback when Edge Function fails).
 * Uses select=* and falls back to safe columns if the view rejects unknown columns.
 */
async function fetchUsersViaRest(ids) {
  if (!ids || ids.length === 0) return [];
  
  const config = await getSupabaseConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (config.anonKey) headers['apikey'] = config.anonKey;
  if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  
  const idsParam = `(${ids.join(',')})`;
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=*`,
    { method: 'GET', headers }
  );
  
  // If select=* fails (old view without aliases), retry with guaranteed columns
  if (res.status === 400) {
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=id,full_name,username,avatar_url,elo_rating`,
      { method: 'GET', headers }
    );
  }
  
  if (!res.ok) throw new Error(`REST users fetch failed: ${res.status}`);
  return await res.json();
}

/**
 * Get current user's profile from Supabase users table
 * Uses the auth user ID from session
 */
export async function getMyProfile() {
  if (!sessionStore.user?.id) {
    return null;
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
      `${SUPABASE_URL}/rest/v1/users?id=eq.${sessionStore.user.id}&select=*`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch profile: ${res.status}`);
    }
    
    const data = await res.json();
    return data?.[0] || null;
  } catch (e) {
    console.error('[usersService] Failed to fetch profile:', e);
    return null;
  }
}

/**
 * Get users by IDs (public data only)
 * Uses edge function to get normalized public user data
 * @param {string[]} ids - Array of user IDs
 */
export async function getUsersByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const normalize = (user) => ({
    id: user.id,
    full_name: user.full_name || user.username || 'Okänd användare',
    username: user.username || null,
    display_name: user.display_name || user.full_name || user.username || 'Okänd användare',
    avatar_url: user.avatar_url || user.profile_image_url || null,
    profile_image_url: user.profile_image_url || user.avatar_url || null,
    city: user.city || null,
    skill_level: user.skill_level || null,
    matches_played: user.matches_played || 0,
    mvp_count: user.mvp_count || 0,
    elo_rating: user.elo_rating || user.elo || null
  });

  // Try Edge Function first
  try {
    const result = await callEdgeFunction(EDGE.getUsersByIds, { user_ids: ids });
    const users = result?.users || [];
    if (users.length > 0) {
      return users.map(normalize);
    }
  } catch (e) {
    console.warn('[usersService] Edge function failed, trying REST fallback:', e.message);
  }

  // Fallback: fetch directly from Supabase REST API
  try {
    const users = await fetchUsersViaRest(ids);
    if (users.length > 0) {
      return users.map(normalize);
    }
  } catch (e) {
    console.error('[usersService] REST fallback also failed:', e.message);
  }

  // Last resort: return minimal fallback
  return ids.map(id => normalize({ id }));
}

/**
 * Get user by ID
 * @param {string} id - User ID
 */
export async function getUserById(id) {
  if (!id) return null;
  
  const users = await getUsersByIds([id]);
  return users?.[0] || null;
}

/**
 * Update current user's profile
 * @param {object} data - Profile data { full_name, username, avatar_url }
 * @returns {Promise<{ok: boolean, user?: object, error?: object}>}
 */
export async function updateProfile(data) {
  const { full_name, username, avatar_url } = data;
  
  if (!full_name && !username && !avatar_url) {
    throw new Error('Minst ett fält måste uppdateras');
  }
  
  try {
    const result = await callEdgeFunction(EDGE.updateProfile, {
      full_name: full_name || undefined,
      username: username || undefined,
      avatar_url: avatar_url || undefined
    });
    
    // Prime cache with updated user
    if (result.ok && result.user) {
      primeUsers([result.user]);
    }
    
    return result;
  } catch (error) {
    console.error('[usersService] Failed to update profile:', error);
    throw error;
  }
}
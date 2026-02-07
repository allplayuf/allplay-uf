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

  try {
    const result = await callEdgeFunction(EDGE.getUsersByIds, { user_ids: ids });
    const users = result?.users || [];
    
    // Normalize user shape for frontend consistency
    return users.map(user => ({
      id: user.id,
      full_name: user.full_name || user.username || 'Okänd användare',
      display_name: user.display_name || user.username || user.full_name || 'Okänd användare',
      profile_image_url: user.profile_image_url || user.avatar_url || null,
      city: user.city || null,
      skill_level: user.skill_level || null,
      matches_played: user.matches_played || 0,
      mvp_count: user.mvp_count || 0,
      elo_rating: user.elo_rating || null
    }));
  } catch (e) {
    console.error('[usersService] Failed to fetch users:', e);
    // Return minimal fallback users
    return ids.map(id => ({
      id,
      full_name: 'Okänd användare',
      display_name: 'Okänd användare',
      profile_image_url: null,
      city: null,
      skill_level: null,
      matches_played: 0,
      mvp_count: 0,
      elo_rating: null
    }));
  }
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
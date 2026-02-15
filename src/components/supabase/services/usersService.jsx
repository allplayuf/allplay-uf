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
  const safeColumns = 'id,full_name,username,display_name,avatar_url,profile_image_url,bio,city,skill_level,birth_year,elo_rating,matches_played,mvp_count,is_admin';
  
  // Use known-safe columns (avoids 400 from unknown columns in view)
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=${safeColumns}`,
    { method: 'GET', headers }
  );
  
  // Retry with minimal columns if safe set fails
  if (res.status === 400) {
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=id,full_name,username,avatar_url`,
      { method: 'GET', headers }
    );
  }
  
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`REST users fetch failed: ${res.status} – ${body.slice(0, 200)}`);
  }
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
  
  const safeColumns = 'id,full_name,username,display_name,avatar_url,profile_image_url,bio,city,skill_level,birth_year,elo_rating,matches_played,mvp_count,is_admin,current_streak';
  
  try {
    let res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${sessionStore.user.id}&select=${safeColumns}`,
      { method: 'GET', headers }
    );
    
    // Retry with minimal columns if safe set fails (column doesn't exist in view)
    if (res.status === 400) {
      console.warn('[usersService] getMyProfile safe columns failed, retrying with minimal');
      res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${sessionStore.user.id}&select=id,full_name,username,avatar_url`,
        { method: 'GET', headers }
      );
    }
    
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[usersService] getMyProfile failed:', res.status, body.slice(0, 200));
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
    bio: user.bio || null,
    city: user.city || null,
    skill_level: user.skill_level || null,
    birth_year: user.birth_year || null,
    matches_played: user.matches_played || 0,
    mvp_count: user.mvp_count || 0,
    elo_rating: user.elo_rating || user.elo || null
  });

  // Try Edge Function first (may fail with CORS)
  try {
    const result = await callEdgeFunction(EDGE.getUsersByIds, { user_ids: ids });
    const users = result?.users || [];
    if (users.length > 0) {
      return users.map(normalize);
    }
  } catch (e) {
    console.warn('[usersService] Edge function failed (status:', e.status, ', network:', e.isNetworkError, '):', e.message);
  }

  // Fallback: fetch directly from Supabase REST API
  try {
    const users = await fetchUsersViaRest(ids);
    if (users.length > 0) {
      console.log('[usersService] REST fallback returned', users.length, 'users');
      return users.map(normalize);
    }
  } catch (e) {
    console.warn('[usersService] REST fallback also failed:', e.message);
  }

  // Last resort: return fallback objects so UI never breaks
  console.warn('[usersService] All user fetch methods failed, returning fallbacks for', ids.length, 'users');
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
 * Supports all profile fields: full_name, username, avatar_url, bio, skill_level, city, birth_year
 * @param {object} data - Profile data to update (only include changed fields)
 * @returns {Promise<{ok: boolean, user?: object, error?: object}>}
 */
export async function updateProfile(data) {
  // Filter out undefined values, keep nulls (explicit removal)
  const payload = {};
  // SECURITY: is_admin is intentionally excluded - it can only be set via DB
  const ALLOWED_FIELDS = ['full_name', 'username', 'avatar_url', 'bio', 'skill_level', 'city', 'birth_year'];
  
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) {
      payload[key] = data[key];
    }
  }
  
  if (Object.keys(payload).length === 0) {
    throw new Error('Minst ett fält måste uppdateras');
  }
  
  try {
    const result = await callEdgeFunction(EDGE.updateProfile, payload);
    
    // Prime cache with updated user
    if (result?.ok !== false && result?.user) {
      primeUsers([result.user]);
    }
    
    return result;
  } catch (error) {
    console.error('[usersService] Failed to update profile:', error);
    throw error;
  }
}
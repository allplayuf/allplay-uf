/**
 * Users Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All reads use REST API with RLS enforcement
 * - No frontend authorization checks
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

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
 * Get users by IDs
 * @param {string[]} ids - Array of user IDs
 */
export async function getUsersByIds(ids) {
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
      `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=*`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    console.error('[usersService] Failed to fetch users:', e);
    return [];
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
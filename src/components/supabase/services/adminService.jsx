/**
 * Admin Service
 * 
 * SINGLE SOURCE OF TRUTH for admin status in the frontend.
 * 
 * Reads `is_admin` from `public.users` table via Supabase REST API.
 * This field can only be set via SQL / service role — never by the client.
 * 
 * SQL to grant admin (run in Supabase SQL editor):
 * 
 *   UPDATE public.users
 *   SET is_admin = true
 *   WHERE id = (
 *     SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
 *   );
 * 
 * RLS: The `users` view/table must allow users to read their own `is_admin`.
 * The column is NOT in ALLOWED_FIELDS for updateProfile, so clients cannot write it.
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

// In-memory cache to avoid redundant fetches within the same session
let _cachedIsAdmin = null;
let _cachedForUserId = null;

/**
 * Check if the currently authenticated user is an admin.
 * Queries `public.users.is_admin` directly — no Edge Function dependency.
 * 
 * @param {object} options
 * @param {boolean} [options.forceRefresh=false] - Bypass cache and re-query DB
 * @returns {Promise<boolean>}
 */
export async function checkIsAdmin({ forceRefresh = false } = {}) {
  const userId = sessionStore.user?.id;
  
  if (!userId || !sessionStore.accessToken) {
    console.log('[adminService] No authenticated user, returning false');
    _cachedIsAdmin = false;
    _cachedForUserId = null;
    return false;
  }
  
  // Return cached value if same user and not forcing refresh
  if (!forceRefresh && _cachedForUserId === userId && _cachedIsAdmin !== null) {
    return _cachedIsAdmin;
  }
  
  try {
    const config = await getSupabaseConfig();
    
    const headers = {
      'Content-Type': 'application/json',
    };
    if (config.anonKey) headers['apikey'] = config.anonKey;
    if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
    
    // Only select is_admin — minimal query, fast
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=is_admin`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[adminService] checkIsAdmin failed: status=${res.status}, body=${body.slice(0, 200)}`);
      // Don't cache errors — allow retry
      return _cachedIsAdmin ?? false;
    }
    
    const rows = await res.json();
    const isAdmin = rows?.[0]?.is_admin === true;
    
    // Cache result
    _cachedIsAdmin = isAdmin;
    _cachedForUserId = userId;
    
    console.log(`[adminService] checkIsAdmin for ${userId}: ${isAdmin}`);
    return isAdmin;
  } catch (e) {
    console.error('[adminService] checkIsAdmin error:', e.message);
    return _cachedIsAdmin ?? false;
  }
}

/**
 * Clear the admin cache (call on logout or user switch)
 */
export function clearAdminCache() {
  _cachedIsAdmin = null;
  _cachedForUserId = null;
}

/**
 * Get cached admin status synchronously (for immediate UI rendering).
 * Returns null if not yet checked.
 */
export function getCachedAdminStatus() {
  if (_cachedForUserId === sessionStore.user?.id) {
    return _cachedIsAdmin;
  }
  return null;
}
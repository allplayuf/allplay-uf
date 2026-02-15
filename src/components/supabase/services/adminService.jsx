/**
 * Admin Service
 * 
 * SINGLE SOURCE OF TRUTH for admin status in the frontend.
 * 
 * Reads from `public.user_roles` table via Supabase REST API.
 * A user is admin iff a row (user_id, role='admin') exists.
 * 
 * This table can only be written via SQL / service role — never by the client.
 * RLS policy: authenticated users can SELECT their own rows only.
 * 
 * ── SQL to create the table (run once in Supabase SQL editor) ──
 * 
 *   CREATE TABLE IF NOT EXISTS public.user_roles (
 *     user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *     role    text NOT NULL,
 *     created_at timestamptz NOT NULL DEFAULT now(),
 *     PRIMARY KEY (user_id, role)
 *   );
 * 
 *   ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
 * 
 *   CREATE POLICY "Users can read own roles"
 *     ON public.user_roles FOR SELECT
 *     USING (user_id = auth.uid());
 * 
 * ── SQL to grant admin for an email ──
 * 
 *   INSERT INTO public.user_roles (user_id, role)
 *   VALUES (
 *     (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'),
 *     'admin'
 *   )
 *   ON CONFLICT DO NOTHING;
 * 
 * ── SQL to revoke admin ──
 * 
 *   DELETE FROM public.user_roles
 *   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com')
 *     AND role = 'admin';
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

// In-memory cache to avoid redundant fetches within the same session
let _cachedIsAdmin = null;
let _cachedForUserId = null;

/**
 * Check if the currently authenticated user is an admin.
 * Queries `public.user_roles` for a row with role='admin'.
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
    console.log(`[adminService] Returning cached admin=${_cachedIsAdmin} for ${userId}`);
    return _cachedIsAdmin;
  }
  
  try {
    const config = await getSupabaseConfig();
    
    const headers = {
      'Content-Type': 'application/json',
    };
    if (config.anonKey) headers['apikey'] = config.anonKey;
    if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
    
    // Query: SELECT 1 FROM public.user_roles WHERE user_id=<uid> AND role='admin' LIMIT 1
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=user_id&limit=1`,
      { method: 'GET', headers }
    );
    
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[adminService] checkIsAdmin failed: status=${res.status}, body=${body.slice(0, 200)}`);
      // Don't cache errors — allow retry
      return _cachedIsAdmin ?? false;
    }
    
    const rows = await res.json();
    const isAdmin = Array.isArray(rows) && rows.length > 0;
    
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
  console.log('[adminService] Cache cleared');
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
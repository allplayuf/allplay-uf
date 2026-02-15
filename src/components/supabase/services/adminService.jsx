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
// Hardcoded admin emails that always get admin access
const ADMIN_EMAILS = ['allplayuf@gmail.se'];

export async function checkIsAdmin({ forceRefresh = false } = {}) {
  const userId = sessionStore.user?.id;
  const userEmail = sessionStore.user?.email;
  
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

  // 1. Check hardcoded admin emails first
  if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    console.log(`[adminService] ${userEmail} is hardcoded admin`);
    _cachedIsAdmin = true;
    _cachedForUserId = userId;
    return true;
  }

  // 2. Check roles from session (populated by /me endpoint)
  if (sessionStore.roles && sessionStore.roles.includes('admin')) {
    console.log(`[adminService] User has admin in session roles`);
    _cachedIsAdmin = true;
    _cachedForUserId = userId;
    return true;
  }

  // 3. Try user_roles table as additional source
  try {
    const config = await getSupabaseConfig();
    
    const headers = {
      'Content-Type': 'application/json',
    };
    if (config.anonKey) headers['apikey'] = config.anonKey;
    if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
    
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=user_id&limit=1`,
      { method: 'GET', headers }
    );
    
    if (res.ok) {
      const rows = await res.json();
      const isAdmin = Array.isArray(rows) && rows.length > 0;
      _cachedIsAdmin = isAdmin;
      _cachedForUserId = userId;
      console.log(`[adminService] checkIsAdmin via user_roles for ${userId}: ${isAdmin}`);
      return isAdmin;
    } else {
      // Table might not exist yet — that's OK, fall through
      console.log(`[adminService] user_roles query failed (table may not exist), status=${res.status}`);
    }
  } catch (e) {
    console.log('[adminService] user_roles check error (non-fatal):', e.message);
  }
  
  // 4. Not admin
  _cachedIsAdmin = false;
  _cachedForUserId = userId;
  console.log(`[adminService] checkIsAdmin for ${userId}: false`);
  return false;
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
/**
 * Admin Service
 * 
 * Reads is_admin from public.users table (no user_roles table needed).
 * Caches result per user session.
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';

let _cachedIsAdmin = null;
let _cachedForUserId = null;

const ADMIN_EMAILS = ['allplayuf@gmail.se'];

export async function checkIsAdmin({ forceRefresh = false } = {}) {
  await waitForAuth();
  
  const userId = sessionStore.user?.id;
  const userEmail = sessionStore.user?.email;

  if (!userId || !sessionStore.accessToken) {
    _cachedIsAdmin = false;
    _cachedForUserId = null;
    return false;
  }

  if (!forceRefresh && _cachedForUserId === userId && _cachedIsAdmin !== null) {
    return _cachedIsAdmin;
  }

  // 1. Hardcoded admin emails
  if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    _cachedIsAdmin = true;
    _cachedForUserId = userId;
    return true;
  }

  // 2. Session roles (from /me endpoint)
  if (sessionStore.roles && sessionStore.roles.includes('admin')) {
    _cachedIsAdmin = true;
    _cachedForUserId = userId;
    return true;
  }

  // 3. Check is_admin column on public.users
  try {
    const config = await getSupabaseConfig();
    const headers = { 'Content-Type': 'application/json' };
    if (config.anonKey) headers['apikey'] = config.anonKey;
    if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=is_admin&limit=1`,
      { method: 'GET', headers }
    );

    if (res.ok) {
      const rows = await res.json();
      const isAdmin = Array.isArray(rows) && rows.length > 0 && rows[0].is_admin === true;
      _cachedIsAdmin = isAdmin;
      _cachedForUserId = userId;
      return isAdmin;
    }
  } catch (e) {
    console.warn('[adminService] is_admin check failed (non-fatal):', e.message);
  }

  _cachedIsAdmin = false;
  _cachedForUserId = userId;
  return false;
}

export function clearAdminCache() {
  _cachedIsAdmin = null;
  _cachedForUserId = null;
}

export function getCachedAdminStatus() {
  if (_cachedForUserId === sessionStore.user?.id) {
    return _cachedIsAdmin;
  }
  return null;
}
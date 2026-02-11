/**
 * Supabase Edge Function Caller
 * 
 * ARCHITECTURE: Backend (RLS/Edge Functions) is source of truth
 * - Always include auth token if available
 * - Let backend decide authorization via RLS
 * - Frontend only catches errors and displays them
 */

import { getSupabaseConfig, SUPABASE_FUNCTIONS_URL } from './config';
import { sessionStore } from './client';

const IS_DEV = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Call a Supabase Edge Function
 * 
 * @param {string} name - Function name (e.g., 'create_match', 'join_match')
 * @param {object} body - Request body payload
 * @param {object} options - Optional config
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {Error} - On non-2xx responses (backend decides auth)
 */
export async function callEdgeFunction(name, body = {}, options = {}) {
  // Get config (includes anon key)
  const config = await getSupabaseConfig();
  
  // Build URL
  const url = `${SUPABASE_FUNCTIONS_URL}/${name}`;
  
  // Build headers
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Always include apikey
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
  }
  
  // Always include auth token if available - let backend decide access
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }
  
  // Log in dev mode
  if (IS_DEV) {
    console.log(`[EdgeFunction] Calling ${name}`, { hasAuth: !!sessionStore.accessToken });
  }
  
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  } catch (networkErr) {
    // True network error (DNS, offline, CORS preflight blocked, etc.)
    const error = new Error('Nätverksfel. Kontrollera din anslutning.');
    error.status = 0;
    error.message = 'Nätverksfel. Kontrollera din anslutning.';
    error.data = null;
    error.isNetworkError = true;
    error.functionName = name;
    throw error;
  }
    
  // Always read body as text first – safe regardless of content-type
  let rawText = '';
  try {
    rawText = await res.text();
  } catch (_) {
    // empty body
  }

  // Try to parse as JSON
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (_) {
    data = { message: rawText };
  }
    
  // Log response in dev mode
  if (IS_DEV) {
    console.log(`[EdgeFunction] ${name} response:`, res.status, res.ok ? 'OK' : 'ERROR');
  }
    
  // Handle errors
  if (!res.ok) {
    const errorMessage = data?.message || data?.error || `EdgeFunction ${name} failed: ${res.status}`;
      
    // Create standardised error object
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    error.isNetworkError = false;
    error.functionName = name;
      
    // Handle specific status codes
    if (res.status === 401) {
      error.message = 'Session utgången. Logga in igen.';
      sessionStore.clear();
    } else if (res.status === 403) {
      error.message = 'Du saknar behörighet att utföra denna åtgärd.';
    } else if (res.status === 400) {
      error.message = data?.message || 'Ogiltig förfrågan.';
    }
      
    throw error;
  }
    
  return data;
}

/**
 * Call Edge Function without auth requirement (for public endpoints)
 */
export async function callPublicEdgeFunction(name, body = {}) {
  return callEdgeFunction(name, body, { requireAuth: false });
}
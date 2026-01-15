/**
 * Supabase Edge Function Caller
 * 
 * Single shared helper for calling all Edge Functions.
 * Always includes proper auth headers and error handling.
 */

import { getSupabaseConfig, SUPABASE_FUNCTIONS_URL } from './config';
import { sessionStore } from './client';

const IS_DEV = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname.includes('base44'));

/**
 * Call a Supabase Edge Function
 * 
 * @param {string} name - Function name (e.g., 'create_match', 'join_match')
 * @param {object} body - Request body payload
 * @param {object} options - Optional config { requireAuth: boolean }
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {Error} - On non-2xx responses
 */
export async function callEdgeFunction(name, body = {}, options = {}) {
  const { requireAuth = true } = options;
  
  // Get config (includes anon key)
  const config = await getSupabaseConfig();
  
  // Build URL
  const url = `${SUPABASE_FUNCTIONS_URL}/${name}`;
  
  // Build headers
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Always include apikey if available
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
  }
  
  // Include auth token if user is authenticated
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  } else if (requireAuth) {
    throw new Error('Du måste vara inloggad för att utföra denna åtgärd');
  }
  
  // Log in dev mode
  if (IS_DEV) {
    console.log(`[EdgeFunction] Calling ${name}`, { hasAuth: !!sessionStore.accessToken });
  }
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    // Try to parse response
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => '');
      data = { message: text };
    }
    
    // Log response in dev mode
    if (IS_DEV) {
      console.log(`[EdgeFunction] ${name} response:`, res.status, res.ok ? 'OK' : 'ERROR');
    }
    
    // Handle errors
    if (!res.ok) {
      const errorMessage = data?.message || data?.error || `EdgeFunction ${name} failed: ${res.status}`;
      
      // Create error with details
      const error = new Error(errorMessage);
      error.status = res.status;
      error.details = data;
      error.functionName = name;
      
      // Handle specific status codes
      if (res.status === 401) {
        error.message = 'Session utgången. Logga in igen.';
        // Clear invalid session
        sessionStore.clear();
      } else if (res.status === 403) {
        error.message = 'Du har inte behörighet att utföra denna åtgärd.';
      } else if (res.status === 400) {
        error.message = data?.message || 'Ogiltig förfrågan.';
      }
      
      throw error;
    }
    
    return data;
    
  } catch (error) {
    // Network errors
    if (!error.status) {
      error.message = 'Nätverksfel. Kontrollera din anslutning.';
      error.isNetworkError = true;
    }
    throw error;
  }
}

/**
 * Call Edge Function without auth requirement (for public endpoints)
 */
export async function callPublicEdgeFunction(name, body = {}) {
  return callEdgeFunction(name, body, { requireAuth: false });
}
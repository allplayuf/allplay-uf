/**
 * Supabase Configuration
 * 
 * IMPORTANT: The anon key is a PUBLIC key (safe to embed in client code).
 * Supabase explicitly recommends this — RLS enforces security, not the key.
 * Previously fetched via backend function, but that requires a paid plan.
 * Hardcoding eliminates the 403 bug on iOS/TestFlight where the backend
 * call failed silently and left apikey=null.
 */

export const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Supabase anon key — PUBLIC, safe for frontend.
 * If you rotate this key in Supabase Dashboard, update it here too.
 */
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZmpqb2txbXlrcWF3amxnZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjg2NDQsImV4cCI6MjA4MzkwNDY0NH0.xoSktW8SgwXwJSp_Rzi0lt1bw2wkS7Rz1sV7fVPMCNw';

// Cached config object — always available synchronously after first access
const CONFIG = {
  url: SUPABASE_URL,
  functionsUrl: SUPABASE_FUNCTIONS_URL,
  anonKey: SUPABASE_ANON_KEY
};

/**
 * Get Supabase config. Now synchronous-safe — always returns immediately.
 * Kept async for backward compatibility with existing callers.
 */
export async function getSupabaseConfig() {
  return CONFIG;
}

/**
 * Build standard headers for any Supabase request (REST or Edge).
 * Always waits for auth so tokens are guaranteed fresh.
 * apikey is ALWAYS present (hardcoded constant) — no async fetch needed.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.includeAuth=true] - attach Bearer token
 * @param {boolean} [opts.json=true]        - set Content-Type JSON
 * @returns {Promise<Record<string,string>>}
 */
export async function getAuthHeaders({ includeAuth = true, json = true } = {}) {
  // Lazy import to break circular dependency (client ↔ config)
  const { sessionStore, waitForAuth } = await import('./client');
  await waitForAuth();

  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';

  // apikey is ALWAYS available — hardcoded constant, never null
  headers['apikey'] = SUPABASE_ANON_KEY;

  if (includeAuth && sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }

  return headers;
}

// All exports are inline (export const) above
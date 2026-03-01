/**
 * Supabase Configuration
 * 
 * IMPORTANT: The anon key is a PUBLIC key (safe to embed in client code).
 * Supabase explicitly recommends this — RLS enforces security, not the key.
 * Previously fetched via backend function, but that requires a paid plan.
 * Hardcoding eliminates the 403 bug on iOS/TestFlight where the backend
 * call failed silently and left apikey=null.
 */

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Supabase anon key — PUBLIC, safe for frontend.
 * If you rotate this key in Supabase Dashboard, update it here too.
 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZmpqb2txbXlrcWF3amxnZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NjMyMDMsImV4cCI6MjA1ODEzOTIwM30.xjOlBxFphYIjhMBLqjX6mRv5GUMqLRDJNQ_0FzSNrts';

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
 * Always waits for auth + config so tokens are guaranteed fresh.
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
  const config = await getSupabaseConfig();

  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';

  // apikey is REQUIRED for every Supabase request
  if (config.anonKey) {
    headers['apikey'] = config.anonKey;
  } else {
    console.warn('[getAuthHeaders] apikey is NULL — request will likely 403');
  }

  if (includeAuth && sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }

  return headers;
}

export { SUPABASE_URL, SUPABASE_FUNCTIONS_URL };
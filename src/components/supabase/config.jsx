/**
 * Supabase Configuration
 * 
 * All Supabase config values - fetched once from backend.
 * Provides a shared getAuthHeaders() helper so every caller
 * always sends both `apikey` and `Authorization`.
 */

import { sessionStore, waitForAuth } from './client';

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

let cachedConfig = null;
let configPromise = null;

/**
 * Fetch Supabase config (anon key) from Base44 backend.
 * Retries once if the first attempt fails.
 */
export async function getSupabaseConfig() {
  if (cachedConfig) return cachedConfig;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { base44 } = await import('@/api/base44Client');
        const response = await base44.functions.invoke('getSupabaseConfig');

        if (response?.data?.anonKey) {
          cachedConfig = {
            url: SUPABASE_URL,
            functionsUrl: SUPABASE_FUNCTIONS_URL,
            anonKey: response.data.anonKey
          };
          return cachedConfig;
        }
      } catch (e) {
        console.error(`[Supabase] Config fetch attempt ${attempt + 1} failed:`, e);
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 500)); // brief wait before retry
        }
      }
    }

    console.warn('[Supabase] anonKey unavailable — API calls may 403');
    return {
      url: SUPABASE_URL,
      functionsUrl: SUPABASE_FUNCTIONS_URL,
      anonKey: null
    };
  })();

  return configPromise;
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
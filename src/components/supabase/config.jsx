/**
 * Supabase Configuration
 * 
 * ZERO Base44 dependency. Anon key fetched directly from our own
 * Base44 backend function via plain fetch, then cached forever.
 */

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

let cachedConfig = null;
let configPromise = null;

/**
 * Fetch Supabase config (anon key) from backend.
 * Uses a direct fetch to the Base44 function endpoint
 * so we never import @/api/base44Client.
 */
export async function getSupabaseConfig() {
  if (cachedConfig) return cachedConfig;
  
  // Prevent multiple simultaneous fetches
  if (configPromise) return configPromise;
  
  configPromise = (async () => {
    try {
      // Use Base44 function import (V2 platform)
      const { getSupabaseConfig: fetchConfig } = await import('@/functions/getSupabaseConfig');
      const response = await fetchConfig({});
      const data = response?.data;
      
      if (data?.anonKey) {
        cachedConfig = {
          url: SUPABASE_URL,
          functionsUrl: SUPABASE_FUNCTIONS_URL,
          anonKey: data.anonKey
        };
        return cachedConfig;
      }
    } catch (e) {
      console.error('[Supabase] Failed to get config:', e);
    }
    
    // Return defaults without anon key (guest mode)
    return {
      url: SUPABASE_URL,
      functionsUrl: SUPABASE_FUNCTIONS_URL,
      anonKey: null
    };
  })();
  
  return configPromise;
}

export { SUPABASE_URL, SUPABASE_FUNCTIONS_URL };
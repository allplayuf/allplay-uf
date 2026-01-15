/**
 * Supabase Configuration
 * 
 * All Supabase config values - fetched once from backend
 */

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

let cachedConfig = null;
let configPromise = null;

/**
 * Fetch Supabase config (anon key) from Base44 backend
 * Caches the result for the session
 */
export async function getSupabaseConfig() {
  if (cachedConfig) return cachedConfig;
  
  // Prevent multiple simultaneous fetches
  if (configPromise) return configPromise;
  
  configPromise = (async () => {
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
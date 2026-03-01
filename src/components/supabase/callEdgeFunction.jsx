/**
 * Supabase Edge Function Caller — SINGLE SOURCE OF TRUTH
 * 
 * ALL edge function calls in the entire app MUST go through this wrapper.
 * No supabase.functions.invoke(), no raw fetch to /functions/v1/*.
 * 
 * HARD FAIL: If SUPABASE_ANON_KEY is missing or too short, throws immediately.
 * DEBUG: Logs apikey length, prefix, token presence BEFORE every request.
 * DEBUG: Logs status + response body AFTER every request.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { sessionStore, waitForAuth } from './client';

// ── HARD FAIL CHECK at module load time ──
// If tree-shaking or bundler drops the constant, this catches it.
if (!SUPABASE_ANON_KEY || typeof SUPABASE_ANON_KEY !== 'string' || SUPABASE_ANON_KEY.length < 20) {
  const msg = `[CRITICAL] SUPABASE_ANON_KEY missing or invalid in this build! Value: "${String(SUPABASE_ANON_KEY).slice(0, 10)}..." (length: ${String(SUPABASE_ANON_KEY || '').length})`;
  console.error(msg);
  // Don't throw at module level (breaks entire app), but flag for runtime
}

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Build headers for edge function calls.
 * apikey is ALWAYS the hardcoded SUPABASE_ANON_KEY constant.
 * Authorization is Bearer <access_token> when user is logged in.
 */
function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  };

  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }

  return headers;
}

/**
 * Call a Supabase Edge Function.
 * 
 * @param {string} name - Edge function name (e.g. 'create_match')
 * @param {object} body - JSON body payload
 * @param {object} [options] - Optional: { method: 'POST' }
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function callEdgeFunction(name, body = {}, options = {}) {
  // Wait for auth to be ready (token refresh complete)
  await waitForAuth();

  const method = options.method || 'POST';

  // ── HARD FAIL if anon key is missing ──
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 20) {
    const error = new Error(`SUPABASE_ANON_KEY missing in this build! Cannot call ${name}. Key length: ${String(SUPABASE_ANON_KEY || '').length}`);
    error.status = 0;
    error.functionName = name;
    error.isConfigError = true;
    console.error(`[EdgeFunction] HARD FAIL:`, error.message);
    throw error;
  }

  const headers = buildHeaders();
  const url = `${FUNCTIONS_URL}/${name}`;

  // ── DEBUG LOG BEFORE REQUEST ──
  console.log(`[EdgeFunction] → ${name}`, {
    method,
    anonKeyLength: SUPABASE_ANON_KEY.length,
    anonKeyPrefix: SUPABASE_ANON_KEY.slice(0, 8) + '...',
    tokenPresent: !!headers['Authorization'],
    tokenPrefix: headers['Authorization'] ? headers['Authorization'].slice(0, 15) + '...' : 'NONE',
    url
  });

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    });
  } catch (networkErr) {
    console.error(`[EdgeFunction] ✗ ${name} NETWORK ERROR:`, networkErr.message);
    const error = new Error(`Nätverksfel vid anrop till ${name}: ${networkErr.message || 'CORS/fetch blocked'}`);
    error.status = 0;
    error.data = null;
    error.isNetworkError = true;
    error.functionName = name;
    throw error;
  }

  // ── DEBUG LOG AFTER REQUEST ──
  let rawText = '';
  try { rawText = await res.text(); } catch (_) { /* empty */ }

  console.log(`[EdgeFunction] ← ${name}`, {
    status: res.status,
    ok: res.ok,
    bodyLength: rawText.length,
    bodyPreview: rawText.slice(0, 300)
  });

  let data = null;
  try { data = rawText ? JSON.parse(rawText) : {}; } catch (_) { data = { message: rawText }; }

  if (!res.ok) {
    console.error(`[EdgeFunction] ✗ ${name} FAILED: status=${res.status}, body=${rawText.slice(0, 500)}`);
    const errorMessage = data?.message || data?.error || `EdgeFunction ${name} failed: ${res.status}`;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    error.isNetworkError = false;
    error.functionName = name;

    if (res.status === 401) {
      error.message = 'Du måste vara inloggad. Logga in och försök igen.';
      sessionStore.clear();
    } else if (res.status === 403) {
      error.message = data?.message?.includes('apikey')
        ? `API-nyckel saknas i request. anonKey=${SUPABASE_ANON_KEY.length} chars. Starta om appen.`
        : 'Du saknar behörighet att utföra denna åtgärd.';
    } else if (res.status === 400 || res.status === 409 || res.status === 404) {
      const raw = (data?.message || data?.error || '').toLowerCase();
      if (raw.includes('match is full') || raw.includes('full')) {
        error.message = 'Matchen är full.';
      } else if (raw.includes('already joined') || raw.includes('already a participant')) {
        error.message = 'Du är redan anmäld till denna match.';
      } else if (raw.includes('not joined') || raw.includes('not a participant') || raw.includes('not in')) {
        error.message = 'Du är inte med i matchen.';
      } else if (raw.includes('not found') || raw.includes('does not exist')) {
        error.message = 'Matchen hittades inte.';
      } else if (raw.includes('already finished') || raw.includes('already completed')) {
        error.message = 'Matchen är redan avslutad.';
      } else if (raw.includes('only the organizer') || raw.includes('only organizer') || raw.includes('not the organizer')) {
        error.message = 'Endast arrangören kan utföra denna åtgärd.';
      } else {
        error.message = data?.message || 'Ogiltig förfrågan.';
      }
    }

    throw error;
  }

  return data;
}

/**
 * Call an edge function without requiring authentication.
 * Still sends apikey header (always), and auth token if available.
 */
export async function callPublicEdgeFunction(name, body = {}) {
  return callEdgeFunction(name, body);
}

/**
 * Build standard headers for REST API calls (not edge functions).
 * Use this for direct Supabase REST API access (tables/views).
 * Always includes apikey + auth token.
 * 
 * @param {object} [opts]
 * @param {boolean} [opts.includeAuth=true]
 * @param {boolean} [opts.json=true]
 * @returns {Promise<Record<string,string>>}
 */
export async function getStandardHeaders({ includeAuth = true, json = true } = {}) {
  await waitForAuth();

  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  headers['apikey'] = SUPABASE_ANON_KEY;

  if (includeAuth && sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }

  return headers;
}
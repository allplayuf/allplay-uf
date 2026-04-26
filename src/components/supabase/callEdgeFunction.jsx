/**
 * Supabase Edge Function Caller — SINGLE SOURCE OF TRUTH
 * 
 * ALL edge function calls in the entire app MUST go through this wrapper.
 * No supabase.functions.invoke(), no raw fetch to /functions/v1/*.
 * 
 * HARD FAIL: If SUPABASE_ANON_KEY is missing or length < 50, throws immediately.
 * DEBUG: Logs + stores last call info for UI display (iOS Safari lacks console).
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { sessionStore, waitForAuth } from './client';

const IS_DEV = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// ── GLOBAL DEBUG STATE (readable from any component) ──
// This is THE way to see what's happening on iOS where console is invisible.
const _debugLog = [];
const MAX_DEBUG_ENTRIES = 20;

export function getEdgeFunctionDebugLog() {
  return _debugLog.slice(); // Return copy
}

function pushDebug(entry) {
  _debugLog.unshift({ ...entry, ts: new Date().toISOString() });
  if (_debugLog.length > MAX_DEBUG_ENTRIES) _debugLog.pop();
  if (IS_DEV) console.log(`[EdgeFn] ${entry.phase}:`, entry);
}

// ── MODULE LOAD CHECK ──
const _anonKeyValid = typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length >= 50;

if (!_anonKeyValid) {
  const msg = `[CRITICAL] SUPABASE_ANON_KEY missing or invalid in THIS build! type=${typeof SUPABASE_ANON_KEY}, length=${String(SUPABASE_ANON_KEY || '').length}, prefix="${String(SUPABASE_ANON_KEY || '').slice(0, 10)}"`;
  console.error(msg);
  pushDebug({ phase: 'MODULE_LOAD_FAIL', message: msg, anonKeyLength: String(SUPABASE_ANON_KEY || '').length });
} else {
  pushDebug({ phase: 'MODULE_LOAD_OK', anonKeyLength: SUPABASE_ANON_KEY.length, anonKeyPrefix: SUPABASE_ANON_KEY.slice(0, 8) });
}

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

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

  // ── HARD FAIL if anon key is missing or too short ──
  if (!SUPABASE_ANON_KEY || typeof SUPABASE_ANON_KEY !== 'string' || SUPABASE_ANON_KEY.length < 50) {
    const detail = {
      phase: 'HARD_FAIL',
      fn: name,
      anonKeyType: typeof SUPABASE_ANON_KEY,
      anonKeyLength: String(SUPABASE_ANON_KEY || '').length,
      anonKeyPrefix: String(SUPABASE_ANON_KEY || '').slice(0, 10),
    };
    pushDebug(detail);
    const error = new Error(`SUPABASE_ANON_KEY missing in THIS build! fn=${name}, keyLen=${detail.anonKeyLength}`);
    error.status = 0;
    error.functionName = name;
    error.isConfigError = true;
    error.debugDetail = detail;
    throw error;
  }

  // ── BUILD HEADERS — inline, no helper, no indirection ──
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  };
  if (sessionStore.accessToken) {
    headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }

  const url = `${FUNCTIONS_URL}/${name}`;

  // ── DEBUG LOG BEFORE REQUEST ──
  const preDebug = {
    phase: 'PRE',
    fn: name,
    method,
    anonLen: SUPABASE_ANON_KEY.length,
    anonPrefix: SUPABASE_ANON_KEY.slice(0, 8),
    tokenPresent: !!headers['Authorization'],
    url,
    // Verify the header object actually has apikey set
    headerApikeySet: !!headers['apikey'],
    headerApikeyLen: (headers['apikey'] || '').length,
  };
  pushDebug(preDebug);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    });
  } catch (networkErr) {
    const netDebug = {
      phase: 'NETWORK_ERROR',
      fn: name,
      error: networkErr.message || 'unknown',
    };
    pushDebug(netDebug);
    const error = new Error(`Nätverksfel vid anrop till ${name}: ${networkErr.message || 'CORS/fetch blocked'}`);
    error.status = 0;
    error.data = null;
    error.isNetworkError = true;
    error.functionName = name;
    throw error;
  }

  // ── READ RESPONSE ──
  let rawText = '';
  try { rawText = await res.text(); } catch (_) { /* empty */ }

  // ── DEBUG LOG AFTER REQUEST ──
  const postDebug = {
    phase: 'POST',
    fn: name,
    status: res.status,
    ok: res.ok,
    bodyLen: rawText.length,
    bodyPreview: rawText.slice(0, 200),
  };
  pushDebug(postDebug);

  let data = null;
  try { data = rawText ? JSON.parse(rawText) : {}; } catch (_) { data = { message: rawText }; }

  if (!res.ok) {
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
      // Extra detail for the exact 403 / apikey issue
      error.message = `403 Forbidden: fn=${name}, sentApikeyLen=${SUPABASE_ANON_KEY.length}, sentApikeyPrefix=${SUPABASE_ANON_KEY.slice(0, 8)}. ${data?.message || 'Saknar behörighet.'}`;
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
/**
 * Supabase Edge Function Caller
 * 
 * Waits for authReady before making any call,
 * so tokens are always fresh on cold start.
 */

import { getSupabaseConfig, SUPABASE_FUNCTIONS_URL } from './config';
import { sessionStore, waitForAuth } from './client';

/**
 * Call a Supabase Edge Function
 */
export async function callEdgeFunction(name, body = {}, options = {}) {
  // Wait for auth to be ready (token refreshed) before any call
  await waitForAuth();

  const config = await getSupabaseConfig();
  const url = `${SUPABASE_FUNCTIONS_URL}/${name}`;

  const headers = { 'Content-Type': 'application/json' };
  if (config.anonKey) headers['apikey'] = config.anonKey;
  if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  } catch (networkErr) {
    const error = new Error(`Nätverksfel vid anrop till ${name}: ${networkErr.message || 'CORS/fetch blocked'}`);
    error.status = 0;
    error.data = null;
    error.isNetworkError = true;
    error.functionName = name;
    throw error;
  }

  let rawText = '';
  try { rawText = await res.text(); } catch (_) { /* empty */ }

  let data = null;
  try { data = rawText ? JSON.parse(rawText) : {}; } catch (_) { data = { message: rawText }; }

  if (!res.ok) {
    console.error(`[EdgeFunction] ${name} failed: status=${res.status}, body=${rawText.slice(0, 500)}`);
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
      error.message = 'Du saknar behörighet att utföra denna åtgärd.';
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

export async function callPublicEdgeFunction(name, body = {}) {
  return callEdgeFunction(name, body, { requireAuth: false });
}
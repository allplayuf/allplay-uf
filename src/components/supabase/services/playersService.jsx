/**
 * Players Service
 * 
 * Fetches players from Supabase `users` table via REST API.
 * RLS determines visibility. Frontend applies privacy masking.
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

const IS_DEV = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Build auth headers for Supabase REST
 */
async function buildHeaders() {
  const config = await getSupabaseConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (config.anonKey) headers['apikey'] = config.anonKey;
  if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  return headers;
}

/**
 * Search/list players from Supabase users table.
 *
 * @param {object} opts
 * @param {string} [opts.search] - Search term (ilike on full_name, username)
 * @param {number} [opts.limit=50] - Max results
 * @param {number} [opts.offset=0] - Pagination offset
 * @returns {Promise<{players: object[], total: number, hasMore: boolean}>}
 */
export async function searchPlayers({ search = '', limit = 50, offset = 0 } = {}) {
  const headers = await buildHeaders();

  // Select only the fields we need
  const fields = 'id,full_name,username,display_name,avatar_url,profile_image_url,city,skill_level,matches_played,mvp_count,elo_rating,is_public';

  let url = `${SUPABASE_URL}/rest/v1/users?select=${fields}&order=full_name.asc`;

  // Search filter using Supabase `or` with ilike
  if (search && search.trim()) {
    const q = encodeURIComponent(`%${search.trim()}%`);
    url += `&or=(full_name.ilike.${q},username.ilike.${q})`;
  }

  // Pagination via Range header
  const rangeStart = offset;
  const rangeEnd = offset + limit - 1;
  headers['Range'] = `${rangeStart}-${rangeEnd}`;
  headers['Prefer'] = 'count=estimated';

  const res = await fetch(url, { method: 'GET', headers });

  if (res.status === 401) {
    throw Object.assign(new Error('Du måste vara inloggad för att söka spelare.'), { status: 401 });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[playersService] searchPlayers failed:', res.status, text);
    throw Object.assign(new Error('Kunde inte hämta spelare.'), { status: res.status });
  }

  const players = await res.json();

  // Parse total count from Content-Range header: "0-49/120"
  const contentRange = res.headers.get('content-range') || '';
  const totalMatch = contentRange.match(/\/(\d+|\*)/);
  const total = totalMatch && totalMatch[1] !== '*' ? parseInt(totalMatch[1], 10) : players.length;

  if (IS_DEV) {
    console.log('[playersService] Fetched', players.length, 'players, total:', total);
  }

  return {
    players,
    total,
    hasMore: (offset + limit) < total
  };
}
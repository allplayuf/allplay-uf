/**
 * Players Service
 * 
 * Fetches players from Supabase `users` view via REST API.
 * IMPORTANT: Only select columns that actually exist in the view.
 * Build display_name / profile_image_url locally as fallbacks.
 */

import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

/**
 * Columns guaranteed to exist in the public.users view.
 * After the SQL migration more columns may exist, but these always work.
 */
const SAFE_SELECT = 'id,full_name,username,avatar_url,elo_rating';

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
 * Normalize a raw row into a shape the frontend expects.
 * Safely handles both old and new view schemas.
 */
function normalizePlayer(row) {
  return {
    id: row.id,
    full_name: row.full_name || row.username || 'Spelare',
    username: row.username || null,
    display_name: row.display_name || row.full_name || row.username || 'Spelare',
    avatar_url: row.avatar_url || row.profile_image_url || null,
    profile_image_url: row.profile_image_url || row.avatar_url || null,
    bio: row.bio || null,
    city: row.city || null,
    skill_level: row.skill_level || null,
    birth_year: row.birth_year || null,
    matches_played: row.matches_played || 0,
    mvp_count: row.mvp_count || 0,
    elo_rating: row.elo_rating || row.elo || null,
    is_public: row.is_public !== false,
  };
}

/**
 * Search/list players from Supabase users view.
 * Uses SAFE_SELECT first; if the view has extra columns they're normalised locally.
 *
 * @param {object} opts
 * @param {string} [opts.search] - Search term (ilike on full_name, username)
 * @param {number} [opts.limit=50] - Max results
 * @param {number} [opts.offset=0] - Pagination offset
 * @returns {Promise<{players: object[], total: number, hasMore: boolean}>}
 */
export async function searchPlayers({ search = '', limit = 50, offset = 0 } = {}) {
  const headers = await buildHeaders();

  // Try extended select first (after SQL migration), fall back to safe select
  let url = `${SUPABASE_URL}/rest/v1/users?select=*&order=full_name.asc`;

  // Search filter using Supabase `or` with ilike on safe columns
  if (search && search.trim()) {
    const q = encodeURIComponent(`%${search.trim()}%`);
    url += `&or=(full_name.ilike.${q},username.ilike.${q})`;
  }

  // Pagination via Range header
  const rangeStart = offset;
  const rangeEnd = offset + limit - 1;
  headers['Range'] = `${rangeStart}-${rangeEnd}`;
  headers['Prefer'] = 'count=estimated';

  let res = await fetch(url, { method: 'GET', headers });

  // If select=* fails (unlikely but safe), retry with minimal columns
  if (res.status === 400) {
    console.warn('[playersService] select=* failed, retrying with safe columns');
    const safeUrl = url.replace('select=*', `select=${SAFE_SELECT}`);
    res = await fetch(safeUrl, { method: 'GET', headers });
  }

  if (res.status === 401) {
    throw Object.assign(new Error('Du måste vara inloggad för att söka spelare.'), { status: 401 });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[playersService] searchPlayers failed:', res.status, text);
    throw Object.assign(new Error('Kunde inte hämta spelare.'), { status: res.status });
  }

  const raw = await res.json();
  const players = raw.map(normalizePlayer);

  // Parse total count from Content-Range header: "0-49/120"
  const contentRange = res.headers.get('content-range') || '';
  const totalMatch = contentRange.match(/\/(\d+|\*)/);
  const total = totalMatch && totalMatch[1] !== '*' ? parseInt(totalMatch[1], 10) : players.length;

  return {
    players,
    total,
    hasMore: (offset + limit) < total
  };
}
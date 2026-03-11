/**
 * Users Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All reads use REST API with RLS enforcement
 * - waitForAuth() ensures token is valid before any call
 */

import { getAuthHeaders, SUPABASE_URL } from '../config';
import { sessionStore, waitForAuth } from '../client';
import { callEdgeFunction } from '../callEdgeFunction';
import { EDGE } from '../edgeNames';
import { primeUsers } from './userCache';

const USER_COLUMNS = 'id,full_name,username,avatar_url,bio,city,skill_level,elo_rating,matches_played,mvp_count,is_admin';

/**
 * Fetch users via REST (fallback when Edge fails)
 */
async function fetchUsersViaRest(ids) {
  if (!ids || ids.length === 0) return [];

  const headers = await getAuthHeaders();

  const idsParam = `(${ids.join(',')})`;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=${USER_COLUMNS}`,
    { method: 'GET', headers }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`REST users fetch failed: ${res.status} – ${body.slice(0, 200)}`);
  }
  return await res.json();
}

/**
 * Get current user's profile
 */
export async function getMyProfile() {
  await waitForAuth();
  if (!sessionStore.user?.id) return null;

  const headers = await getAuthHeaders();

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${sessionStore.user.id}&select=${USER_COLUMNS}`,
      { method: 'GET', headers }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[usersService] getMyProfile failed:', res.status, body.slice(0, 200));
      throw new Error(`Failed to fetch profile: ${res.status}`);
    }

    const data = await res.json();
    return data?.[0] || null;
  } catch (e) {
    console.error('[usersService] Failed to fetch profile:', e);
    return null;
  }
}

const normalize = (user) => {
  const emailPrefix = user.email ? user.email.split('@')[0] : null;
  const name = user.full_name || user.display_name || user.username || emailPrefix || 'Ny spelare';
  return {
    id: user.id,
    full_name: name,
    username: user.username || null,
    display_name: name,
    avatar_url: user.avatar_url || user.profile_image_url || null,
    profile_image_url: user.profile_image_url || user.avatar_url || null,
    bio: user.bio || null,
    city: user.city || null,
    skill_level: user.skill_level || null,
    birth_year: user.birth_year || null,
    matches_played: user.matches_played || 0,
    mvp_count: user.mvp_count || 0,
    elo_rating: user.elo_rating || user.elo || null,
    is_admin: user.is_admin || false
  };
};

// Dedupe: coalesce concurrent calls for the same set of IDs
let _pendingBatch = null;
let _pendingTimer = null;
const BATCH_DELAY = 10; // ms — coalesce calls within this window

function _flushBatch() {
  if (!_pendingBatch) return;
  const batch = _pendingBatch;
  _pendingBatch = null;
  _pendingTimer = null;

  const allIds = [...new Set(batch.entries.flatMap(e => e.ids))];

  // Split into chunks of 50
  const chunks = [];
  for (let i = 0; i < allIds.length; i += 50) {
    chunks.push(allIds.slice(i, i + 50));
  }

  const work = (async () => {
    let allUsers = [];

    for (const chunk of chunks) {
      // Try Edge Function
      let users = [];
      try {
        const result = await callEdgeFunction(EDGE.getUsersByIds, { user_ids: chunk });
        users = result?.users || [];
      } catch (e) {
        console.warn('[usersService] Edge failed, REST fallback:', e.message);
      }

      // Fallback to REST
      if (users.length === 0) {
        try {
          users = await fetchUsersViaRest(chunk);
        } catch (e) {
          console.warn('[usersService] REST fallback failed:', e.message);
        }
      }

      allUsers = allUsers.concat(users);
    }

    const normalized = allUsers.map(normalize);
    const byId = new Map(normalized.map(u => [u.id, u]));

    // Fill missing with fallbacks
    allIds.forEach(id => {
      if (!byId.has(id)) byId.set(id, normalize({ id }));
    });

    // Resolve each caller with their requested IDs
    for (const entry of batch.entries) {
      entry.resolve(entry.ids.map(id => byId.get(id) || normalize({ id })));
    }
  })();

  work.catch(err => {
    for (const entry of batch.entries) {
      entry.resolve(entry.ids.map(id => normalize({ id })));
    }
  });
}

/**
 * Get users by IDs — deduped + batched (max 50 per call)
 */
export async function getUsersByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  await waitForAuth();

  return new Promise((resolve) => {
    if (!_pendingBatch) {
      _pendingBatch = { entries: [] };
    }
    _pendingBatch.entries.push({ ids, resolve });

    if (_pendingTimer) clearTimeout(_pendingTimer);
    _pendingTimer = setTimeout(_flushBatch, BATCH_DELAY);
  });
}

export async function getUserById(id) {
  if (!id) return null;
  const users = await getUsersByIds([id]);
  return users?.[0] || null;
}

export async function updateProfile(data) {
  const payload = {};
  const ALLOWED_FIELDS = ['full_name', 'username', 'avatar_url', 'bio', 'skill_level', 'city', 'birth_year'];
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) payload[key] = data[key];
  }
  if (Object.keys(payload).length === 0) throw new Error('Minst ett fält måste uppdateras');

  try {
    const result = await callEdgeFunction(EDGE.updateProfile, payload);
    if (result?.ok !== false && result?.user) primeUsers([result.user]);
    return result;
  } catch (error) {
    console.error('[usersService] Failed to update profile:', error);
    throw error;
  }
}
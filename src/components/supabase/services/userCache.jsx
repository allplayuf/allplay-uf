/**
 * User Cache Service
 * 
 * In-memory cache for public user data.
 * Deduplicates concurrent requests.
 * All network calls wait for authReady via waitForAuth().
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { EDGE } from '../edgeNames';
import { getAuthHeaders, SUPABASE_URL } from '../config';
import { waitForAuth } from '../client';

const userCache = new Map();
const pendingRequests = new Map();
const MAX_CACHE_SIZE = 1000;
const USER_COLUMNS = 'id,full_name,username,email,avatar_url,bio,city,skill_level,elo_rating,matches_played,mvp_count,is_admin';

export function getCachedUser(userId) {
  if (!userId) return null;
  return userCache.get(userId) || null;
}

export function primeUsers(users) {
  if (!Array.isArray(users)) return;
  users.forEach(user => {
    if (user?.id) userCache.set(user.id, normalizeUser(user));
  });
  if (userCache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(userCache.keys());
    for (let i = 0; i < userCache.size - MAX_CACHE_SIZE; i++) userCache.delete(keys[i]);
  }
}

function normalizeUser(user) {
  return {
    id: user.id,
    full_name: user.full_name || user.username || (user.email ? user.email.split('@')[0] : 'Ny spelare'),
    username: user.username || null,
    display_name: user.display_name || user.full_name || user.username || (user.email ? user.email.split('@')[0] : 'Ny spelare'),
    avatar_url: user.avatar_url || null,
    bio: user.bio || null,
    city: user.city || null,
    skill_level: user.skill_level || null,
    birth_year: user.birth_year || null,
    matches_played: user.matches_played || 0,
    mvp_count: user.mvp_count || 0,
    elo_rating: user.elo_rating || null,
    is_admin: user.is_admin || false
  };
}

function createFallbackUser(userId) {
  return {
    id: userId,
    full_name: 'Ny spelare',
    username: null,
    display_name: 'Ny spelare',
    avatar_url: null,
    bio: null,
    city: null,
    skill_level: null,
    birth_year: null,
    matches_played: 0,
    mvp_count: 0,
    elo_rating: null,
    is_admin: false
  };
}

export async function fetchUsersMissing(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return new Map();

  await waitForAuth();

  const uniqueIds = [...new Set(userIds.filter(id => id && typeof id === 'string'))];
  if (uniqueIds.length === 0) return new Map();

  const missingIds = uniqueIds.filter(id => !userCache.has(id));

  if (missingIds.length === 0) {
    const result = new Map();
    uniqueIds.forEach(id => { if (userCache.has(id)) result.set(id, userCache.get(id)); });
    return result;
  }

  // Dedupe — sort IDs so same set hits same key
  const requestKey = missingIds.slice().sort().join(',');

  if (pendingRequests.has(requestKey)) {
    await pendingRequests.get(requestKey);
    const result = new Map();
    uniqueIds.forEach(id => result.set(id, userCache.get(id) || createFallbackUser(id)));
    return result;
  }

  const requestPromise = (async () => {
    try {
      // Split into chunks of 50
      const chunks = [];
      for (let i = 0; i < missingIds.length; i += 50) chunks.push(missingIds.slice(i, i + 50));

      let allUsers = [];
      for (const chunk of chunks) {
        let users = [];

        // Try Edge Function
        try {
          const response = await callEdgeFunction(EDGE.getUsersByIds, { user_ids: chunk });
          users = response?.users || [];
          // DEBUG: Log edge function response
          if (users.length > 0) {
            console.log('[userCache] Edge response sample (first 3):', JSON.stringify(users.slice(0, 3).map(u => ({
              id: u.id,
              full_name: u.full_name,
              username: u.username,
              email: u.email,
              _allKeys: Object.keys(u)
            }))));
          }
        } catch (edgeError) {
          console.warn('[userCache] Edge failed, trying REST:', edgeError.message);
        }

        // REST fallback
        if (users.length === 0) {
          try {
            const headers = await getAuthHeaders();
            const idsParam = `(${chunk.join(',')})`;
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=${USER_COLUMNS}`,
              { method: 'GET', headers }
            );
            if (res.ok) {
              users = await res.json();
            } else {
              console.warn(`[userCache] REST fallback failed: ${res.status}`);
            }
          } catch (restError) {
            console.warn('[userCache] REST network error:', restError.message);
          }
        }

        allUsers = allUsers.concat(users);
      }

      primeUsers(allUsers);

      // Fallbacks for anything still missing
      const fetchedIds = new Set(allUsers.map(u => u.id));
      missingIds.forEach(id => {
        if (!fetchedIds.has(id)) userCache.set(id, createFallbackUser(id));
      });
    } catch (error) {
      console.error('[userCache] Failed to fetch users:', error);
      missingIds.forEach(id => {
        if (!userCache.has(id)) userCache.set(id, createFallbackUser(id));
      });
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  await requestPromise;

  const result = new Map();
  uniqueIds.forEach(id => result.set(id, userCache.get(id) || createFallbackUser(id)));
  return result;
}

export function clearUserCache() {
  userCache.clear();
  pendingRequests.clear();
}

export async function getUsers(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const userMap = await fetchUsersMissing(userIds);
  return userIds.map(id => userMap.get(id) || createFallbackUser(id));
}

export async function getUser(userId) {
  if (!userId) return createFallbackUser('unknown');
  const users = await getUsers([userId]);
  return users[0] || createFallbackUser(userId);
}
/**
 * User Cache Service
 * 
 * ARCHITECTURE: In-memory cache for public user data
 * - Prevents duplicate network requests
 * - Bulk-fetches missing users via get_users_by_ids
 * - Thread-safe deduplication of concurrent requests
 * - Provides fallback for missing/failed users
 */

import { callEdgeFunction } from '../callEdgeFunction';
import { EDGE } from '../edgeNames';
import { getSupabaseConfig, SUPABASE_URL } from '../config';
import { sessionStore } from '../client';

// In-memory cache
const userCache = new Map();

// Pending requests to avoid duplicate fetches
const pendingRequests = new Map();

// Max cache size (simple LRU would be better but keeping it simple)
const MAX_CACHE_SIZE = 1000;

/**
 * Get cached user by ID
 * Returns null if not in cache
 */
export function getCachedUser(userId) {
  if (!userId) return null;
  return userCache.get(userId) || null;
}

/**
 * Prime cache with users
 * Used after profile updates or bulk fetches
 */
export function primeUsers(users) {
  if (!Array.isArray(users)) return;
  
  users.forEach(user => {
    if (user?.id) {
      userCache.set(user.id, normalizeUser(user));
    }
  });
  
  // Simple cache size management
  if (userCache.size > MAX_CACHE_SIZE) {
    const entriesToDelete = userCache.size - MAX_CACHE_SIZE;
    const keys = Array.from(userCache.keys());
    for (let i = 0; i < entriesToDelete; i++) {
      userCache.delete(keys[i]);
    }
  }
}

/**
 * Normalize user shape for consistent frontend use.
 * Handles both old view (few columns) and new view (many columns).
 */
function normalizeUser(user) {
  return {
    id: user.id,
    full_name: user.full_name || user.username || 'Spelare',
    username: user.username || null,
    display_name: user.display_name || user.full_name || user.username || 'Spelare',
    avatar_url: user.avatar_url || user.profile_image_url || null,
    profile_image_url: user.profile_image_url || user.avatar_url || null,
    city: user.city || null,
    skill_level: user.skill_level || null,
    matches_played: user.matches_played || 0,
    mvp_count: user.mvp_count || 0,
    elo_rating: user.elo_rating || user.elo || null
  };
}

/**
 * Create fallback user for missing data
 */
function createFallbackUser(userId) {
  return {
    id: userId,
    full_name: 'Spelare',
    username: null,
    display_name: 'Spelare',
    avatar_url: null,
    profile_image_url: null,
    city: null,
    skill_level: null,
    matches_played: 0,
    mvp_count: 0,
    elo_rating: null
  };
}

/**
 * Fetch users that are missing from cache
 * Deduplicates concurrent requests for same IDs
 * @param {string[]} userIds - Array of user IDs to fetch
 * @returns {Promise<Map<string, User>>} Map of userId -> user data
 */
export async function fetchUsersMissing(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }
  
  // Filter out invalid IDs and duplicates
  const uniqueIds = [...new Set(userIds.filter(id => id && typeof id === 'string'))];
  
  if (uniqueIds.length === 0) {
    return new Map();
  }
  
  // Check which users are missing from cache
  const missingIds = uniqueIds.filter(id => !userCache.has(id));
  
  if (missingIds.length === 0) {
    // All users in cache - return them
    const result = new Map();
    uniqueIds.forEach(id => {
      const user = userCache.get(id);
      if (user) {
        result.set(id, user);
      }
    });
    return result;
  }
  
  // Check if there's already a pending request for these IDs
  const requestKey = missingIds.sort().join(',');
  
  if (pendingRequests.has(requestKey)) {
    // Wait for existing request
    await pendingRequests.get(requestKey);
    
    // Return cached data after request completes
    const result = new Map();
    uniqueIds.forEach(id => {
      const user = userCache.get(id);
      if (user) {
        result.set(id, user);
      } else {
        // Fallback if fetch failed
        const fallback = createFallbackUser(id);
        userCache.set(id, fallback);
        result.set(id, fallback);
      }
    });
    return result;
  }
  
  // Create new request promise
  const requestPromise = (async () => {
    try {
      let users = [];
      
      // Try Edge Function first
      try {
        const response = await callEdgeFunction(EDGE.getUsersByIds, { 
          user_ids: missingIds 
        });
        users = response?.users || [];
      } catch (edgeError) {
        console.warn('[userCache] Edge function failed, trying REST:', edgeError.message);
      }
      
      // Fallback to REST API if edge function returned no users
      if (users.length === 0) {
        try {
          const config = await getSupabaseConfig();
          const headers = { 'Content-Type': 'application/json' };
          if (config.anonKey) headers['apikey'] = config.anonKey;
          if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
          
          const idsParam = `(${missingIds.join(',')})`;
          // Use select=* so we get whatever columns the view exposes;
          // normalizeUser() handles missing fields safely.
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=*`,
            { method: 'GET', headers }
          );
          if (res.ok) {
            users = await res.json();
          } else if (res.status === 400) {
            // Retry with only guaranteed-safe columns
            const safeRes = await fetch(
              `${SUPABASE_URL}/rest/v1/users?id=in.${idsParam}&select=id,full_name,username,avatar_url,elo_rating`,
              { method: 'GET', headers }
            );
            if (safeRes.ok) {
              users = await safeRes.json();
            }
          }
        } catch (restError) {
          console.warn('[userCache] REST fallback failed:', restError.message);
        }
      }
      
      // Prime cache with fetched users
      primeUsers(users);
      
      // Create fallbacks for users that weren't returned
      const fetchedIds = new Set(users.map(u => u.id));
      missingIds.forEach(id => {
        if (!fetchedIds.has(id)) {
          const fallback = createFallbackUser(id);
          userCache.set(id, fallback);
        }
      });
      
    } catch (error) {
      console.error('[userCache] Failed to fetch users:', error);
      
      // Create fallbacks for all missing users on error
      missingIds.forEach(id => {
        if (!userCache.has(id)) {
          const fallback = createFallbackUser(id);
          userCache.set(id, fallback);
        }
      });
    } finally {
      // Clean up pending request
      pendingRequests.delete(requestKey);
    }
  })();
  
  // Store pending request
  pendingRequests.set(requestKey, requestPromise);
  
  // Wait for request to complete
  await requestPromise;
  
  // Return all requested users from cache
  const result = new Map();
  uniqueIds.forEach(id => {
    const user = userCache.get(id);
    if (user) {
      result.set(id, user);
    }
  });
  
  return result;
}

/**
 * Clear entire cache (useful for testing or logout)
 */
export function clearUserCache() {
  userCache.clear();
  pendingRequests.clear();
}

/**
 * Get multiple users at once
 * Returns array in same order as input IDs
 * @param {string[]} userIds - Array of user IDs
 * @returns {Promise<User[]>} Array of user objects
 */
export async function getUsers(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }
  
  const userMap = await fetchUsersMissing(userIds);
  
  // Return in same order as input
  return userIds.map(id => userMap.get(id) || createFallbackUser(id));
}

/**
 * Get single user
 * @param {string} userId - User ID
 * @returns {Promise<User>} User object
 */
export async function getUser(userId) {
  if (!userId) {
    return createFallbackUser('unknown');
  }
  
  const users = await getUsers([userId]);
  return users[0] || createFallbackUser(userId);
}
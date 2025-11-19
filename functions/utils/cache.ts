/**
 * Simple Cache Utility
 * In-memory caching for heavy read endpoints
 */

const cache = new Map();

/**
 * Cache configuration presets
 */
export const CACHE_TTL = {
  SHORT: 30 * 1000,        // 30 seconds
  MEDIUM: 2 * 60 * 1000,   // 2 minutes
  LONG: 10 * 60 * 1000,    // 10 minutes
  HOUR: 60 * 60 * 1000     // 1 hour
};

/**
 * Get from cache
 */
export function getCache(key) {
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set cache
 */
export function setCache(key, data, ttl = CACHE_TTL.MEDIUM) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now()
  });
}

/**
 * Invalidate cache by key
 */
export function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCachePattern(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      expiredEntries++;
    } else {
      activeEntries++;
    }
  }
  
  return {
    totalEntries: cache.size,
    activeEntries,
    expiredEntries
  };
}

/**
 * Auto-cleanup expired entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Cache wrapper for functions
 */
export async function withCache(key, ttl, fetcher) {
  // Try to get from cache
  const cached = getCache(key);
  if (cached) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  setCache(key, data, ttl);
  
  return data;
}
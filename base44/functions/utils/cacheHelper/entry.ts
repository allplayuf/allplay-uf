/**
 * Cache Helper Utility
 * Provides simple in-memory caching for expensive operations
 */

const cache = new Map();
const cacheTTL = new Map();

/**
 * Get cached value
 */
export function getCached(key) {
  const ttl = cacheTTL.get(key);
  
  // Check if cache is expired
  if (ttl && Date.now() > ttl) {
    cache.delete(key);
    cacheTTL.delete(key);
    return null;
  }
  
  return cache.get(key) || null;
}

/**
 * Set cached value with TTL in milliseconds
 */
export function setCached(key, value, ttl = 60000) {
  cache.set(key, value);
  cacheTTL.set(key, Date.now() + ttl);
  
  return value;
}

/**
 * Clear cache by key or pattern
 */
export function clearCache(keyOrPattern) {
  if (typeof keyOrPattern === 'string') {
    cache.delete(keyOrPattern);
    cacheTTL.delete(keyOrPattern);
  } else if (keyOrPattern instanceof RegExp) {
    for (const key of cache.keys()) {
      if (keyOrPattern.test(key)) {
        cache.delete(key);
        cacheTTL.delete(key);
      }
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.clear();
  cacheTTL.clear();
}

/**
 * Wrap function with caching
 */
export async function withCache(key, fn, ttl = 60000) {
  const cached = getCached(key);
  
  if (cached !== null) {
    return cached;
  }
  
  const result = await fn();
  return setCached(key, result, ttl);
}
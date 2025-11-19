/**
 * Rate Limiting Utility
 * Simple in-memory rate limiting for API endpoints
 */

// In-memory store for rate limits (in production, use Redis or similar)
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configuration presets
 */
export const RATE_LIMITS = {
  // Strict limits for auth and creation
  AUTH: { requests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 min
  CREATE_MATCH: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  CREATE_TEAM: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  CREATE_CUP: { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  
  // Moderate limits for reads
  READ_HEAVY: { requests: 100, windowMs: 60 * 1000 }, // 100 per minute
  READ_MODERATE: { requests: 300, windowMs: 60 * 1000 }, // 300 per minute
  
  // Generous limits for writes
  WRITE: { requests: 50, windowMs: 60 * 1000 }, // 50 per minute
};

/**
 * Check and enforce rate limit
 * 
 * @param {string} key - Unique identifier (e.g., 'create-match:user123')
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const data = rateLimitStore.get(key);
  
  // First request or expired window
  if (!data || now > data.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
      retryAfter: null
    };
  }
  
  // Within window, check limit
  if (data.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: data.resetAt,
      retryAfter: Math.ceil((data.resetAt - now) / 1000) // seconds
    };
  }
  
  // Increment count
  data.count++;
  rateLimitStore.set(key, data);
  
  return {
    allowed: true,
    remaining: maxRequests - data.count,
    resetAt: data.resetAt,
    retryAfter: null
  };
}

/**
 * Rate limit middleware for Deno functions
 */
export function withRateLimit(config) {
  return async (req, handler) => {
    // Extract user ID or IP for rate limiting
    const userId = req.headers.get('x-user-id') || 'anonymous';
    const endpoint = new URL(req.url).pathname;
    const key = `${endpoint}:${userId}`;
    
    const result = checkRateLimit(key, config.requests, config.windowMs);
    
    // Add rate limit headers
    const headers = {
      'X-RateLimit-Limit': config.requests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toString(),
    };
    
    if (!result.allowed) {
      headers['Retry-After'] = result.retryAfter.toString();
      
      return Response.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        },
        { status: 429, headers }
      );
    }
    
    // Call the actual handler
    const response = await handler(req);
    
    // Add rate limit headers to successful response
    const responseHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  };
}
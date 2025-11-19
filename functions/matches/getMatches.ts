/**
 * Get Matches with Pagination
 * Returns paginated matches with filtering options
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { withErrorHandler, successResponse } from '../utils/errorHandler.js';
import { withCache, CACHE_TTL, invalidateCachePattern } from '../utils/cache.js';

const handler = async (req, logger) => {
  const url = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50); // Max 50
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const status = url.searchParams.get('status') || 'upcoming';
    const format = url.searchParams.get('format');
    const skillLevel = url.searchParams.get('skill_level');
    const venueId = url.searchParams.get('venue_id');
    const date = url.searchParams.get('date');
    const sortBy = url.searchParams.get('sort') || '-date';
    
    const base44 = createClientFromRequest(req);
    
    // Build filter
    const filter = { status };
    
    if (format) filter.format = format;
    if (venueId) filter.venue_id = venueId;
    if (date) filter.date = date;
    if (skillLevel && skillLevel !== 'all') {
      filter.skill_bracket = skillLevel;
    }
    
    // Create cache key based on filters
    const cacheKey = `matches:${JSON.stringify({ filter, sortBy, page, limit })}`;
    
    // Use cache for read-heavy endpoint (2 min TTL)
    const allMatches = await withCache(
      cacheKey,
      CACHE_TTL.MEDIUM,
      async () => await base44.asServiceRole.entities.Match.filter(filter, sortBy)
    );
    
    // Apply pagination
    const totalCount = allMatches.length;
    const matches = allMatches.slice(skip, skip + limit);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    logger.debug('Returning matches', { count: matches.length, totalCount, page });
    
    return successResponse({
      matches,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
};

Deno.serve(withErrorHandler(handler, 'get-matches'));
/**
 * Create Match with Sanitization and Validation
 * Creates a match with proper input sanitization and authorization
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAuth } from '../utils/authorization.js';
import { sanitizeMatchData } from '../utils/sanitizer.js';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimit.js';
import { withErrorHandler, ApiError, ErrorTypes, successResponse } from '../utils/errorHandler.js';
import { Logger } from '../utils/logger.js';

const handler = async (req, logger) => {
  const data = await req.json();
  
  // Require authentication
  const { base44, user } = await requireAuth(req);
  
  // Rate limiting - 20 matches per hour
  const rateLimitKey = `create-match:${user.id}`;
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.CREATE_MATCH.requests, RATE_LIMITS.CREATE_MATCH.windowMs);
  
  if (!rateLimit.allowed) {
    throw ErrorTypes.RATE_LIMIT(rateLimit.retryAfter);
  }
  
  try {
    logger.info('Creating match', { userId: user.id });
    
    // Require authentication
    const { base44, user } = await requireAuth(req);
    
    // Validate required fields
    if (!data.title || !data.venue_id || !data.date || !data.time || !data.format) {
      throw ErrorTypes.VALIDATION_ERROR('Missing required fields: title, venue_id, date, time, format');
    }
    
    // Validate date is not in the past
    const matchDate = new Date(`${data.date}T${data.time}`);
    const now = new Date();
    
    if (matchDate < now) {
      throw ErrorTypes.VALIDATION_ERROR('Cannot create match in the past');
    }
    
    // Validate venue exists
    const venue = await base44.asServiceRole.entities.Venue.get(data.venue_id);
    if (!venue) {
      throw ErrorTypes.NOT_FOUND('Venue');
    }
    
    // Sanitize input data
    const sanitizedData = sanitizeMatchData(data);
    
    // Set organizer to current user
    const matchData = {
      ...sanitizedData,
      organizer_id: user.id,
      current_players: 1,
      status: 'upcoming',
      created_date: new Date().toISOString()
    };
    
    // Create match
    const match = await base44.asServiceRole.entities.Match.create(matchData);
    
    // Add organizer as participant
    await base44.asServiceRole.entities.MatchParticipant.create({
      match_id: match.id,
      user_id: user.id,
      status: 'confirmed'
    });
    
    logger.logAction('match_created', user.id, { matchId: match.id, venue: venue.name });
    
    return successResponse({ match }, 201);
    
  } catch (innerError) {
    logger.error('Failed to create match', innerError, { userId: user.id });
    throw innerError;
  }
};

Deno.serve(withErrorHandler(handler, 'create-match'));
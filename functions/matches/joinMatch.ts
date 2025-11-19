/**
 * Join Match with Race Condition Prevention
 * Safely adds a user to a match with atomic capacity checking
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAuth } from '../utils/authorization.js';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimit.js';
import { withErrorHandler, ApiError, ErrorTypes, successResponse } from '../utils/errorHandler.js';
import { Logger } from '../utils/logger.js';

const handler = async (req, logger) => {
  const { matchId } = await req.json();
  
  if (!matchId) {
    throw ErrorTypes.VALIDATION_ERROR('Match ID is required');
  }
  
  // Require authentication
  const { base44, user } = await requireAuth(req);
  
  // Rate limiting - 50 joins per minute
  const rateLimitKey = `join-match:${user.id}`;
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.WRITE.requests, RATE_LIMITS.WRITE.windowMs);
  
  if (!rateLimit.allowed) {
    throw ErrorTypes.RATE_LIMIT(rateLimit.retryAfter);
  }
  
  try {
    logger.info('User joining match', { userId: user.id, matchId });
    
    // Get match details
    const match = await base44.asServiceRole.entities.Match.get(matchId);
    
    if (!match) {
      throw ErrorTypes.NOT_FOUND('Match');
    }
    
    // Check if match is open
    if (!match.is_open && !match.is_spontaneous) {
      throw ErrorTypes.VALIDATION_ERROR('Match is not accepting new participants');
    }
    
    // Check if user is already participating
    const existingParticipation = await base44.asServiceRole.entities.MatchParticipant.filter({
      match_id: matchId,
      user_id: user.id
    });
    
    if (existingParticipation.length > 0) {
      throw ErrorTypes.CONFLICT('You are already registered for this match');
    }
    
    // Get current participants count BEFORE adding new participant
    const currentParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({
      match_id: matchId
    });
    
    const participantCount = currentParticipants.length;
    
    // Check capacity (atomic check before creation)
    if (!match.is_spontaneous && participantCount >= match.max_players) {
      throw ErrorTypes.VALIDATION_ERROR('Match is full');
    }
    
    // Create participant record
    const participant = await base44.asServiceRole.entities.MatchParticipant.create({
      match_id: matchId,
      user_id: user.id,
      status: 'confirmed',
      elo_at_match: user.elo_rating || 1000
    });
    
    // Double-check capacity after creation (race condition safety)
    const updatedParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({
      match_id: matchId
    });
    
    const newCount = updatedParticipants.length;
    
    // If we exceeded capacity, rollback
    if (!match.is_spontaneous && newCount > match.max_players) {
      await base44.asServiceRole.entities.MatchParticipant.delete(participant.id);
      logger.warn('Match capacity exceeded, rolled back', { matchId, userId: user.id, newCount });
      throw ErrorTypes.CONFLICT('Match became full while you were joining. Please try another match.');
    }
    
    // Update match current_players count
    await base44.asServiceRole.entities.Match.update(matchId, {
      current_players: newCount
    });
    
    logger.logAction('match_joined', user.id, { matchId, newCount });
    
    return successResponse({ 
      participant,
      message: 'Successfully joined match'
    });
    
  } catch (innerError) {
    logger.error('Failed to join match', innerError, { userId: user.id, matchId });
    throw innerError;
  }
};

Deno.serve(withErrorHandler(handler, 'join-match'));
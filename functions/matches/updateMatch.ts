/**
 * Update Match
 * Updates match details with proper authorization and validation
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireMatchOwnership } from '../utils/authorization.js';
import { sanitizeMatchData } from '../utils/sanitizer.js';
import { withErrorHandler, ErrorTypes, successResponse } from '../utils/errorHandler.js';
import { invalidateCachePattern } from '../utils/cache.js';

const handler = async (req, logger) => {
  const { matchId, updates } = await req.json();
  
  if (!matchId) {
    throw ErrorTypes.VALIDATION_ERROR('Match ID is required');
  }
  
  if (!updates || Object.keys(updates).length === 0) {
    throw ErrorTypes.VALIDATION_ERROR('No updates provided');
  }
  
  // Verify user has permission to update this match
  const { base44, user, match } = await requireMatchOwnership(req, matchId);
  
  logger.info('Updating match', { userId: user.id, matchId });
  
  // Validate date if being updated
  if (updates.date || updates.time) {
    const date = updates.date || match.date;
    const time = updates.time || match.time;
    const matchDate = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (matchDate < now) {
      throw ErrorTypes.VALIDATION_ERROR('Cannot set match date to the past');
    }
  }
  
  // Validate venue if being updated
  if (updates.venue_id) {
    const venue = await base44.asServiceRole.entities.Venue.get(updates.venue_id);
    if (!venue) {
      throw ErrorTypes.NOT_FOUND('Venue');
    }
  }
  
  // Sanitize input
  const sanitized = sanitizeMatchData(updates);
  
  // Prevent changing critical fields
  delete sanitized.organizer_id;
  delete sanitized.created_date;
  delete sanitized.id;
  
  // Update match
  const updatedMatch = await base44.asServiceRole.entities.Match.update(matchId, sanitized);
  
  // Invalidate cache
  invalidateCachePattern('matches:');
  
  logger.logAction('match_updated', user.id, { matchId, fields: Object.keys(sanitized) });
  
  return successResponse({ match: updatedMatch });
};

Deno.serve(withErrorHandler(handler, 'update-match'));
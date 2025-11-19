/**
 * Leave Match
 * Safely removes a user from a match and updates participant count
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAuth } from '../utils/authorization.js';
import { withErrorHandler, ErrorTypes, successResponse } from '../utils/errorHandler.js';

const handler = async (req, logger) => {
  const { matchId } = await req.json();
  
  if (!matchId) {
    throw ErrorTypes.VALIDATION_ERROR('Match ID is required');
  }
  
  // Require authentication
  const { base44, user } = await requireAuth(req);
  
  logger.info('User leaving match', { userId: user.id, matchId });
  
  // Get match
  const match = await base44.asServiceRole.entities.Match.get(matchId);
  
  if (!match) {
    throw ErrorTypes.NOT_FOUND('Match');
  }
  
  // Find user's participation
  const participations = await base44.asServiceRole.entities.MatchParticipant.filter({
    match_id: matchId,
    user_id: user.id
  });
  
  if (participations.length === 0) {
    throw ErrorTypes.VALIDATION_ERROR('You are not registered for this match');
  }
  
  // Don't allow organizer to leave their own match
  if (match.organizer_id === user.id) {
    throw ErrorTypes.VALIDATION_ERROR('Match organizer cannot leave the match. Delete the match instead.');
  }
  
  // Delete participation
  await base44.asServiceRole.entities.MatchParticipant.delete(participations[0].id);
  
  // Update match participant count
  const remainingParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({
    match_id: matchId
  });
  
  await base44.asServiceRole.entities.Match.update(matchId, {
    current_players: remainingParticipants.length
  });
  
  logger.logAction('match_left', user.id, { matchId, newCount: remainingParticipants.length });
  
  return successResponse({
    message: 'Successfully left match',
    currentPlayers: remainingParticipants.length
  });
};

Deno.serve(withErrorHandler(handler, 'leave-match'));
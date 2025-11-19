/**
 * Delete Match with Cleanup
 * Safely deletes a match and all related records (participants, etc.)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireMatchOwnership } from '../utils/authorization.js';

Deno.serve(async (req) => {
  try {
    const { matchId } = await req.json();
    
    if (!matchId) {
      return Response.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user has permission to delete this match
    const { base44, user, match } = await requireMatchOwnership(req, matchId);
    
    // Step 1: Delete all MatchParticipant records
    const participants = await base44.asServiceRole.entities.MatchParticipant.filter({
      match_id: matchId
    });
    
    for (const participant of participants) {
      await base44.asServiceRole.entities.MatchParticipant.delete(participant.id);
    }
    
    // Step 2: Delete CupMatch records if this is a cup match
    const cupMatches = await base44.asServiceRole.entities.CupMatch.filter({
      match_id: matchId
    });
    
    for (const cupMatch of cupMatches) {
      await base44.asServiceRole.entities.CupMatch.delete(cupMatch.id);
    }
    
    // Step 3: Delete match result verification records
    const verifications = await base44.asServiceRole.entities.MatchResultVerification.filter({
      match_id: matchId
    });
    
    for (const verification of verifications) {
      await base44.asServiceRole.entities.MatchResultVerification.delete(verification.id);
    }
    
    // Step 4: Delete MVP votes
    const mvpVotes = await base44.asServiceRole.entities.MVPVote.filter({
      match_id: matchId
    });
    
    for (const vote of mvpVotes) {
      await base44.asServiceRole.entities.MVPVote.delete(vote.id);
    }
    
    // Step 5: Delete check-ins
    const checkIns = await base44.asServiceRole.entities.CheckIn.filter({
      match_id: matchId
    });
    
    for (const checkIn of checkIns) {
      await base44.asServiceRole.entities.CheckIn.delete(checkIn.id);
    }
    
    // Step 6: Finally, delete the match itself
    await base44.asServiceRole.entities.Match.delete(matchId);
    
    return Response.json({
      success: true,
      message: 'Match and all related records deleted successfully',
      deletedRecords: {
        participants: participants.length,
        cupMatches: cupMatches.length,
        verifications: verifications.length,
        mvpVotes: mvpVotes.length,
        checkIns: checkIns.length
      }
    });
    
  } catch (error) {
    console.error('Error deleting match:', error);
    
    const status = error.message.includes('required') || 
                   error.message.includes('permission') ? 403 : 500;
    
    return Response.json(
      { error: error.message || 'Failed to delete match' },
      { status }
    );
  }
});
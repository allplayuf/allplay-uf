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
    
    // Step 2: Delete CupMatch records if this is a cup match (safely)
    try {
      const cupMatches = await base44.asServiceRole.entities.CupMatch.filter({
        match_id: matchId
      });
      
      for (const cupMatch of cupMatches) {
        await base44.asServiceRole.entities.CupMatch.delete(cupMatch.id);
      }
    } catch (e) {
      console.log('No CupMatch records or error:', e.message);
    }
    
    // Step 3: Delete match result verification records (safely)
    try {
      const verifications = await base44.asServiceRole.entities.MatchResultVerification.filter({
        match_id: matchId
      });
      
      for (const verification of verifications) {
        await base44.asServiceRole.entities.MatchResultVerification.delete(verification.id);
      }
    } catch (e) {
      console.log('No verification records or error:', e.message);
    }
    
    // Step 4: Delete MVP votes (safely)
    try {
      const mvpVotes = await base44.asServiceRole.entities.MVPVote.filter({
        match_id: matchId
      });
      
      for (const vote of mvpVotes) {
        await base44.asServiceRole.entities.MVPVote.delete(vote.id);
      }
    } catch (e) {
      console.log('No MVP votes or error:', e.message);
    }
    
    // Step 5: Delete check-ins (safely)
    try {
      const checkIns = await base44.asServiceRole.entities.CheckIn.filter({
        match_id: matchId
      });
      
      for (const checkIn of checkIns) {
        await base44.asServiceRole.entities.CheckIn.delete(checkIn.id);
      }
    } catch (e) {
      console.log('No check-ins or error:', e.message);
    }
    
    // Step 6: Delete match invitations (safely)
    try {
      const invitations = await base44.asServiceRole.entities.MatchInvitation.filter({
        match_id: matchId
      });
      
      for (const invitation of invitations) {
        await base44.asServiceRole.entities.MatchInvitation.delete(invitation.id);
      }
    } catch (e) {
      console.log('No invitations or error:', e.message);
    }
    
    // Step 7: Delete match results (safely)
    try {
      const results = await base44.asServiceRole.entities.MatchResult.filter({
        match_id: matchId
      });
      
      for (const result of results) {
        await base44.asServiceRole.entities.MatchResult.delete(result.id);
      }
    } catch (e) {
      console.log('No results or error:', e.message);
    }
    
    // Step 8: Delete ELO history (safely)
    try {
      const eloHistory = await base44.asServiceRole.entities.EloHistory.filter({
        match_id: matchId
      });
      
      for (const elo of eloHistory) {
        await base44.asServiceRole.entities.EloHistory.delete(elo.id);
      }
    } catch (e) {
      console.log('No ELO history or error:', e.message);
    }
    
    // Step 9: Finally, delete the match itself
    await base44.asServiceRole.entities.Match.delete(matchId);
    
    return Response.json({
      success: true,
      message: 'Match and all related records deleted successfully'
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
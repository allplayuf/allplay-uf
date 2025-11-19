/**
 * Join Match with Race Condition Prevention
 * Safely adds a user to a match with atomic capacity checking
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAuth } from '../utils/authorization.js';

Deno.serve(async (req) => {
  try {
    const { matchId } = await req.json();
    
    if (!matchId) {
      return Response.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }
    
    // Require authentication
    const { base44, user } = await requireAuth(req);
    
    // Get match details
    const match = await base44.asServiceRole.entities.Match.get(matchId);
    
    if (!match) {
      return Response.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    // Check if match is open
    if (!match.is_open && !match.is_spontaneous) {
      return Response.json(
        { error: 'Match is not accepting new participants' },
        { status: 400 }
      );
    }
    
    // Check if user is already participating
    const existingParticipation = await base44.asServiceRole.entities.MatchParticipant.filter({
      match_id: matchId,
      user_id: user.id
    });
    
    if (existingParticipation.length > 0) {
      return Response.json(
        { error: 'You are already registered for this match' },
        { status: 400 }
      );
    }
    
    // Get current participants count BEFORE adding new participant
    const currentParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({
      match_id: matchId
    });
    
    const participantCount = currentParticipants.length;
    
    // Check capacity (atomic check before creation)
    if (!match.is_spontaneous && participantCount >= match.max_players) {
      return Response.json(
        { error: 'Match is full' },
        { status: 400 }
      );
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
      
      return Response.json(
        { error: 'Match became full while you were joining. Please try another match.' },
        { status: 409 }
      );
    }
    
    // Update match current_players count
    await base44.asServiceRole.entities.Match.update(matchId, {
      current_players: newCount
    });
    
    return Response.json({
      success: true,
      participant,
      message: 'Successfully joined match'
    });
    
  } catch (error) {
    console.error('Error joining match:', error);
    
    const status = error.message.includes('required') || 
                   error.message.includes('Authentication') ? 403 : 500;
    
    return Response.json(
      { error: error.message || 'Failed to join match' },
      { status }
    );
  }
});
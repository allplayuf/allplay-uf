/**
 * Create Match with Sanitization and Validation
 * Creates a match with proper input sanitization and authorization
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth } from '../utils/authorization.js';
import { sanitizeMatchData } from '../utils/sanitizer.js';
import { can, ACTIONS, CONTEXTS, isGuest } from '../utils/permissions.js';

Deno.serve(async (req) => {
  try {
    const data = await req.json();
    
    // Require authentication
    const { base44, user } = await requireAuth(req);
    
    // Block guests from creating matches
    if (isGuest(user)) {
      return Response.json({ error: 'Du måste vara inloggad för att skapa matcher' }, { status: 401 });
    }
    
    // Check permission
    if (!can(user, ACTIONS.CREATE, CONTEXTS.MATCH)) {
      return Response.json({ error: 'Du har inte behörighet att skapa matcher' }, { status: 403 });
    }
    
    // Validate required fields
    if (!data.title || !data.venue_id || !data.date || !data.time || !data.format) {
      return Response.json(
        { error: 'Missing required fields: title, venue_id, date, time, format' },
        { status: 400 }
      );
    }
    
    // Validate date is not in the past
    const matchDate = new Date(`${data.date}T${data.time}`);
    const now = new Date();
    
    if (matchDate < now) {
      return Response.json(
        { error: 'Cannot create match in the past' },
        { status: 400 }
      );
    }
    
    // Validate venue exists
    const venue = await base44.asServiceRole.entities.Venue.get(data.venue_id);
    if (!venue) {
      return Response.json(
        { error: 'Invalid venue' },
        { status: 400 }
      );
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
    
    return Response.json({
      success: true,
      match
    });
    
  } catch (error) {
    console.error('Error creating match:', error);
    
    const status = error.message.includes('required') || 
                   error.message.includes('Authentication') ? 403 : 500;
    
    return Response.json(
      { error: error.message || 'Failed to create match' },
      { status }
    );
  }
});
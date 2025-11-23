/**
 * Create Match with Sanitization and Validation
 * Creates a match with proper input sanitization and authorization
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAuth } from '../utils/authorization.js';
import { sanitizeMatchData } from '../utils/sanitizer.js';
import { createNotification } from '../utils/notificationService.js';

Deno.serve(async (req) => {
  try {
    const data = await req.json();
    
    // Require authentication
    const { base44, user } = await requireAuth(req);
    
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

    // Notify Team Members if it's a team match
    if (match.is_team_match && match.team_a_id) {
      // Fetch team members of Team A (assuming organizer is in Team A)
      const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ 
        team_id: match.team_a_id, 
        status: 'active' 
      });

      const notificationPromises = teamMembers
        .filter(m => m.user_id !== user.id)
        .map(m => createNotification(base44, {
          userId: m.user_id,
          type: 'team_activity',
          title: 'Ny lagmatch',
          message: `En ny lagmatch "${match.title}" har skapats för ditt lag.`,
          link: `/match?id=${match.id}`,
          metadata: { match_id: match.id, team_id: match.team_a_id },
          sendMail: true
        }));
        
      // Non-blocking notification sending
      Promise.all(notificationPromises).catch(e => console.error("Failed to send team notifications", e));
    }
    
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
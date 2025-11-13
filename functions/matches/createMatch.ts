import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { validateMatchData } from '../utils/validation.js';
import { sanitizeMatchData } from '../utils/contentSanitizer.js';
import { checkRateLimit } from '../utils/permissions.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - max 10 matches per hour
    const rateLimit = checkRateLimit(`create-match-${user.id}`, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }

    const matchData = await req.json();

    // Validate input
    const validation = validateMatchData(matchData);
    if (!validation.isValid) {
      return Response.json({ 
        error: 'Validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Sanitize user input
    const sanitized = sanitizeMatchData(matchData);

    // Check for profanity in title
    const titleCheck = await base44.functions.invoke('profanityFilter', {
      text: sanitized.title,
      field: 'match_title'
    });
    
    if (titleCheck.data.hasProfanity) {
      return Response.json({ 
        error: 'Match title contains inappropriate language',
        message: titleCheck.data.message 
      }, { status: 400 });
    }

    // Check for profanity in notes if provided
    if (sanitized.notes) {
      const notesCheck = await base44.functions.invoke('profanityFilter', {
        text: sanitized.notes,
        field: 'match_notes'
      });
      
      if (notesCheck.data.hasProfanity) {
        return Response.json({ 
          error: 'Match notes contain inappropriate language',
          message: notesCheck.data.message 
        }, { status: 400 });
      }
    }

    // Verify venue exists
    try {
      await base44.entities.Venue.get(sanitized.venue_id);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid venue ID',
        details: 'The specified venue does not exist' 
      }, { status: 400 });
    }

    // Create match with sanitized data
    const match = await base44.entities.Match.create({
      ...sanitized,
      organizer_id: user.id,
      current_players: 1,
      status: 'upcoming'
    });

    // Add organizer as first participant
    await base44.entities.MatchParticipant.create({
      match_id: match.id,
      user_id: user.id,
      status: 'confirmed',
      team: 'unassigned'
    });

    return Response.json({ 
      success: true,
      match 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating match:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { sanitizeMatchData, validateMatchData } from '../utils/sanitize.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchData = await req.json();

    // VALIDATION
    const validationErrors = validateMatchData(matchData);
    if (validationErrors.length > 0) {
      return Response.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }

    // SANITIZATION
    const sanitizedData = sanitizeMatchData(matchData);

    // Verify venue exists
    const venue = await base44.asServiceRole.entities.Venue.get(sanitizedData.venue_id);
    if (!venue) {
      return Response.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Set organizer
    sanitizedData.organizer_id = user.id;
    sanitizedData.current_players = 1;
    sanitizedData.status = 'upcoming';

    // Create match
    const match = await base44.asServiceRole.entities.Match.create(sanitizedData);

    // Auto-join organizer as participant
    await base44.asServiceRole.entities.MatchParticipant.create({
      match_id: match.id,
      user_id: user.id,
      status: 'confirmed'
    });

    return Response.json({ success: true, match });

  } catch (error) {
    console.error('Create match error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
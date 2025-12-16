import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await req.json();

    if (!matchId) {
      return Response.json({ error: 'Match ID required' }, { status: 400 });
    }

    // Fetch all data in parallel for optimal performance
    const [match, participants, venue] = await Promise.all([
      base44.entities.Match.filter({ id: matchId }).then(m => m[0]),
      base44.entities.MatchParticipant.filter({ match_id: matchId }),
      // Venue will be fetched after we get match data
      Promise.resolve(null)
    ]);

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Fetch venue data
    const venueData = await base44.entities.Venue.filter({ id: match.venue_id }).then(v => v[0]);

    // Fetch all user data for participants in parallel using service role
    const userIds = [...new Set(participants.map(p => p.user_id))];
    const users = await Promise.all(
      userIds.map(id => 
        base44.asServiceRole.entities.User.get(id).catch(() => null)
      )
    );

    // Create a user map for quick lookup
    const userMap = {};
    users.filter(Boolean).forEach(u => {
      userMap[u.id] = u;
    });

    // Enrich participants with user data
    const enrichedParticipants = participants.map(p => ({
      ...p,
      user: userMap[p.user_id] || null
    }));

    // Calculate if user is participant
    const isParticipant = participants.some(p => p.user_id === user.id);
    const isOrganizer = match.organizer_id === user.id;

    return Response.json({
      match,
      venue: venueData,
      participants: enrichedParticipants,
      isParticipant,
      isOrganizer,
      currentUserId: user.id
    });

  } catch (error) {
    console.error('Error fetching match details:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
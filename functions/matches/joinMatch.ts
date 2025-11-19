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

    // Get match with service role to ensure we have latest data
    const match = await base44.asServiceRole.entities.Match.get(matchId);

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'upcoming') {
      return Response.json({ error: 'Cannot join non-upcoming match' }, { status: 400 });
    }

    // ATOMIC CHECK: Get current participants
    const currentParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({ match_id: matchId });

    // Check if already joined
    const alreadyJoined = currentParticipants.some(p => p.user_id === user.id);
    if (alreadyJoined) {
      return Response.json({ error: 'Already joined this match' }, { status: 400 });
    }

    // ATOMIC CHECK: Verify capacity BEFORE creating participant
    if (!match.is_spontaneous) {
      if (currentParticipants.length >= match.max_players) {
        return Response.json({ error: 'Match is full' }, { status: 400 });
      }
    }

    // Create participant
    const participant = await base44.asServiceRole.entities.MatchParticipant.create({
      match_id: matchId,
      user_id: user.id,
      status: 'confirmed'
    });

    // Update match count atomically
    if (!match.is_spontaneous) {
      await base44.asServiceRole.entities.Match.update(matchId, {
        current_players: currentParticipants.length + 1
      });
    }

    return Response.json({ 
      success: true, 
      participant,
      current_count: currentParticipants.length + 1
    });

  } catch (error) {
    console.error('Join match error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
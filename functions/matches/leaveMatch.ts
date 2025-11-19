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

    // Get match
    const match = await base44.asServiceRole.entities.Match.get(matchId);

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Find participation
    const participants = await base44.asServiceRole.entities.MatchParticipant.filter({ 
      match_id: matchId,
      user_id: user.id
    });

    if (participants.length === 0) {
      return Response.json({ error: 'Not participating in this match' }, { status: 400 });
    }

    // Cannot leave if organizer
    if (match.organizer_id === user.id) {
      return Response.json({ 
        error: 'Organizers cannot leave. Delete the match instead.' 
      }, { status: 400 });
    }

    // Delete participation
    await base44.asServiceRole.entities.MatchParticipant.delete(participants[0].id);

    // Update count atomically
    if (!match.is_spontaneous) {
      const remainingParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({ match_id: matchId });
      await base44.asServiceRole.entities.Match.update(matchId, {
        current_players: Math.max(0, remainingParticipants.length)
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Leave match error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
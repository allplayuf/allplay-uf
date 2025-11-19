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

    // Get match to check permissions
    const match = await base44.asServiceRole.entities.Match.get(matchId);

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // AUTHORIZATION CHECK
    const isOrganizer = match.organizer_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return Response.json({ error: 'Only organizer or admin can delete match' }, { status: 403 });
    }

    // CLEANUP: Delete all related records first
    const participants = await base44.asServiceRole.entities.MatchParticipant.filter({ match_id: matchId });
    
    for (const participant of participants) {
      await base44.asServiceRole.entities.MatchParticipant.delete(participant.id);
    }

    // Delete CupMatch if exists
    const cupMatches = await base44.asServiceRole.entities.CupMatch.filter({ match_id: matchId });
    for (const cupMatch of cupMatches) {
      await base44.asServiceRole.entities.CupMatch.delete(cupMatch.id);
    }

    // Delete match results if exists
    const results = await base44.asServiceRole.entities.MatchResult.filter({ match_id: matchId });
    for (const result of results) {
      await base44.asServiceRole.entities.MatchResult.delete(result.id);
    }

    // Finally delete the match
    await base44.asServiceRole.entities.Match.delete(matchId);

    return Response.json({ 
      success: true,
      deleted: {
        participants: participants.length,
        cup_matches: cupMatches.length,
        results: results.length
      }
    });

  } catch (error) {
    console.error('Delete match error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { match_id } = await req.json();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const match = await base44.entities.Match.get(match_id);
    if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });

    // Find participant record
    const participants = await base44.entities.MatchParticipant.filter({ match_id, user_id: user.id });
    if (participants.length > 0) {
        // Use service role for deletion to ensure it works regardless of RLS
        await base44.asServiceRole.entities.MatchParticipant.delete(participants[0].id);
        
        // Update count using service role (required as users can't usually update match entities they don't own)
        const allParticipants = await base44.asServiceRole.entities.MatchParticipant.filter({ match_id });
        if (!match.is_spontaneous) {
            await base44.asServiceRole.entities.Match.update(match_id, {
                current_players: Math.max(0, allParticipants.length)
            });
        }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function isGuest(user) {
  return !user || user.is_guest === true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { match_id, status = 'confirmed' } = await req.json();

    // Block guests from joining matches
    if (!user || isGuest(user)) {
      return Response.json({ error: 'Du måste vara inloggad för att gå med i matcher' }, { status: 401 });
    }

    // Check if match exists
    const match = await base44.entities.Match.get(match_id);
    if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });

    const participants = await base44.entities.MatchParticipant.filter({ match_id });
    
    // Check if already joined
    if (participants.some(p => p.user_id === user.id)) {
      return Response.json({ error: 'Already a participant' }, { status: 400 });
    }

    if (!match.is_spontaneous && participants.length >= match.max_players) {
      return Response.json({ error: 'Match is full' }, { status: 400 });
    }

    // Join
    await base44.entities.MatchParticipant.create({
      match_id,
      user_id: user.id,
      status
    });

    // Update player count using service role
    if (!match.is_spontaneous) {
      await base44.asServiceRole.entities.Match.update(match_id, {
        current_players: participants.length + 1
      });
    }

    // Send push notification - Non-blocking
    try {
      await base44.asServiceRole.functions.invoke('notifyMatchUpdate', {
        type: 'player_joined',
        match_id: match_id,
        user_ids: null
      });
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
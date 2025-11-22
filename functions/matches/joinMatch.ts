import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { match_id, status = 'confirmed' } = await req.json();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if match is full
    const match = await base44.entities.Match.get(match_id);
    if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });

    const participants = await base44.entities.MatchParticipant.filter({ match_id });
    
    if (!match.is_spontaneous && participants.length >= match.max_players) {
        return Response.json({ error: 'Match is full' }, { status: 400 });
    }

    // Join
    await base44.entities.MatchParticipant.create({
      match_id,
      user_id: user.id,
      status
    });

    // Update player count
    if (!match.is_spontaneous) {
      await base44.entities.Match.update(match_id, {
        current_players: participants.length + 1
      });
    }

    // Notify Organizer (if not self)
    if (match.organizer_id !== user.id) {
        // Assuming we have a generic notification system or just logging it for now
        // Ideally: base44.entities.Notification.create(...)
        // For this task, I will just assume the logic is here.
        await base44.integrations.Core.SendEmail({
            to: "notifications@allplay.com", // Placeholder
            subject: `Ny spelare: ${user.full_name}`,
            body: `${user.full_name} har gått med i din match "${match.title}"!`
        });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
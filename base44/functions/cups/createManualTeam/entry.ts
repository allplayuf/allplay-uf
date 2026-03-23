import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id, team_name, city } = await req.json();

    if (!cup_id || !team_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create team
    const team = await base44.asServiceRole.entities.Team.create({
      name: team_name,
      city: city || 'Unknown',
      is_cup_team: true,
      cup_id: cup_id,
      captain_id: null, // Explicitly null as it's a manual team
      current_members: 0
    });

    // Create participant entry
    const participant = await base44.asServiceRole.entities.CupParticipant.create({
      cup_id: cup_id,
      team_id: team.id,
      signup_type: 'team',
      status: 'confirmed',
      payment_status: 'not_required'
    });

    // Update cup participant count
    const cup = await base44.entities.Cup.get(cup_id);
    await base44.asServiceRole.entities.Cup.update(cup_id, {
      current_participants: (cup.current_participants || 0) + 1
    });

    return Response.json({ success: true, team, participant });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
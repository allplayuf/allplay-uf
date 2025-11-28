import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id, team_a_id, team_b_id, date, time, group_id, venue_id } = await req.json();

    if (!cup_id || !team_a_id || !team_b_id || !date || !time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const teamA = await base44.entities.Team.get(team_a_id);
    const teamB = await base44.entities.Team.get(team_b_id);

    // Create the Match entity
    const match = await base44.asServiceRole.entities.Match.create({
      title: `${teamA.name} vs ${teamB.name}`,
      venue_id: venue_id, // Should be passed or fetched from cup defaults
      organizer_id: user.id,
      date: date,
      time: time,
      format: '7v7', // Default or passed
      status: 'upcoming',
      is_cup_match: true, // Assuming this field exists or isn't needed for filter
      team_a_id,
      team_b_id,
      team_a_name: teamA.name, // Helper fields if schema allows
      team_b_name: teamB.name
    });

    // Create the CupMatch entity
    const cupMatch = await base44.asServiceRole.entities.CupMatch.create({
      cup_id,
      match_id: match.id,
      stage: 'group', // Defaulting to group if group_id present
      group_id: group_id,
      team_a_id,
      team_b_id,
      team_a_score: null,
      team_b_score: null
    });

    return Response.json({ success: true, match, cupMatch });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated and is admin/organizer
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ error: 'Cup ID is required' }, { status: 400 });
    }

    // Get cup
    const cup = await base44.asServiceRole.entities.Cup.get(cup_id);
    
    // Check permissions
    if (cup.organizer_id !== user.id && user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden',
        details: 'Only organizer or admin can advance to playoffs' 
      }, { status: 403 });
    }

    // Get all groups
    const groups = await base44.asServiceRole.entities.CupGroup.filter({ cup_id });
    
    if (groups.length === 0) {
      return Response.json({ 
        error: 'No groups found',
        details: 'Cannot advance to playoffs without groups' 
      }, { status: 400 });
    }

    // Collect top teams from each group
    const teamsAdvancingPerGroup = cup.teams_advance_per_group || 2;
    const advancingTeams = [];

    for (const group of groups) {
      const standings = group.standings || [];
      
      // Sort standings to ensure correct order
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      // Take top N teams
      const topTeams = standings.slice(0, teamsAdvancingPerGroup);
      advancingTeams.push(...topTeams.map(t => ({
        team_id: t.team_id,
        team_name: t.team_name,
        group_name: group.name,
        final_position: standings.indexOf(t) + 1
      })));
    }

    if (advancingTeams.length === 0) {
      return Response.json({ 
        error: 'No teams to advance',
        details: 'Group standings are empty' 
      }, { status: 400 });
    }

    // Determine playoff format based on number of teams
    const numTeams = advancingTeams.length;
    let stage = 'final';
    
    if (numTeams >= 16) stage = 'round_of_16';
    else if (numTeams >= 8) stage = 'quarterfinal';
    else if (numTeams >= 4) stage = 'semifinal';
    else if (numTeams >= 2) stage = 'final';

    // Create brackets (simplified seeding - alternating groups)
    const brackets = [];
    const matches = [];
    
    for (let i = 0; i < advancingTeams.length; i += 2) {
      if (i + 1 >= advancingTeams.length) break; // Skip if odd number

      const teamA = advancingTeams[i];
      const teamB = advancingTeams[i + 1];

      // Create Match entity first
      const match = await base44.asServiceRole.entities.Match.create({
        title: `${cup.name} - ${stage}`,
        venue_id: cup.venue_ids?.[0] || null,
        organizer_id: cup.organizer_id,
        date: cup.start_date,
        time: '18:00',
        duration_minutes: 90,
        format: cup.format,
        is_team_match: true,
        is_cup_match: true,
        status: 'upcoming',
        team_a_id: teamA.team_id,
        team_b_id: teamB.team_id
      });

      // Create CupMatch
      const cupMatch = await base44.asServiceRole.entities.CupMatch.create({
        cup_id: cup.id,
        match_id: match.id,
        stage: stage,
        team_a_id: teamA.team_id,
        team_b_id: teamB.team_id
      });

      // Create Bracket
      const bracket = await base44.asServiceRole.entities.CupBracket.create({
        cup_id: cup.id,
        cup_match_id: cupMatch.id,
        stage: stage,
        position: brackets.length + 1,
        team_a_id: teamA.team_id,
        team_b_id: teamB.team_id,
        team_a_name: teamA.team_name,
        team_b_name: teamB.team_name
      });

      brackets.push(bracket);
      matches.push(cupMatch);
    }

    // Update cup status
    await base44.asServiceRole.entities.Cup.update(cup.id, {
      status: 'ongoing',
      has_playoffs: true
    });

    // Send notification
    if (cup.notifications_enabled) {
      await base44.asServiceRole.entities.CupNotification.create({
        cup_id: cup.id,
        recipient_type: 'all',
        type: 'announcement',
        title: 'Gruppspel avslutat! 🎉',
        message: `Slutspelet börjar nu med ${advancingTeams.length} lag. Lycka till!`
      });
    }

    return Response.json({ 
      success: true,
      message: 'Successfully advanced to playoffs',
      teams_advanced: advancingTeams.length,
      brackets_created: brackets.length,
      stage: stage
    });

  } catch (error) {
    console.error('Error advancing to playoffs:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
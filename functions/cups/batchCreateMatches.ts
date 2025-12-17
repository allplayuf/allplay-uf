import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id, matches_data } = await req.json();

    if (!cup_id || !matches_data || !Array.isArray(matches_data)) {
      return Response.json({ 
        error: 'cup_id and matches_data (array) required' 
      }, { status: 400 });
    }

    // Fetch cup
    const cup = await base44.asServiceRole.entities.Cup.get(cup_id);
    if (!cup) {
      return Response.json({ error: 'Cup not found' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = user.role === 'admin';
    const isOrganizer = cup.organizer_id === user.id;
    if (!isAdmin && !isOrganizer) {
      return Response.json({ error: 'Unauthorized to manage this cup' }, { status: 403 });
    }

    const createdMatches = [];
    const errors = [];

    for (const matchData of matches_data) {
      try {
        const {
          team_a_name,
          team_b_name,
          date,
          time,
          group_name,
          stage = 'group',
          round_number
        } = matchData;

        // Find teams by name
        const participants = await base44.asServiceRole.entities.CupParticipant.filter({ 
          cup_id: cup_id,
          status: 'confirmed'
        });

        // Fetch all teams for the cup
        const allTeams = await base44.asServiceRole.entities.Team.filter({
          is_cup_team: true,
          cup_id: cup_id
        });

        const teamA = allTeams.find(t => 
          t.name?.toLowerCase().trim() === team_a_name?.toLowerCase().trim()
        );
        const teamB = allTeams.find(t => 
          t.name?.toLowerCase().trim() === team_b_name?.toLowerCase().trim()
        );

        if (!teamA || !teamB) {
          errors.push({
            match: `${team_a_name} vs ${team_b_name}`,
            error: 'One or both teams not found'
          });
          continue;
        }

        // Find group by name if provided
        let group_id = null;
        if (group_name) {
          const groups = await base44.asServiceRole.entities.CupGroup.filter({ cup_id: cup_id });
          const group = groups.find(g => g.name?.toLowerCase().trim() === group_name?.toLowerCase().trim());
          if (group) {
            group_id = group.id;
          }
        }

        // Get venue
        const venue_id = cup.venue_ids?.[0] || null;

        // Skip TBD matches (placeholder for playoffs)
        if (team_a_name === 'TBD' || team_b_name === 'TBD') {
          // Create placeholder Match entity first
          const regularMatch = await base44.asServiceRole.entities.Match.create({
            title: `${stage === 'quarterfinal' ? 'Kvartsfinal' : stage === 'semifinal' ? 'Semifinal' : 'Final'} - TBD`,
            venue_id: venue_id,
            organizer_id: cup.organizer_id,
            date: date,
            time: time,
            format: cup.format,
            max_players: 10,
            is_cup_match: true,
            status: 'upcoming'
          });

          // Create CupMatch linking to the regular Match
          const cupMatch = await base44.asServiceRole.entities.CupMatch.create({
            cup_id: cup_id,
            match_id: regularMatch.id,
            team_a_id: null,
            team_b_id: null,
            group_id: group_id,
            stage: stage
          });

          createdMatches.push({
            id: cupMatch.id,
            teams: 'TBD vs TBD',
            date,
            time,
            group: group_name,
            stage
          });
          continue;
        }

        // Create regular Match entity first
        const regularMatch = await base44.asServiceRole.entities.Match.create({
          title: `${team_a_name} vs ${team_b_name}`,
          venue_id: venue_id,
          organizer_id: cup.organizer_id,
          date: date,
          time: time,
          format: cup.format,
          max_players: 10,
          is_cup_match: true,
          is_team_match: true,
          team_a_id: teamA.id,
          team_b_id: teamB.id,
          status: 'upcoming'
        });

        // Create CupMatch linking to the regular Match
        const cupMatch = await base44.asServiceRole.entities.CupMatch.create({
          cup_id: cup_id,
          match_id: regularMatch.id,
          team_a_id: teamA.id,
          team_b_id: teamB.id,
          group_id: group_id,
          stage: stage
        });

        createdMatches.push({
          id: cupMatch.id,
          teams: `${team_a_name} vs ${team_b_name}`,
          date,
          time,
          group: group_name,
          stage
        });

      } catch (error) {
        errors.push({
          match: `${matchData.team_a_name} vs ${matchData.team_b_name}`,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      created_count: createdMatches.length,
      error_count: errors.length,
      matches: createdMatches,
      errors: errors
    });

  } catch (error) {
    console.error('Error in batchCreateMatches:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
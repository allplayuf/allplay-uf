import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { canEditCup } from '../utils/cupPermissions.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ 
        error: 'Cup ID is required' 
      }, { status: 400 });
    }

    // Check permissions
    const hasPermission = await canEditCup(base44, user, cup_id);
    if (!hasPermission) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You do not have permission to create schedule' 
      }, { status: 403 });
    }

    // Get cup and groups
    const cup = await base44.entities.Cup.get(cup_id);
    const groups = await base44.entities.CupGroup.filter({ cup_id });
    
    // Get confirmed participants
    const participants = await base44.entities.CupParticipant.filter({
      cup_id,
      status: 'confirmed'
    });

    if (participants.length < 4) {
      return Response.json({ 
        error: 'Not enough participants',
        details: 'At least 4 participants required to create schedule'
      }, { status: 400 });
    }

    // Distribute teams into groups
    const teamIds = participants.map(p => p.team_id || p.user_id);
    const teamsPerGroup = Math.ceil(teamIds.length / groups.length);
    
    for (let i = 0; i < groups.length; i++) {
      const groupTeams = teamIds.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
      
      await base44.entities.CupGroup.update(groups[i].id, {
        team_ids: groupTeams
      });

      // Update participants with group assignment
      for (const teamId of groupTeams) {
        const participant = participants.find(p => 
          (p.team_id === teamId) || (p.user_id === teamId)
        );
        if (participant) {
          await base44.entities.CupParticipant.update(participant.id, {
            group_id: groups[i].id
          });
        }
      }

      // Create round-robin matches for this group
      const matches = [];
      for (let j = 0; j < groupTeams.length; j++) {
        for (let k = j + 1; k < groupTeams.length; k++) {
          matches.push({
            team_a_id: groupTeams[j],
            team_b_id: groupTeams[k]
          });
        }
      }

      // Create match entities
      const startDate = new Date(cup.start_date);
      
      for (let m = 0; m < matches.length; m++) {
        // Create regular match first
        const match = await base44.entities.Match.create({
          title: `${cup.name} - ${groups[i].name} Match ${m + 1}`,
          venue_id: cup.venue_ids?.[0] || null,
          organizer_id: cup.organizer_id,
          date: startDate.toISOString().split('T')[0],
          time: cup.start_time || '10:00',
          format: cup.format,
          max_players: cup.format === '5v5' ? 16 : cup.format === '7v7' ? 20 : 32,
          is_team_match: true,
          is_ranked: false,
          status: 'upcoming',
          team_a_id: matches[m].team_a_id,
          team_b_id: matches[m].team_b_id
        });

        // Create cup match reference
        await base44.entities.CupMatch.create({
          cup_id,
          match_id: match.id,
          stage: 'group',
          group_id: groups[i].id,
          team_a_id: matches[m].team_a_id,
          team_b_id: matches[m].team_b_id
        });
      }
    }

    // Create playoff brackets if enabled
    if (cup.has_playoffs) {
      const advancingTeamsPerGroup = cup.teams_advance_per_group || 2;
      const totalAdvancing = groups.length * advancingTeamsPerGroup;

      // Determine playoff stages needed
      let stages = [];
      if (totalAdvancing >= 16) stages.push('round_of_16');
      if (totalAdvancing >= 8) stages.push('quarterfinal');
      if (totalAdvancing >= 4) stages.push('semifinal');
      stages.push('final', 'bronze');

      // Create bracket placeholders
      for (const stage of stages) {
        const numMatches = stage === 'final' || stage === 'bronze' ? 1 :
                          stage === 'semifinal' ? 2 :
                          stage === 'quarterfinal' ? 4 : 8;

        for (let i = 0; i < numMatches; i++) {
          await base44.entities.CupBracket.create({
            cup_id,
            stage,
            position: i + 1,
            team_a_id: null, // TBD
            team_b_id: null  // TBD
          });
        }
      }
    }

    // Update cup status
    await base44.entities.Cup.update(cup_id, {
      status: 'ongoing'
    });

    // Send notification
    if (cup.notifications_enabled) {
      await base44.entities.CupNotification.create({
        cup_id,
        recipient_type: 'all',
        type: 'schedule_update',
        title: 'Schema publicerat!',
        message: `Matchschemat för ${cup.name} är nu tillgängligt!`
      });
    }

    return Response.json({ 
      success: true,
      message: 'Schedule created successfully',
      groups_created: groups.length,
      matches_created: true
    });

  } catch (error) {
    console.error('Error creating schedule:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
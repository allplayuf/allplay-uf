import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, cup_id, group_name, group_id, team_id } = await req.json();

    if (action === 'create_group') {
      const group = await base44.asServiceRole.entities.CupGroup.create({
        cup_id,
        name: group_name,
        team_ids: [],
        standings: []
      });
      return Response.json({ success: true, group });
    }

    if (action === 'assign_team') {
      // Get current group of the team (via participant)
      const participants = await base44.entities.CupParticipant.filter({ cup_id, team_id });
      if (participants.length === 0) throw new Error("Team not in cup");
      
      const participant = participants[0];
      const oldGroupId = participant.group_id;

      // Update participant
      await base44.asServiceRole.entities.CupParticipant.update(participant.id, {
        group_id: group_id
      });

      // Remove from old group if exists
      if (oldGroupId) {
        const oldGroup = await base44.entities.CupGroup.get(oldGroupId);
        const newTeamIds = oldGroup.team_ids.filter(id => id !== team_id);
        // Also remove from standings
        const newStandings = (oldGroup.standings || []).filter(s => s.team_id !== team_id);
        await base44.asServiceRole.entities.CupGroup.update(oldGroupId, {
          team_ids: newTeamIds,
          standings: newStandings
        });
      }

      // Add to new group
      const newGroup = await base44.entities.CupGroup.get(group_id);
      if (!newGroup.team_ids.includes(team_id)) {
        const newTeamIds = [...newGroup.team_ids, team_id];
        // Add to standings
        const newStandings = [...(newGroup.standings || []), {
           team_id: team_id,
           matches_played: 0,
           wins: 0,
           draws: 0,
           losses: 0,
           goals_for: 0,
           goals_against: 0,
           goal_difference: 0,
           points: 0,
           team_name: (await base44.entities.Team.get(team_id)).name // Optimistic fetch
        }];
        
        await base44.asServiceRole.entities.CupGroup.update(group_id, {
          team_ids: newTeamIds,
          standings: newStandings
        });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
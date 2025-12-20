import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { cup_match_id } = await req.json();

    if (!cup_match_id) {
      return Response.json({ error: 'cup_match_id is required' }, { status: 400 });
    }

    // Get cup match
    const cupMatch = await base44.asServiceRole.entities.CupMatch.get(cup_match_id);
    if (!cupMatch) {
      return Response.json({ error: 'Cup match not found' }, { status: 404 });
    }

    // 1. Delete all goals for this match
    const goals = await base44.asServiceRole.entities.CupGoal.filter({ cup_match_id });
    await Promise.all(goals.map(g => base44.asServiceRole.entities.CupGoal.delete(g.id)));

    // 2. If match was reported, revert standings
    if (cupMatch.team_a_score !== null && cupMatch.stage === 'group' && cupMatch.group_id) {
      const group = await base44.asServiceRole.entities.CupGroup.get(cupMatch.group_id);
      const standings = group.standings || [];

      const teamAStanding = standings.find(s => s.team_id === cupMatch.team_a_id);
      const teamBStanding = standings.find(s => s.team_id === cupMatch.team_b_id);

      if (teamAStanding && teamBStanding) {
        // Revert match stats
        teamAStanding.matches_played--;
        teamBStanding.matches_played--;
        
        teamAStanding.goals_for -= cupMatch.team_a_score;
        teamAStanding.goals_against -= cupMatch.team_b_score;
        teamBStanding.goals_for -= cupMatch.team_b_score;
        teamBStanding.goals_against -= cupMatch.team_a_score;

        // Revert points
        if (cupMatch.team_a_score > cupMatch.team_b_score) {
          teamAStanding.wins--;
          teamAStanding.points -= 3;
          teamBStanding.losses--;
        } else if (cupMatch.team_b_score > cupMatch.team_a_score) {
          teamBStanding.wins--;
          teamBStanding.points -= 3;
          teamAStanding.losses--;
        } else {
          teamAStanding.draws--;
          teamBStanding.draws--;
          teamAStanding.points--;
          teamBStanding.points--;
        }

        teamAStanding.goal_difference = teamAStanding.goals_for - teamAStanding.goals_against;
        teamBStanding.goal_difference = teamBStanding.goals_for - teamBStanding.goals_against;

        await base44.asServiceRole.entities.CupGroup.update(cupMatch.group_id, { standings });
      }
    }

    // 3. Delete bracket entries
    const brackets = await base44.asServiceRole.entities.CupBracket.filter({ cup_match_id });
    await Promise.all(brackets.map(b => base44.asServiceRole.entities.CupBracket.delete(b.id)));

    // 4. Delete regular match if exists
    if (cupMatch.match_id) {
      await base44.asServiceRole.entities.Match.delete(cupMatch.match_id);
    }

    // 5. Delete cup match
    await base44.asServiceRole.entities.CupMatch.delete(cup_match_id);

    return Response.json({ 
      success: true,
      message: 'Cup match deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cup match:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
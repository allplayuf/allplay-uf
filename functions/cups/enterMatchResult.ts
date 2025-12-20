import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resultData = await req.json();

    // Validate input
    if (!resultData.cup_match_id || resultData.team_a_score === undefined || resultData.team_b_score === undefined) {
      return Response.json({ 
        error: 'Validation failed',
        details: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate goals array if provided
    const goals = resultData.goals || [];
    const totalScore = resultData.team_a_score + resultData.team_b_score;
    if (goals.length !== totalScore) {
      return Response.json({
        error: 'Goals count mismatch',
        details: `Expected ${totalScore} goals, got ${goals.length}`
      }, { status: 400 });
    }

    // Get cup match
    const cupMatch = await base44.asServiceRole.entities.CupMatch.get(resultData.cup_match_id);
    
    if (!cupMatch) {
      return Response.json({ 
        error: 'Cup match not found' 
      }, { status: 404 });
    }

    // Get cup to verify permissions
    const cup = await base44.asServiceRole.entities.Cup.get(cupMatch.cup_id);
    
    // Check permissions - only organizer or admin can enter results
    if (cup.organizer_id !== user.id && user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You do not have permission to enter match results' 
      }, { status: 403 });
    }

    // Determine winner - CRITICAL: Penalties decide knockout matches
    let winnerId = null;
    
    // First check regular time
    if (resultData.team_a_score > resultData.team_b_score) {
      winnerId = cupMatch.team_a_id;
    } else if (resultData.team_b_score > resultData.team_a_score) {
      winnerId = cupMatch.team_b_id;
    }
    
    // If draw and penalties were taken (knockout stage), penalty winner advances
    if (!winnerId && resultData.penalties && resultData.penalty_score) {
      const [penaltyA, penaltyB] = resultData.penalty_score.split('-').map(Number);
      if (penaltyA > penaltyB) {
        winnerId = cupMatch.team_a_id;
      } else if (penaltyB > penaltyA) {
        winnerId = cupMatch.team_b_id;
      }
    }

    // Delete existing goals for this match (for re-reporting)
    const existingGoals = await base44.asServiceRole.entities.CupGoal.filter({ cup_match_id: resultData.cup_match_id });
    await Promise.all(existingGoals.map(g => base44.asServiceRole.entities.CupGoal.delete(g.id)));

    // Create new goals and update player stats
    const playerStatsUpdates = new Map(); // Track stats updates per player

    for (const goal of goals) {
      // Create goal record
      await base44.asServiceRole.entities.CupGoal.create({
        cup_id: cupMatch.cup_id,
        cup_match_id: resultData.cup_match_id,
        team_id: goal.team_id,
        player_id: goal.player_id,
        minute: goal.minute,
        is_own_goal: goal.is_own_goal || false
      });

      // Track player stats
      if (!playerStatsUpdates.has(goal.player_id)) {
        playerStatsUpdates.set(goal.player_id, { goals: 0 });
      }
      const stats = playerStatsUpdates.get(goal.player_id);
      stats.goals++;
    }

    // Update player statistics
    for (const [playerId, stats] of playerStatsUpdates.entries()) {
      const player = await base44.asServiceRole.entities.CupPlayer.get(playerId);
      await base44.asServiceRole.entities.CupPlayer.update(playerId, {
        goals: (player.goals || 0) + stats.goals
      });
    }

    // Update cup match with service role
    await base44.asServiceRole.entities.CupMatch.update(resultData.cup_match_id, {
      team_a_score: resultData.team_a_score,
      team_b_score: resultData.team_b_score,
      extra_time: resultData.extra_time || false,
      penalties: resultData.penalties || false,
      penalty_score: resultData.penalty_score || null,
      scorers: resultData.scorers || [],
      walkover: resultData.walkover || false,
      winner_id: winnerId,
      is_live: false
    });

    // Update regular match entity with service role
    if (cupMatch.match_id) {
      await base44.asServiceRole.entities.Match.update(cupMatch.match_id, {
        status: 'completed',
        team_a_score: resultData.team_a_score,
        team_b_score: resultData.team_b_score,
        final_score: `${resultData.team_a_score}-${resultData.team_b_score}`,
        completed_at: new Date().toISOString(),
        result_reported_by: user.id
      });
    }

    // Update group standings if group stage match
    if (cupMatch.stage === 'group' && cupMatch.group_id) {
      const group = await base44.asServiceRole.entities.CupGroup.get(cupMatch.group_id);
      const standings = group.standings || [];
      
      // Find or create standings for both teams
      const getOrCreateStanding = (teamId) => {
        let standing = standings.find(s => s.team_id === teamId);
        if (!standing) {
          standing = {
            team_id: teamId,
            matches_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            points: 0
          };
          standings.push(standing);
        }
        return standing;
      };

      const teamAStanding = getOrCreateStanding(cupMatch.team_a_id);
      const teamBStanding = getOrCreateStanding(cupMatch.team_b_id);

      // Update standings
      teamAStanding.matches_played++;
      teamBStanding.matches_played++;
      
      teamAStanding.goals_for += resultData.team_a_score;
      teamAStanding.goals_against += resultData.team_b_score;
      teamBStanding.goals_for += resultData.team_b_score;
      teamBStanding.goals_against += resultData.team_a_score;

      if (resultData.team_a_score > resultData.team_b_score) {
        teamAStanding.wins++;
        teamAStanding.points += 3;
        teamBStanding.losses++;
      } else if (resultData.team_b_score > resultData.team_a_score) {
        teamBStanding.wins++;
        teamBStanding.points += 3;
        teamAStanding.losses++;
      } else {
        teamAStanding.draws++;
        teamBStanding.draws++;
        teamAStanding.points++;
        teamBStanding.points++;
      }

      teamAStanding.goal_difference = teamAStanding.goals_for - teamAStanding.goals_against;
      teamBStanding.goal_difference = teamBStanding.goals_for - teamBStanding.goals_against;

      // Sort standings by points, then goal difference
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goal_difference - a.goal_difference;
      });

      await base44.asServiceRole.entities.CupGroup.update(cupMatch.group_id, { standings });
    }

    // Update bracket if playoff match
    if (['quarterfinal', 'semifinal', 'final', 'bronze'].includes(cupMatch.stage)) {
      const brackets = await base44.asServiceRole.entities.CupBracket.filter({
        cup_match_id: resultData.cup_match_id
      });
      
      if (brackets.length > 0) {
        await base44.asServiceRole.entities.CupBracket.update(brackets[0].id, {
          winner_id: winnerId
        });

        // Advance winner to next bracket if applicable
        if (brackets[0].next_bracket_id && winnerId) {
          const nextBracket = await base44.asServiceRole.entities.CupBracket.get(brackets[0].next_bracket_id);
          
          // Determine if winner goes to team_a or team_b slot
          const updateField = nextBracket.team_a_id ? 'team_b_id' : 'team_a_id';
          
          await base44.asServiceRole.entities.CupBracket.update(brackets[0].next_bracket_id, {
            [updateField]: winnerId
          });
        }
      }

      // If this is the final match, update cup status to completed and set winner
      if (cupMatch.stage === 'final' && winnerId) {
        const winnerTeam = await base44.asServiceRole.entities.Team.get(winnerId);
        await base44.asServiceRole.entities.Cup.update(cupMatch.cup_id, {
          status: 'completed',
          winner_team_id: winnerId,
          winner_team_name: winnerTeam.name
        });
      }
    }

    return Response.json({ 
      success: true,
      message: 'Match result entered successfully',
      winner_id: winnerId
    });

  } catch (error) {
    console.error('Error entering match result:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { validateCupMatchResult } from '../utils/cupValidation.js';
import { canEnterCupMatchResult } from '../utils/cupPermissions.js';

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
    const validation = validateCupMatchResult(resultData);
    if (!validation.isValid) {
      return Response.json({ 
        error: 'Validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Get cup match
    const cupMatch = await base44.entities.CupMatch.get(resultData.cup_match_id);
    
    // Check permissions
    let hasPermission = false;
    if (user.role === 'admin') {
      hasPermission = true;
    } else {
      hasPermission = await canEnterCupMatchResult(base44, user, resultData.cup_match_id);
    }

    if (!hasPermission) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You do not have permission to enter match results' 
      }, { status: 403 });
    }

    // Determine winner
    let winnerId = null;
    if (resultData.team_a_score > resultData.team_b_score) {
      winnerId = cupMatch.team_a_id;
    } else if (resultData.team_b_score > resultData.team_a_score) {
      winnerId = cupMatch.team_b_id;
    }

    // Update cup match
    await base44.entities.CupMatch.update(resultData.cup_match_id, {
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

    // Update regular match entity
    await base44.entities.Match.update(cupMatch.match_id, {
      status: 'completed',
      final_score: `${resultData.team_a_score}-${resultData.team_b_score}`,
      completed_at: new Date().toISOString()
    });

    // Update group standings if group stage match
    if (cupMatch.stage === 'group' && cupMatch.group_id) {
      const group = await base44.entities.CupGroup.get(cupMatch.group_id);
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

      await base44.entities.CupGroup.update(cupMatch.group_id, { standings });
    }

    // Update bracket if playoff match
    if (['quarterfinal', 'semifinal', 'final', 'bronze'].includes(cupMatch.stage)) {
      const bracket = await base44.entities.CupBracket.filter({
        cup_match_id: resultData.cup_match_id
      });
      
      if (bracket.length > 0) {
        await base44.entities.CupBracket.update(bracket[0].id, {
          winner_id: winnerId
        });

        // Advance winner to next bracket if applicable
        if (bracket[0].next_bracket_id && winnerId) {
          const nextBracket = await base44.entities.CupBracket.get(bracket[0].next_bracket_id);
          
          // Determine if winner goes to team_a or team_b slot
          const updateField = nextBracket.team_a_id ? 'team_b_id' : 'team_a_id';
          
          await base44.entities.CupBracket.update(bracket[0].next_bracket_id, {
            [updateField]: winnerId
          });
        }
      }

      // If this is the final match, update cup status to completed and set winner
      if (cupMatch.stage === 'final' && winnerId) {
        const winnerTeam = await base44.entities.Team.get(winnerId);
        await base44.entities.Cup.update(cupMatch.cup_id, {
          status: 'completed',
          winner_team_id: winnerId,
          winner_team_name: winnerTeam.name
        });
      }
    }

    // Send notifications
    const cup = await base44.entities.Cup.get(cupMatch.cup_id);
    if (cup.notifications_enabled) {
      await base44.entities.CupNotification.create({
        cup_id: cupMatch.cup_id,
        recipient_type: 'all',
        type: 'result_update',
        title: 'Matchresultat inlagt',
        message: `Resultat: ${cupMatch.team_a_name} ${resultData.team_a_score} - ${resultData.team_b_score} ${cupMatch.team_b_name}`,
        match_id: cupMatch.match_id
      });
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
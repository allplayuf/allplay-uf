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
        details: 'Only organizer or admin can advance rounds' 
      }, { status: 403 });
    }

    // Get all brackets to find current stage
    const allBrackets = await base44.asServiceRole.entities.CupBracket.filter({ cup_id });
    
    if (allBrackets.length === 0) {
      return Response.json({ 
        error: 'No brackets found',
        details: 'Create initial playoff brackets first' 
      }, { status: 400 });
    }

    // Stage progression mapping
    const stageProgression = {
      'round_of_16': 'quarterfinal',
      'quarterfinal': 'semifinal',
      'semifinal': 'final'
    };

    const stageLabels = {
      'quarterfinal': 'Kvartsfinal',
      'semifinal': 'Semifinal',
      'final': 'Final'
    };

    // Find the latest completed stage
    let currentStage = null;
    let completedMatches = [];

    for (const stage of ['round_of_16', 'quarterfinal', 'semifinal']) {
      const stageBrackets = allBrackets.filter(b => b.stage === stage);
      if (stageBrackets.length === 0) continue;

      // Get matches for this stage
      const matchesPromises = stageBrackets.map(b => 
        base44.asServiceRole.entities.CupMatch.get(b.cup_match_id)
      );
      const stageMatches = await Promise.all(matchesPromises);

      // Check if all matches in this stage are completed
      const allCompleted = stageMatches.every(m => m.team_a_score !== null);
      
      if (allCompleted) {
        currentStage = stage;
        completedMatches = stageMatches;
      } else {
        break; // Stop at first incomplete stage
      }
    }

    if (!currentStage) {
      return Response.json({ 
        error: 'No completed stage found',
        details: 'Complete all matches in current stage before advancing' 
      }, { status: 400 });
    }

    const nextStage = stageProgression[currentStage];
    
    if (!nextStage) {
      return Response.json({ 
        error: 'Already at final stage',
        details: 'Tournament has reached the final' 
      }, { status: 400 });
    }

    // Check if next stage already exists
    const existingNextStage = allBrackets.filter(b => b.stage === nextStage);
    if (existingNextStage.length > 0) {
      return Response.json({ 
        error: 'Next stage already exists',
        details: `${stageLabels[nextStage]} has already been created` 
      }, { status: 400 });
    }

    // Get winners from completed matches
    const currentStageBrackets = allBrackets.filter(b => b.stage === currentStage);
    const winners = [];

    for (const bracket of currentStageBrackets) {
      const match = await base44.asServiceRole.entities.CupMatch.get(bracket.cup_match_id);
      
      // Determine winner - check penalties for knockout
      let winnerId = null;
      let winnerName = null;

      if (match.team_a_score > match.team_b_score) {
        winnerId = match.team_a_id;
        winnerName = bracket.team_a_name;
      } else if (match.team_b_score > match.team_a_score) {
        winnerId = match.team_b_id;
        winnerName = bracket.team_b_name;
      } else if (match.penalties && match.penalty_score) {
        // Draw - check penalties
        const [penA, penB] = match.penalty_score.split('-').map(Number);
        if (penA > penB) {
          winnerId = match.team_a_id;
          winnerName = bracket.team_a_name;
        } else if (penB > penA) {
          winnerId = match.team_b_id;
          winnerName = bracket.team_b_name;
        }
      }

      if (winnerId) {
        winners.push({ 
          team_id: winnerId, 
          team_name: winnerName,
          bracket_position: bracket.position 
        });
      }
    }

    if (winners.length < 2) {
      return Response.json({ 
        error: 'Not enough winners',
        details: 'Need at least 2 winners to create next round' 
      }, { status: 400 });
    }

    // Sort winners by bracket position for consistent matchups
    winners.sort((a, b) => a.bracket_position - b.bracket_position);

    // Create next stage matches
    const newBrackets = [];
    const newMatches = [];

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 >= winners.length) break;

      const teamA = winners[i];
      const teamB = winners[i + 1];

      // Create Match entity
      const match = await base44.asServiceRole.entities.Match.create({
        title: `${cup.name} - ${stageLabels[nextStage]}`,
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
        stage: nextStage,
        team_a_id: teamA.team_id,
        team_b_id: teamB.team_id
      });

      // Create Bracket
      const bracket = await base44.asServiceRole.entities.CupBracket.create({
        cup_id: cup.id,
        cup_match_id: cupMatch.id,
        stage: nextStage,
        position: newBrackets.length + 1,
        team_a_id: teamA.team_id,
        team_b_id: teamB.team_id,
        team_a_name: teamA.team_name,
        team_b_name: teamB.team_name
      });

      newBrackets.push(bracket);
      newMatches.push(cupMatch);
    }

    // If creating final, also consider creating bronze match from semi-final losers
    if (nextStage === 'final') {
      const semiBrackets = allBrackets.filter(b => b.stage === 'semifinal');
      const losers = [];

      for (const bracket of semiBrackets) {
        const match = await base44.asServiceRole.entities.CupMatch.get(bracket.cup_match_id);
        
        let loserId = null;
        let loserName = null;

        if (match.team_a_score > match.team_b_score) {
          loserId = match.team_b_id;
          loserName = bracket.team_b_name;
        } else if (match.team_b_score > match.team_a_score) {
          loserId = match.team_a_id;
          loserName = bracket.team_a_name;
        } else if (match.penalties && match.penalty_score) {
          const [penA, penB] = match.penalty_score.split('-').map(Number);
          if (penA > penB) {
            loserId = match.team_b_id;
            loserName = bracket.team_b_name;
          } else if (penB > penA) {
            loserId = match.team_a_id;
            loserName = bracket.team_a_name;
          }
        }

        if (loserId) {
          losers.push({ team_id: loserId, team_name: loserName });
        }
      }

      // Create bronze match if we have 2 losers
      if (losers.length === 2) {
        const bronzeMatch = await base44.asServiceRole.entities.Match.create({
          title: `${cup.name} - Bronsmatch`,
          venue_id: cup.venue_ids?.[0] || null,
          organizer_id: cup.organizer_id,
          date: cup.start_date,
          time: '16:00',
          duration_minutes: 90,
          format: cup.format,
          is_team_match: true,
          is_cup_match: true,
          status: 'upcoming',
          team_a_id: losers[0].team_id,
          team_b_id: losers[1].team_id
        });

        const bronzeCupMatch = await base44.asServiceRole.entities.CupMatch.create({
          cup_id: cup.id,
          match_id: bronzeMatch.id,
          stage: 'bronze',
          team_a_id: losers[0].team_id,
          team_b_id: losers[1].team_id
        });

        await base44.asServiceRole.entities.CupBracket.create({
          cup_id: cup.id,
          cup_match_id: bronzeCupMatch.id,
          stage: 'bronze',
          position: 1,
          team_a_id: losers[0].team_id,
          team_b_id: losers[1].team_id,
          team_a_name: losers[0].team_name,
          team_b_name: losers[1].team_name
        });
      }
    }

    // Send notification
    if (cup.notifications_enabled) {
      await base44.asServiceRole.entities.CupNotification.create({
        cup_id: cup.id,
        recipient_type: 'all',
        type: 'announcement',
        title: `${stageLabels[nextStage]} skapad! 🏆`,
        message: `${winners.length} lag har gått vidare till ${stageLabels[nextStage]}. Lycka till!`
      });
    }

    return Response.json({ 
      success: true,
      message: `Successfully advanced to ${nextStage}`,
      previous_stage: currentStage,
      next_stage: nextStage,
      matches_created: newBrackets.length,
      winners_advanced: winners.length
    });

  } catch (error) {
    console.error('Error advancing to next round:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
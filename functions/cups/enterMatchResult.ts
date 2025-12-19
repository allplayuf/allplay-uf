import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_match_id, team_a_score, team_b_score, extra_time, penalties, penalty_score, goals } = await req.json();

    if (!cup_match_id || team_a_score === undefined || team_b_score === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get cup match
    const cupMatch = await base44.asServiceRole.entities.CupMatch.get(cup_match_id);
    
    // Check permissions
    const cup = await base44.asServiceRole.entities.Cup.get(cupMatch.cup_id);
    const isAdmin = user.role === 'admin';
    const isOrganizer = cup.organizer_id === user.id;
    
    if (!isAdmin && !isOrganizer) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update cup match
    await base44.asServiceRole.entities.CupMatch.update(cup_match_id, {
      team_a_score,
      team_b_score,
      extra_time: extra_time || false,
      penalties: penalties || false,
      penalty_score: penalty_score || null
    });

    // Update regular Match entity if it exists
    if (cupMatch.match_id) {
      await base44.asServiceRole.entities.Match.update(cupMatch.match_id, {
        team_a_score,
        team_b_score,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }

    // Process goals if provided
    if (goals && Array.isArray(goals) && goals.length > 0) {
      // Delete existing goals for this match
      const existingGoals = await base44.asServiceRole.entities.CupGoal.filter({
        match_id: cup_match_id
      });
      
      for (const goal of existingGoals) {
        await base44.asServiceRole.entities.CupGoal.delete(goal.id);
      }

      // Create new goals and update player stats
      const playerGoalsCount = {};
      
      for (const goal of goals) {
        const player = await base44.asServiceRole.entities.CupPlayer.get(goal.player_id);
        
        // Create goal record
        await base44.asServiceRole.entities.CupGoal.create({
          cup_id: cupMatch.cup_id,
          match_id: cup_match_id,
          team_id: goal.team_id,
          player_id: goal.player_id,
          player_name: player.name,
          minute: parseInt(goal.minute)
        });

        // Count goals per player
        playerGoalsCount[goal.player_id] = (playerGoalsCount[goal.player_id] || 0) + 1;
      }

      // Update player goal stats
      for (const [playerId, goalCount] of Object.entries(playerGoalsCount)) {
        const player = await base44.asServiceRole.entities.CupPlayer.get(playerId);
        
        // Recalculate total goals from all matches
        const allPlayerGoals = await base44.asServiceRole.entities.CupGoal.filter({
          cup_id: cupMatch.cup_id,
          player_id: playerId
        });

        await base44.asServiceRole.entities.CupPlayer.update(playerId, {
          goals: allPlayerGoals.length
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Match result saved successfully'
    });

  } catch (error) {
    console.error('Error saving match result:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
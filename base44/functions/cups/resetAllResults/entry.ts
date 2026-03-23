import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ error: 'cup_id is required' }, { status: 400 });
    }

    // 1. Delete all goals for this cup
    const allGoals = await base44.asServiceRole.entities.CupGoal.filter({ cup_id });
    await Promise.all(allGoals.map(g => base44.asServiceRole.entities.CupGoal.delete(g.id)));

    // 2. Reset all cup matches (with rate limiting)
    const cupMatches = await base44.asServiceRole.entities.CupMatch.filter({ cup_id });
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < cupMatches.length; i++) {
      await base44.asServiceRole.entities.CupMatch.update(cupMatches[i].id, {
        team_a_score: null,
        team_b_score: null,
        extra_time: false,
        penalties: false,
        penalty_score: null,
        scorers: [],
        walkover: false,
        winner_id: null,
        is_live: false
      });
      
      // Small delay every 5 matches to avoid rate limits
      if ((i + 1) % 5 === 0) {
        await delay(100);
      }
    }

    // 3. Reset all group standings
    const groups = await base44.asServiceRole.entities.CupGroup.filter({ cup_id });
    await Promise.all(groups.map(g => 
      base44.asServiceRole.entities.CupGroup.update(g.id, {
        standings: []
      })
    ));

    // 4. Reset all brackets
    const brackets = await base44.asServiceRole.entities.CupBracket.filter({ cup_id });
    await Promise.all(brackets.map(b => 
      base44.asServiceRole.entities.CupBracket.update(b.id, {
        winner_id: null
      })
    ));

    // 5. Reset all player stats
    const players = await base44.asServiceRole.entities.CupPlayer.filter({ cup_id });
    await Promise.all(players.map(p => 
      base44.asServiceRole.entities.CupPlayer.update(p.id, {
        goals: 0,
        assists: 0,
        matches_played: 0
      })
    ));

    // 6. Update regular matches to upcoming status (with rate limiting)
    for (let i = 0; i < cupMatches.length; i++) {
      if (cupMatches[i].match_id) {
        await base44.asServiceRole.entities.Match.update(cupMatches[i].match_id, {
          status: 'upcoming',
          team_a_score: null,
          team_b_score: null,
          final_score: null,
          completed_at: null,
          result_reported_by: null
        });
        
        // Small delay every 5 matches to avoid rate limits
        if ((i + 1) % 5 === 0) {
          await delay(100);
        }
      }
    }

    return Response.json({ 
      success: true,
      message: 'All cup results have been reset',
      stats: {
        goals_deleted: allGoals.length,
        matches_reset: cupMatches.length,
        groups_reset: groups.length,
        players_reset: players.length
      }
    });

  } catch (error) {
    console.error('Error resetting cup results:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
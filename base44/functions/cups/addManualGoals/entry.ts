import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { cup_match_id, goals } = await req.json();

    if (!cup_match_id || !goals || !Array.isArray(goals)) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get cup match
    const cupMatch = await base44.asServiceRole.entities.CupMatch.get(cup_match_id);
    if (!cupMatch) {
      return Response.json({ error: 'Cup match not found' }, { status: 404 });
    }

    // Create goals with manual data
    for (const goal of goals) {
      await base44.asServiceRole.entities.CupGoal.create({
        cup_id: cupMatch.cup_id,
        cup_match_id: cup_match_id,
        team_name: goal.team_name,
        player_name: goal.player_name,
        player_number: goal.player_number || null,
        minute: goal.minute,
        is_own_goal: false
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error adding manual goals:', error);
    return Response.json({ 
      error: error.message || 'Failed to add goals' 
    }, { status: 500 });
  }
});
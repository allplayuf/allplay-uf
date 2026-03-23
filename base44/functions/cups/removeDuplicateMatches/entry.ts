import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ error: 'cup_id required' }, { status: 400 });
    }

    // Check permissions
    const cup = await base44.asServiceRole.entities.Cup.get(cup_id);
    const isAdmin = user.role === 'admin';
    const isOrganizer = cup.organizer_id === user.id;
    if (!isAdmin && !isOrganizer) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all cup matches
    const cupMatches = await base44.asServiceRole.entities.CupMatch.filter({ 
      cup_id: cup_id 
    });

    console.log(`Found ${cupMatches.length} total matches`);

    // Find duplicates based on team_a_id, team_b_id, stage, group_id
    const seen = new Map();
    const duplicates = [];
    const keep = [];

    for (const match of cupMatches) {
      const key = `${match.team_a_id}_${match.team_b_id}_${match.stage}_${match.group_id || 'no_group'}`;
      
      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        duplicates.push(match);
      } else {
        // First occurrence - keep it
        seen.set(key, match);
        keep.push(match);
      }
    }

    console.log(`Keeping ${keep.length} matches, deleting ${duplicates.length} duplicates`);

    // Delete duplicates
    for (const duplicate of duplicates) {
      // Delete the Match entity first if it exists
      if (duplicate.match_id) {
        try {
          await base44.asServiceRole.entities.Match.delete(duplicate.match_id);
        } catch (err) {
          console.error(`Failed to delete Match ${duplicate.match_id}:`, err);
        }
      }
      
      // Delete CupMatch
      await base44.asServiceRole.entities.CupMatch.delete(duplicate.id);
    }

    return Response.json({
      success: true,
      total_matches: cupMatches.length,
      kept: keep.length,
      deleted: duplicates.length,
      message: `Tog bort ${duplicates.length} dubbletter, behöll ${keep.length} matcher`
    });

  } catch (error) {
    console.error('Error removing duplicates:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
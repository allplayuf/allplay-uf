import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { dryRun = false } = await req.json().catch(() => ({}));

    const results = {
      cups_found: 0,
      cups_removed: 0,
      participants_removed: 0,
      groups_removed: 0,
      matches_removed: 0,
      cup_matches_removed: 0,
      brackets_removed: 0,
      teams_cleaned: 0,
      errors: []
    };

    // 1. Find all cups
    const allCups = await base44.asServiceRole.entities.Cup.list();
    results.cups_found = allCups.length;

    if (dryRun) {
      return Response.json({
        success: true,
        message: 'Dry run complete - no data was deleted',
        preview: results,
        cups_to_delete: allCups.map(c => ({ id: c.id, name: c.name, status: c.status }))
      });
    }

    // 2. For each cup, clean up all related data
    for (const cup of allCups) {
      try {
        // Remove cup participants
        const cupParticipants = await base44.asServiceRole.entities.CupParticipant.filter({ cup_id: cup.id });
        for (const participant of cupParticipants) {
          await base44.asServiceRole.entities.CupParticipant.delete(participant.id);
          results.participants_removed++;
        }

        // Remove cup groups
        const cupGroups = await base44.asServiceRole.entities.CupGroup.filter({ cup_id: cup.id });
        for (const group of cupGroups) {
          await base44.asServiceRole.entities.CupGroup.delete(group.id);
          results.groups_removed++;
        }

        // Remove cup matches
        const cupMatches = await base44.asServiceRole.entities.CupMatch.filter({ cup_id: cup.id });
        for (const cupMatch of cupMatches) {
          // Delete the actual match if it exists
          if (cupMatch.match_id) {
            try {
              await base44.asServiceRole.entities.Match.delete(cupMatch.match_id);
              results.matches_removed++;
            } catch (err) {
              console.error(`Failed to delete match ${cupMatch.match_id}:`, err);
            }
          }
          await base44.asServiceRole.entities.CupMatch.delete(cupMatch.id);
          results.cup_matches_removed++;
        }

        // Remove cup brackets
        const cupBrackets = await base44.asServiceRole.entities.CupBracket.filter({ cup_id: cup.id });
        for (const bracket of cupBrackets) {
          await base44.asServiceRole.entities.CupBracket.delete(bracket.id);
          results.brackets_removed++;
        }

        // Clean up teams that were created specifically for this cup
        const allTeams = await base44.asServiceRole.entities.Team.list();
        const cupTeams = allTeams.filter(t => t.is_cup_team === true && t.cup_id === cup.id);
        for (const team of cupTeams) {
          // Remove team members
          const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ team_id: team.id });
          for (const member of teamMembers) {
            await base44.asServiceRole.entities.TeamMember.delete(member.id);
          }
          
          // Delete the team
          await base44.asServiceRole.entities.Team.delete(team.id);
          results.teams_cleaned++;
        }

        // Finally, delete the cup itself
        await base44.asServiceRole.entities.Cup.delete(cup.id);
        results.cups_removed++;

      } catch (error) {
        console.error(`Error cleaning cup ${cup.id}:`, error);
        results.errors.push({
          cup_id: cup.id,
          cup_name: cup.name,
          error: error.message
        });
      }
    }

    // 3. Clean up any orphaned data (matches/participants without valid cups)
    try {
      const allMatches = await base44.asServiceRole.entities.Match.list();
      const validCupIds = new Set(allCups.map(c => c.id));
      
      for (const match of allMatches) {
        if (match.is_cup_match && match.cup_id && !validCupIds.has(match.cup_id)) {
          // Match references a non-existent cup - clear the reference
          await base44.asServiceRole.entities.Match.update(match.id, {
            is_cup_match: false,
            cup_id: null
          });
        }
      }
    } catch (error) {
      console.error('Error cleaning orphaned matches:', error);
      results.errors.push({
        operation: 'orphaned_matches_cleanup',
        error: error.message
      });
    }

    return Response.json({
      success: true,
      message: 'Cleanup completed successfully',
      results
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    return Response.json({
      error: error.message || 'Internal server error',
      details: error.toString()
    }, { status: 500 });
  }
});
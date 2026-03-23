/**
 * Delete Match with Cleanup
 * Safely deletes a match and all related records (participants, etc.)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const { matchId } = await req.json();
    
    if (!matchId) {
      return Response.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Use service role for fetching match to avoid RLS issues
    const match = await base44.asServiceRole.entities.Match.get(matchId);

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Authorization check: Admin or Organizer
    if (user.role !== 'admin' && match.organizer_id !== user.id) {
      return Response.json({ error: 'You do not have permission to delete this match' }, { status: 403 });
    }

    // --- DELETION LOGIC (Using Service Role for everything) ---
    // Using explicit calls to avoid any dynamic property access issues

    const deleteRecords = async (entityName, filter) => {
      try {
        // Direct access to entity to ensure it exists
        const entity = base44.asServiceRole.entities[entityName];
        if (!entity) {
            console.warn(`Entity ${entityName} not found in SDK`);
            return;
        }

        const records = await entity.filter(filter);
        if (records && records.length > 0) {
            console.log(`Deleting ${records.length} records from ${entityName}`);
            for (const record of records) {
                await entity.delete(record.id);
            }
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${entityName}:`, error.message);
        // Continue execution even if this fails
      }
    };

    // 1. Match Participants
    await deleteRecords('MatchParticipant', { match_id: matchId });

    // 2. Cup Matches
    await deleteRecords('CupMatch', { match_id: matchId });

    // 3. Match Result Verifications
    await deleteRecords('MatchResultVerification', { match_id: matchId });

    // 4. MVP Votes
    await deleteRecords('MVPVote', { match_id: matchId });

    // 5. Check Ins
    await deleteRecords('CheckIn', { match_id: matchId });

    // 6. Match Invitations
    await deleteRecords('MatchInvitation', { match_id: matchId });

    // 7. Match Results
    await deleteRecords('MatchResult', { match_id: matchId });

    // 8. Elo History
    await deleteRecords('EloHistory', { match_id: matchId });

    // 9. Reports
    await deleteRecords('Report', { match_id: matchId });

    // 10. Team Highlights (linked to match)
    await deleteRecords('TeamHighlight', { match_id: matchId });

    // 11. Team Challenges (linked to match)
    await deleteRecords('TeamChallenge', { match_id: matchId });

    // Finally, delete the match itself
    try {
      await base44.asServiceRole.entities.Match.delete(matchId);
    } catch (error) {
      console.error('Failed to delete Match record:', error);
      throw new Error('Failed to delete the match record itself: ' + error.message);
    }
    
    return Response.json({
      success: true,
      message: 'Match and all related records deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting match:', error);
    return Response.json(
      { error: error.message || 'Failed to delete match' },
      { status: 500 }
    );
  }
});
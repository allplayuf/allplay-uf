import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function should be called by a scheduled task to process account deletions
// after the 30-day grace period

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run this cleanup
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    
    // Find users with deletion scheduled in the past
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersToDelete = allUsers.filter(u => 
      u.account_deletion_scheduled && 
      new Date(u.account_deletion_scheduled) <= now &&
      u.status === 'pending_deletion'
    );

    console.log(`Found ${usersToDelete.length} accounts ready for deletion`);

    const results = [];

    for (const targetUser of usersToDelete) {
      try {
        // Anonymize match participations
        const participations = await base44.asServiceRole.entities.MatchParticipant.filter({ 
          user_id: targetUser.id 
        });
        for (const p of participations) {
          await base44.asServiceRole.entities.MatchParticipant.update(p.id, {
            user_id: `deleted_${targetUser.id.slice(0, 8)}`,
            user_display_name: 'Raderad användare',
            profile_image_url: null
          });
        }

        // Anonymize MVP votes
        try {
          const mvpVotes = await base44.asServiceRole.entities.MvpVote.filter({ 
            voted_for_id: targetUser.id 
          });
          for (const v of mvpVotes) {
            await base44.asServiceRole.entities.MvpVote.update(v.id, {
              voted_for_id: `deleted_${targetUser.id.slice(0, 8)}`
            });
          }
        } catch (e) {
          // MvpVote entity might not exist
        }

        // Delete user badges
        try {
          const badges = await base44.asServiceRole.entities.UserBadge.filter({ 
            user_id: targetUser.id 
          });
          for (const b of badges) {
            await base44.asServiceRole.entities.UserBadge.delete(b.id);
          }
        } catch (e) {
          // UserBadge entity might not exist
        }

        // Delete ELO history
        try {
          const eloHistory = await base44.asServiceRole.entities.EloHistory.filter({ 
            user_id: targetUser.id 
          });
          for (const e of eloHistory) {
            await base44.asServiceRole.entities.EloHistory.delete(e.id);
          }
        } catch (e) {
          // EloHistory entity might not exist
        }

        // Delete chat messages or anonymize
        try {
          const messages = await base44.asServiceRole.entities.ChatMessage.filter({ 
            sender_id: targetUser.id 
          });
          for (const m of messages) {
            await base44.asServiceRole.entities.ChatMessage.update(m.id, {
              sender_id: `deleted_${targetUser.id.slice(0, 8)}`,
              sender_name: 'Raderad användare'
            });
          }
        } catch (e) {
          // ChatMessage entity might not exist
        }

        // Delete blocked user records
        const blocksAsBlocker = await base44.asServiceRole.entities.BlockedUser.filter({ 
          blocker_id: targetUser.id 
        });
        const blocksAsBlocked = await base44.asServiceRole.entities.BlockedUser.filter({ 
          blocked_id: targetUser.id 
        });
        for (const b of [...blocksAsBlocker, ...blocksAsBlocked]) {
          await base44.asServiceRole.entities.BlockedUser.delete(b.id);
        }

        // Update reports to anonymize
        const reportsAsReporter = await base44.asServiceRole.entities.Report.filter({ 
          reporter_id: targetUser.id 
        });
        for (const r of reportsAsReporter) {
          await base44.asServiceRole.entities.Report.update(r.id, {
            reporter_id: `deleted_${targetUser.id.slice(0, 8)}`
          });
        }

        // Clear sensitive user data (anonymize instead of delete to maintain referential integrity)
        await base44.asServiceRole.entities.User.update(targetUser.id, {
          full_name: 'Raderad användare',
          display_name: 'Raderad användare',
          email: `deleted_${targetUser.id}@deleted.allplay.se`,
          phone_number: null,
          date_of_birth: null,
          birth_year: null,
          bio: null,
          city: null,
          cityNormalized: null,
          nationality: null,
          profile_image_url: null,
          instagram_handle: null,
          favorite_club: null,
          favorite_positions: [],
          preferred_match_types: [],
          availability: [],
          referral_code: null,
          referred_by: null,
          status: 'deleted',
          blocked: true
        });

        console.log('AUDIT LOG:', {
          action: 'ACCOUNT_DELETED',
          user_id: targetUser.id,
          original_email: targetUser.email,
          timestamp: new Date().toISOString()
        });

        results.push({
          userId: targetUser.id,
          status: 'deleted',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Error deleting user ${targetUser.id}:`, error);
        results.push({
          userId: targetUser.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      processedCount: usersToDelete.length,
      results
    });

  } catch (error) {
    console.error('Error in executeAccountDeletion:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
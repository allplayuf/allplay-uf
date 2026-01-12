import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmEmail } = await req.json();

    // Verify email matches
    if (confirmEmail !== user.email) {
      return Response.json({ error: 'Email bekräftelse misslyckades' }, { status: 400 });
    }

    // Schedule deletion for 30 days (grace period)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // Mark account for deletion
    await base44.asServiceRole.entities.User.update(user.id, {
      account_deletion_requested: new Date().toISOString(),
      account_deletion_scheduled: deletionDate.toISOString(),
      status: 'pending_deletion'
    });

    // Anonymize user participation in matches (keep match history but remove personal info)
    const participations = await base44.asServiceRole.entities.MatchParticipant.filter({ user_id: user.id });
    for (const p of participations) {
      await base44.asServiceRole.entities.MatchParticipant.update(p.id, {
        user_display_name: 'Raderad användare'
      });
    }

    // Remove from active teams
    const teamMemberships = await base44.asServiceRole.entities.TeamMember.filter({ user_id: user.id, status: 'active' });
    for (const tm of teamMemberships) {
      await base44.asServiceRole.entities.TeamMember.update(tm.id, { status: 'left' });
      
      // Update team member count
      const team = await base44.asServiceRole.entities.Team.get(tm.team_id);
      if (team) {
        await base44.asServiceRole.entities.Team.update(tm.team_id, {
          current_members: Math.max(0, (team.current_members || 1) - 1)
        });
      }
    }

    // Delete friendships
    const friendships1 = await base44.asServiceRole.entities.Friendship.filter({ requester_id: user.id });
    const friendships2 = await base44.asServiceRole.entities.Friendship.filter({ addressee_id: user.id });
    
    for (const f of [...friendships1, ...friendships2]) {
      await base44.asServiceRole.entities.Friendship.delete(f.id);
    }

    // Anonymize chat messages (keep content for context but remove sender info)
    // Note: In production, you might want to fully delete or keep anonymized based on policy

    console.log('AUDIT LOG:', {
      action: 'ACCOUNT_DELETION_REQUESTED',
      user_id: user.id,
      user_email: user.email,
      scheduled_deletion: deletionDate.toISOString(),
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Konto markerat för radering',
      deletion_scheduled: deletionDate.toISOString()
    });

  } catch (error) {
    console.error('Error in deleteAccount:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
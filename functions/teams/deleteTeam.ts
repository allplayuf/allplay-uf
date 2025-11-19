import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await req.json();

    if (!teamId) {
      return Response.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Get team to check permissions
    const team = await base44.asServiceRole.entities.Team.get(teamId);

    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    // AUTHORIZATION CHECK
    const isCaptain = team.captain_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isCaptain && !isAdmin) {
      return Response.json({ error: 'Only captain or admin can delete team' }, { status: 403 });
    }

    // CLEANUP: Delete all related records first
    const members = await base44.asServiceRole.entities.TeamMember.filter({ team_id: teamId });
    
    for (const member of members) {
      await base44.asServiceRole.entities.TeamMember.delete(member.id);
    }

    // Delete team messages
    const messages = await base44.asServiceRole.entities.TeamMessage.filter({ team_id: teamId });
    for (const message of messages) {
      await base44.asServiceRole.entities.TeamMessage.delete(message.id);
    }

    // Delete team invitations
    const invitations = await base44.asServiceRole.entities.TeamInvitation.filter({ team_id: teamId });
    for (const invitation of invitations) {
      await base44.asServiceRole.entities.TeamInvitation.delete(invitation.id);
    }

    // Soft delete the team (preserve data)
    await base44.asServiceRole.entities.Team.update(teamId, {
      is_active: false,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    });

    return Response.json({ 
      success: true,
      deleted: {
        members: members.length,
        messages: messages.length,
        invitations: invitations.length
      }
    });

  } catch (error) {
    console.error('Delete team error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
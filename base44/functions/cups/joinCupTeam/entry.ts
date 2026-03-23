import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id, team_id } = await req.json();

    if (!cup_id || !team_id) {
      return Response.json({ error: 'Missing cup_id or team_id' }, { status: 400 });
    }

    // Verify cup exists
    const cup = await base44.entities.Cup.get(cup_id);
    
    // Check if registration is closed
    if (cup.status === 'registration_closed') {
      return Response.json({ error: 'Anmälan är stängd för denna turnering' }, { status: 403 });
    }
    
    // Verify team exists and is in the cup
    const participation = await base44.entities.CupParticipant.filter({
        cup_id,
        team_id
    });

    if (participation.length === 0) {
        return Response.json({ error: 'Team is not participating in this cup' }, { status: 400 });
    }

    // Check if user is already a member of this team
    const existingMembership = await base44.entities.TeamMember.filter({
        team_id: team_id,
        user_id: user.id
    });

    if (existingMembership.length > 0) {
        const member = existingMembership[0];
        if (member.status !== 'active') {
             // Auto-accept/activate
             await base44.asServiceRole.entities.TeamMember.update(member.id, {
                 status: 'active'
             });
             return Response.json({ success: true, message: 'Joined team successfully (activated)' });
        }
        return Response.json({ error: 'Already a member of this team' }, { status: 400 });
    }

    // Get team to check if captain approval is needed
    const team = await base44.asServiceRole.entities.Team.get(team_id);
    const isCaptain = team.captain_id === user.id;
    const isViceCaptain = team.vice_captain_ids && team.vice_captain_ids.includes(user.id);
    
    // Create membership - auto-approve if captain/vice-captain, otherwise pending
    await base44.asServiceRole.entities.TeamMember.create({
        team_id: team_id,
        user_id: user.id,
        role: 'member',
        status: (isCaptain || isViceCaptain) ? 'active' : 'pending',
        joined_at: new Date().toISOString()
    });

    // Increment team member count only if approved immediately
    if (isCaptain || isViceCaptain) {
      await base44.asServiceRole.entities.Team.update(team_id, {
          current_members: (team.current_members || 0) + 1
      });
    }

    return Response.json({ 
      success: true, 
      message: (isCaptain || isViceCaptain) ? 'Joined team successfully' : 'Request sent to team captain for approval',
      needs_approval: !(isCaptain || isViceCaptain)
    });

  } catch (error) {
    console.error('Error joining cup team:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
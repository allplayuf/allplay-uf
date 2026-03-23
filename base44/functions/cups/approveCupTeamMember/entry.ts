import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participant_id, action } = await req.json();

    if (!participant_id || !action) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'participant_id and action (approve/reject) are required'
      }, { status: 400 });
    }

    // Get participant
    const participant = await base44.asServiceRole.entities.CupParticipant.get(participant_id);
    
    if (!participant || !participant.team_id) {
      return Response.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Get team to verify captain
    const team = await base44.asServiceRole.entities.Team.get(participant.team_id);
    
    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is captain or vice captain
    const isCaptain = team.captain_id === user.id;
    const isViceCaptain = team.vice_captain_ids && team.vice_captain_ids.includes(user.id);
    const isAdmin = user.role === 'admin';

    if (!isCaptain && !isViceCaptain && !isAdmin) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'Only team captain, vice captain, or admin can approve members'
      }, { status: 403 });
    }

    if (action === 'approve') {
      // Approve the participant
      await base44.asServiceRole.entities.CupParticipant.update(participant_id, {
        captain_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        status: 'confirmed'
      });

      return Response.json({ 
        success: true,
        message: 'Team member approved successfully'
      });

    } else if (action === 'reject') {
      // Reject the participant
      await base44.asServiceRole.entities.CupParticipant.update(participant_id, {
        status: 'rejected'
      });

      return Response.json({ 
        success: true,
        message: 'Team member rejected'
      });

    } else {
      return Response.json({ 
        error: 'Invalid action',
        details: 'Action must be either approve or reject'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing cup team member:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
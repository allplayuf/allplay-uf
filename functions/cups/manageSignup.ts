import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participant_id, action, group_id } = await req.json();

    if (!participant_id || !action) {
      return Response.json({ 
        error: 'Participant ID and action are required' 
      }, { status: 400 });
    }

    // Get participant using service role to ensure we can read it
    const participant = await base44.asServiceRole.entities.CupParticipant.get(participant_id);
    
    // Get cup to check permissions
    const cup = await base44.entities.Cup.get(participant.cup_id);
    
    // Check if user is organizer or admin
    const isOrganizer = cup.organizer_id === user.id;
    const isAdmin = user.role === 'admin';
    
    if (!isOrganizer && !isAdmin) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You do not have permission to manage signups' 
      }, { status: 403 });
    }

    // Perform action using service role for elevated permissions
    switch (action) {
      case 'approve':
        await base44.asServiceRole.entities.CupParticipant.update(participant_id, { 
          status: 'confirmed' 
        });
        
        // Update cup participant count
        const confirmedCount = await base44.asServiceRole.entities.CupParticipant.filter({
          cup_id: participant.cup_id,
          status: 'confirmed'
        });
        
        await base44.asServiceRole.entities.Cup.update(participant.cup_id, {
          current_participants: confirmedCount.length
        });
        
        // Send notification if enabled
        if (cup.notifications_enabled) {
          await base44.asServiceRole.entities.CupNotification.create({
            cup_id: participant.cup_id,
            recipient_id: participant.user_id || participant.team_id,
            recipient_type: participant.signup_type === 'solo' ? 'user' : 'team',
            type: 'announcement',
            title: 'Anmälan godkänd!',
            message: `Din anmälan till ${cup.name} har godkänts!`
          });
        }
        break;

      case 'reject':
        await base44.asServiceRole.entities.CupParticipant.update(participant_id, { 
          status: 'rejected' 
        });
        
        // Decrease cup participant count
        const currentCount = cup.current_participants || 0;
        if (currentCount > 0) {
          await base44.asServiceRole.entities.Cup.update(participant.cup_id, {
            current_participants: currentCount - 1
          });
        }
        break;

      case 'assign_group':
        if (!group_id) {
          return Response.json({ 
            error: 'Group ID required for assign_group action' 
          }, { status: 400 });
        }
        
        await base44.asServiceRole.entities.CupParticipant.update(participant_id, { 
          group_id 
        });
        
        // Update group's team_ids
        const group = await base44.asServiceRole.entities.CupGroup.get(group_id);
        const updatedTeamIds = [...(group.team_ids || [])];
        
        if (participant.team_id && !updatedTeamIds.includes(participant.team_id)) {
          updatedTeamIds.push(participant.team_id);
          await base44.asServiceRole.entities.CupGroup.update(group_id, {
            team_ids: updatedTeamIds
          });
        }
        break;

      default:
        return Response.json({ 
          error: 'Invalid action',
          valid_actions: ['approve', 'reject', 'assign_group']
        }, { status: 400 });
    }

    return Response.json({ 
      success: true,
      message: `Action ${action} completed successfully`
    });

  } catch (error) {
    console.error('Error managing signup:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ 
        error: 'Cup ID is required' 
      }, { status: 400 });
    }

    // Fetch cup
    const cup = await base44.entities.Cup.get(cup_id);
    
    // Check permissions - only organizer or admin can delete
    if (cup.organizer_id !== user.id && user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden',
        details: 'Only the organizer or an admin can delete this tournament'
      }, { status: 403 });
    }

    // Don't allow deletion if tournament is ongoing or completed
    if (cup.status === 'ongoing') {
      return Response.json({ 
        error: 'Cannot delete ongoing tournament',
        details: 'You cannot delete a tournament that is currently in progress'
      }, { status: 400 });
    }

    if (cup.status === 'completed') {
      return Response.json({ 
        error: 'Cannot delete completed tournament',
        details: 'You cannot delete a completed tournament'
      }, { status: 400 });
    }

    // Delete related data using service role
    const [participants, groups, matches, brackets, notifications] = await Promise.all([
      base44.asServiceRole.entities.CupParticipant.filter({ cup_id }),
      base44.asServiceRole.entities.CupGroup.filter({ cup_id }),
      base44.asServiceRole.entities.CupMatch.filter({ cup_id }),
      base44.asServiceRole.entities.CupBracket.filter({ cup_id }),
      base44.asServiceRole.entities.CupNotification.filter({ cup_id })
    ]);

    // Delete all related records
    await Promise.all([
      ...participants.map(p => base44.asServiceRole.entities.CupParticipant.delete(p.id)),
      ...groups.map(g => base44.asServiceRole.entities.CupGroup.delete(g.id)),
      ...matches.map(m => base44.asServiceRole.entities.CupMatch.delete(m.id)),
      ...brackets.map(b => base44.asServiceRole.entities.CupBracket.delete(b.id)),
      ...notifications.map(n => base44.asServiceRole.entities.CupNotification.delete(n.id))
    ]);

    // Delete the cup itself
    await base44.asServiceRole.entities.Cup.delete(cup_id);

    return Response.json({ 
      success: true,
      message: 'Tournament deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cup:', error);
    return Response.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});
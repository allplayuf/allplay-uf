import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id, updates } = await req.json();

    if (!cup_id || !updates) {
      return Response.json({ 
        error: 'Cup ID and updates are required' 
      }, { status: 400 });
    }

    // Fetch cup
    const cup = await base44.entities.Cup.get(cup_id);
    
    // Check permissions - only organizer or admin can update
    if (cup.organizer_id !== user.id && user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden',
        details: 'Only the organizer or an admin can update this tournament'
      }, { status: 403 });
    }

    // Sanitize and prepare updates
    const allowedUpdates = {
      name: updates.name?.trim(),
      description: updates.description?.trim(),
      location: updates.location?.trim(),
      logo_url: updates.logo_url,
      start_date: updates.start_date,
      end_date: updates.end_date,
      start_time: updates.start_time,
      rules: updates.rules?.trim(),
      prize: updates.prize?.trim(),
      entry_fee: updates.entry_fee !== undefined ? parseFloat(updates.entry_fee) : undefined,
      max_participants: updates.max_participants !== undefined ? parseInt(updates.max_participants) : undefined,
      is_public: updates.is_public,
      status: updates.status,
    };

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
    );

    // Update cup using service role
    const updatedCup = await base44.asServiceRole.entities.Cup.update(cup_id, cleanUpdates);

    return Response.json({ 
      success: true,
      cup: updatedCup
    });

  } catch (error) {
    console.error('Error updating cup:', error);
    return Response.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});
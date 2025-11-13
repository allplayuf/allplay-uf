import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { guestId } = body;

    if (!guestId) {
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'guestId krävs'
        }
      }, { status: 400 });
    }

    // Find and update guest session
    const sessions = await base44.asServiceRole.entities.GuestSession.filter({ guest_id: guestId });
    
    if (sessions.length === 0) {
      return Response.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Gästsession hittades inte'
        }
      }, { status: 404 });
    }

    const session = sessions[0];
    
    await base44.asServiceRole.entities.GuestSession.update(session.id, {
      last_seen_at: new Date().toISOString()
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Update last seen error:', error);
    return Response.json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ett fel uppstod'
      }
    }, { status: 500 });
  }
});
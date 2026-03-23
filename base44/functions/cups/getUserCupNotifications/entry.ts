import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unread_only = url.searchParams.get('unread_only') === 'true';

    // Get user's cup participations
    const participations = await base44.entities.CupParticipant.filter({
      user_id: user.id
    });

    const cupIds = participations.map(p => p.cup_id);
    
    if (cupIds.length === 0) {
      return Response.json({ 
        success: true,
        notifications: [],
        count: 0
      });
    }

    // Get notifications for user's cups
    const allNotifications = await base44.entities.CupNotification.list('-created_date', limit * 2);
    
    let notifications = allNotifications.filter(n => 
      cupIds.includes(n.cup_id) && 
      (n.recipient_type === 'all' || n.recipient_id === user.id)
    );

    if (unread_only) {
      notifications = notifications.filter(n => !n.is_read);
    }

    // Limit results
    notifications = notifications.slice(0, limit);

    // Enrich with cup data
    const enriched = await Promise.all(notifications.map(async (notif) => {
      let cup = null;
      try {
        cup = await base44.entities.Cup.get(notif.cup_id);
      } catch (error) {
        console.error('Error fetching cup:', error);
      }

      return {
        ...notif,
        cup_name: cup?.name || 'Unknown tournament'
      };
    }));

    return Response.json({ 
      success: true,
      notifications: enriched,
      count: enriched.length
    });

  } catch (error) {
    console.error('Error fetching cup notifications:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notification_id } = await req.json();

    if (!notification_id) {
      return Response.json({ 
        error: 'Notification ID is required' 
      }, { status: 400 });
    }

    // Get notification
    const notification = await base44.entities.CupNotification.get(notification_id);

    // Verify user can mark this notification as read
    if (notification.recipient_type === 'user' && notification.recipient_id !== user.id) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You cannot mark this notification as read' 
      }, { status: 403 });
    }

    // Update notification
    await base44.entities.CupNotification.update(notification_id, {
      is_read: true
    });

    return Response.json({ 
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
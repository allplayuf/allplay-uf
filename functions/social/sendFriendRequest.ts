import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createNotification } from '../utils/notificationService.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    // Check existing
    const existing = await base44.entities.Friendship.filter({
      requester_id: user.id,
      addressee_id: targetUserId
    });

    if (existing.length > 0) {
       return Response.json({ error: 'Request already sent' }, { status: 400 });
    }

    // Create Request
    await base44.entities.Friendship.create({
      requester_id: user.id,
      addressee_id: targetUserId,
      status: 'pending'
    });

    // Notification
    await createNotification(base44, {
      userId: targetUserId,
      type: 'friend_request',
      title: 'Ny vänförfrågan',
      message: `${user.full_name} vill bli vän med dig!`,
      link: `/community?tab=friends`,
      metadata: { requester_id: user.id },
      sendMail: true
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createNotification } from '../utils/notificationService.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin status
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users
    // Note: listing all users might be heavy if there are thousands, 
    // but for now we assume a reasonable amount.
    // We use service role to ensure we get everyone.
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    console.log(`Sending welcome notification to ${allUsers.length} users...`);

    const notificationPromises = allUsers.map(targetUser => 
      createNotification(base44, {
        userId: targetUser.id,
        type: 'system',
        title: 'Välkommen till nya AllPlay!',
        message: 'Vi har uppdaterat plattformen med nya funktioner som chatt, omröstningar och ett helt nytt aviseringssystem. Utforska nu!',
        link: '/dashboard',
        metadata: { type: 'welcome_blast' },
        sendMail: true // Also send an email
      })
    );

    // Execute all promises
    await Promise.all(notificationPromises);

    return Response.json({ 
      success: true, 
      count: allUsers.length,
      message: `Sent welcome notification to ${allUsers.length} users`
    });
  } catch (error) {
    console.error('Error sending welcome notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
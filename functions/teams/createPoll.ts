import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createNotification } from '../utils/notificationService.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, question, options } = await req.json();

    // Create Poll
    const poll = await base44.entities.TeamPoll.create({
      team_id: teamId,
      creator_id: user.id,
      question,
      options,
      status: 'active'
    });

    // Create Team Message
    await base44.entities.TeamMessage.create({
      team_id: teamId,
      user_id: user.id,
      message_type: 'poll_created',
      content: `📊 Ny omröstning: ${question}`
    });

    // Get Team Members to notify
    const members = await base44.entities.TeamMember.filter({ team_id: teamId, status: 'active' });
    
    const notificationPromises = members
      .filter(m => m.user_id !== user.id) // Don't notify self
      .map(m => createNotification(base44, {
        userId: m.user_id,
        type: 'poll_created',
        title: 'Ny omröstning i laget',
        message: `En ny omröstning "${question}" har startats i ditt lag.`,
        link: `/team?id=${teamId}&tab=polls`,
        metadata: { team_id: teamId, poll_id: poll.id },
        sendMail: true
      }));

    await Promise.all(notificationPromises);

    return Response.json({ success: true, poll });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createNotification } from '../utils/notificationService.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId, friendIds } = await req.json();
    const match = await base44.entities.Match.get(matchId);

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Create invitations
    const invitationPromises = friendIds.map(friendId => 
      base44.entities.MatchInvitation.create({
        match_id: matchId,
        invited_user_id: friendId,
        inviter_id: user.id,
        invited_at: new Date().toISOString()
      })
    );

    await Promise.all(invitationPromises);

    // Send Notifications
    // We do this asynchronously but await it here for simplicity in serverless context
    const notificationPromises = friendIds.map(friendId => 
      createNotification(base44, {
        userId: friendId,
        type: 'match_invite',
        title: 'Inbjudan till match',
        message: `${user.full_name} har bjudit in dig till matchen "${match.title}"!`,
        link: `/match?id=${matchId}`,
        metadata: { match_id: matchId, inviter_id: user.id },
        sendMail: true
      })
    );

    await Promise.all(notificationPromises);

    return Response.json({ success: true, count: friendIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
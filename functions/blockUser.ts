import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, action } = await req.json();

    if (!targetUserId) {
      return Response.json({ error: 'Target user ID required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    if (action === 'block') {
      // Check if already blocked
      const existing = await base44.asServiceRole.entities.BlockedUser.filter({
        blocker_id: user.id,
        blocked_id: targetUserId
      });

      if (existing.length > 0) {
        return Response.json({ success: true, message: 'Already blocked' });
      }

      // Create block record
      await base44.asServiceRole.entities.BlockedUser.create({
        blocker_id: user.id,
        blocked_id: targetUserId
      });

      // Also remove any friendships
      const friendships1 = await base44.asServiceRole.entities.Friendship.filter({
        requester_id: user.id,
        addressee_id: targetUserId
      });
      const friendships2 = await base44.asServiceRole.entities.Friendship.filter({
        requester_id: targetUserId,
        addressee_id: user.id
      });

      for (const f of [...friendships1, ...friendships2]) {
        await base44.asServiceRole.entities.Friendship.delete(f.id);
      }

      console.log('AUDIT LOG:', {
        action: 'USER_BLOCKED',
        blocker_id: user.id,
        blocked_id: targetUserId,
        timestamp: new Date().toISOString()
      });

      return Response.json({ success: true, message: 'User blocked' });

    } else if (action === 'unblock') {
      const blocks = await base44.asServiceRole.entities.BlockedUser.filter({
        blocker_id: user.id,
        blocked_id: targetUserId
      });

      for (const b of blocks) {
        await base44.asServiceRole.entities.BlockedUser.delete(b.id);
      }

      return Response.json({ success: true, message: 'User unblocked' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in blockUser:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
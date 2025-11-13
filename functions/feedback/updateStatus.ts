import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update status
    if (user.role !== 'admin') {
      return Response.json({ 
        error: 'Only admins can update post status' 
      }, { status: 403 });
    }

    const { postId, status, isPinned, isHidden } = await req.json();

    if (!postId) {
      return Response.json({ 
        error: 'Missing postId' 
      }, { status: 400 });
    }

    // Get current post
    const posts = await base44.entities.FeedbackPost.filter({ id: postId });
    if (!posts || posts.length === 0) {
      return Response.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    const currentPost = posts[0];
    const updates = {};

    // Update status
    if (status && status !== currentPost.status) {
      updates.status = status;
      
      // Create audit log
      await base44.entities.FeedbackAudit.create({
        post_id: postId,
        actor_id: user.id,
        action: 'status_changed',
        from_value: currentPost.status,
        to_value: status
      });
    }

    // Update pinned status
    if (isPinned !== undefined && isPinned !== currentPost.is_pinned) {
      updates.is_pinned = isPinned;
      
      // Create audit log
      await base44.entities.FeedbackAudit.create({
        post_id: postId,
        actor_id: user.id,
        action: isPinned ? 'pinned' : 'unpinned',
        from_value: String(currentPost.is_pinned),
        to_value: String(isPinned)
      });
    }

    // Update hidden status
    if (isHidden !== undefined && isHidden !== currentPost.is_hidden) {
      updates.is_hidden = isHidden;
      
      // Create audit log
      await base44.entities.FeedbackAudit.create({
        post_id: postId,
        actor_id: user.id,
        action: isHidden ? 'hidden' : 'unhidden',
        from_value: String(currentPost.is_hidden),
        to_value: String(isHidden)
      });
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await base44.entities.FeedbackPost.update(postId, updates);
    }

    return Response.json({ 
      success: true,
      updates
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating post status:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
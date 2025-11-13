import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, body, parentCommentId } = await req.json();

    if (!postId || !body) {
      return Response.json({ 
        error: 'Missing required fields: postId, body' 
      }, { status: 400 });
    }

    if (body.length > 1000) {
      return Response.json({ 
        error: 'Comment too long (max 1000 characters)' 
      }, { status: 400 });
    }

    // Check if post exists
    const post = await base44.entities.FeedbackPost.filter({ id: postId });
    if (!post || post.length === 0) {
      return Response.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    // Create comment
    const comment = await base44.entities.FeedbackComment.create({
      post_id: postId,
      author_id: user.id,
      body: body.trim(),
      parent_comment_id: parentCommentId || null
    });

    // Increment comments_count on post
    const currentCount = post[0].comments_count || 0;
    await base44.entities.FeedbackPost.update(postId, {
      comments_count: currentCount + 1
    });

    return Response.json({ 
      success: true, 
      comment 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
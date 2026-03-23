import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    if (!postId) {
      return Response.json({ 
        error: 'Missing postId' 
      }, { status: 400 });
    }

    // Check if post exists
    const post = await base44.entities.FeedbackPost.filter({ id: postId });
    if (!post || post.length === 0) {
      return Response.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    // Check if user already voted
    const existingVote = await base44.entities.FeedbackVote.filter({
      post_id: postId,
      user_id: user.id
    });

    if (existingVote.length > 0) {
      // Remove vote
      await base44.entities.FeedbackVote.delete(existingVote[0].id);
      
      // Decrement upvotes_count
      const currentCount = post[0].upvotes_count || 0;
      await base44.entities.FeedbackPost.update(postId, {
        upvotes_count: Math.max(0, currentCount - 1)
      });

      return Response.json({ 
        success: true, 
        action: 'removed',
        upvotes_count: Math.max(0, currentCount - 1)
      }, { status: 200 });
    } else {
      // Add vote
      await base44.entities.FeedbackVote.create({
        post_id: postId,
        user_id: user.id
      });

      // Increment upvotes_count
      const currentCount = post[0].upvotes_count || 0;
      await base44.entities.FeedbackPost.update(postId, {
        upvotes_count: currentCount + 1
      });

      return Response.json({ 
        success: true, 
        action: 'added',
        upvotes_count: currentCount + 1
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error voting on post:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
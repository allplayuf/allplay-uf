import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sort = 'top', category = 'all', status = 'all', limit = 100 } = await req.json();

    // Fetch all posts (not hidden)
    let posts = await base44.entities.FeedbackPost.filter({ is_hidden: false }, '-created_date', limit);

    // Fetch all votes for current user
    const myVotes = await base44.entities.FeedbackVote.filter({ user_id: user.id });
    const myVotePostIds = new Set(myVotes.map(v => v.post_id));

    // Enrich posts with author info and vote status
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = {};
    allUsers.forEach(u => {
      userMap[u.id] = { 
        id: u.id, 
        full_name: u.full_name, 
        profile_image_url: u.profile_image_url 
      };
    });

    posts = posts.map(post => ({
      ...post,
      author: userMap[post.author_id] || { id: post.author_id, full_name: 'Okänd användare' },
      hasVoted: myVotePostIds.has(post.id)
    }));

    // Filter by category
    if (category !== 'all') {
      posts = posts.filter(p => p.category === category);
    }

    // Filter by status
    if (status !== 'all') {
      posts = posts.filter(p => p.status === status);
    }

    // Sort posts
    if (sort === 'top') {
      posts.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return (b.upvotes_count || 0) - (a.upvotes_count || 0);
      });
    } else if (sort === 'new') {
      posts.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
    } else if (sort === 'myVotes') {
      posts = posts.filter(p => p.hasVoted);
      posts.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
    } else if (sort === 'myPosts') {
      posts = posts.filter(p => p.author_id === user.id);
      posts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return Response.json({ 
      success: true, 
      posts,
      count: posts.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error getting posts:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
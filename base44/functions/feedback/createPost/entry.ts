import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Simple profanity filter
const hasProfanity = (text) => {
  const badWords = ['jävla', 'fan', 'helvete', 'skit', 'idiot', 'kuk', 'fitta'];
  const lowerText = text.toLowerCase();
  return badWords.some(word => lowerText.includes(word));
};

// Check for similar posts
const findSimilarPosts = async (base44, title, body) => {
  const allPosts = await base44.entities.FeedbackPost.list('-created_date', 50);
  
  const similar = allPosts.filter(post => {
    const titleSimilarity = post.title.toLowerCase().includes(title.toLowerCase().substring(0, 10)) ||
                           title.toLowerCase().includes(post.title.toLowerCase().substring(0, 10));
    return titleSimilarity;
  });
  
  return similar.slice(0, 3);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, category, tags, force } = await req.json();

    // Validate input
    if (!title || !body || !category) {
      return Response.json({ 
        error: 'Missing required fields: title, body, category' 
      }, { status: 400 });
    }

    if (title.length > 80) {
      return Response.json({ 
        error: 'Title too long (max 80 characters)' 
      }, { status: 400 });
    }

    if (body.length > 2000) {
      return Response.json({ 
        error: 'Body too long (max 2000 characters)' 
      }, { status: 400 });
    }

    // Check for profanity
    if (hasProfanity(title) || hasProfanity(body)) {
      return Response.json({ 
        error: 'Innehåller olämpligt språk' 
      }, { status: 400 });
    }

    // Check for similar posts (unless forced)
    if (!force) {
      const similar = await findSimilarPosts(base44, title, body);
      if (similar.length > 0) {
        return Response.json({
          warning: 'similar_posts_found',
          similar: similar.map(p => ({ id: p.id, title: p.title })),
          message: 'Liknande förslag finns redan'
        }, { status: 200 });
      }
    }

    // Create post
    const post = await base44.entities.FeedbackPost.create({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      category: category,
      tags: tags || [],
      status: 'Öppen',
      upvotes_count: 0,
      comments_count: 0,
      is_pinned: false,
      is_hidden: false
    });

    // Create audit log
    await base44.entities.FeedbackAudit.create({
      post_id: post.id,
      actor_id: user.id,
      action: 'created',
      from_value: null,
      to_value: 'created'
    });

    return Response.json({ 
      success: true, 
      post 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
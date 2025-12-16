import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Get PlayerProfile by user_id
 * Public endpoint - any authenticated user can read
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse user_id from query params
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('user_id');
    
    if (!targetUserId) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Fetch PlayerProfile
    const profiles = await base44.entities.PlayerProfile.filter({ user_id: targetUserId });
    
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];

    // Check if profile is public (unless it's the user's own profile)
    if (!profile.publicProfile && profile.user_id !== user.id) {
      return Response.json({ error: 'Profile is private' }, { status: 403 });
    }

    return Response.json({ 
      profile 
    });

  } catch (error) {
    console.error('Error fetching PlayerProfile:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
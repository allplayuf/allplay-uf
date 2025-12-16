import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Get PlayerProfile by user_id
 * Public endpoint - any authenticated user can read
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Optional authentication - check if user is logged in
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch (e) {
      // User not logged in - continue anyway for public access
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
    if (!profile.publicProfile && (!currentUser || profile.user_id !== currentUser.id)) {
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * List all public PlayerProfiles with filtering
 * Used for player discovery, search, etc.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const city = url.searchParams.get('city');
    const skillLevel = url.searchParams.get('skill_level');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch all profiles
    let profiles = await base44.entities.PlayerProfile.list('-updated_date', 1000);
    
    // Filter public profiles only
    profiles = profiles.filter(p => p.publicProfile !== false);

    // Apply filters
    if (city) {
      profiles = profiles.filter(p => p.city?.toLowerCase() === city.toLowerCase());
    }

    if (skillLevel && skillLevel !== 'all') {
      profiles = profiles.filter(p => p.skill_level === skillLevel);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      profiles = profiles.filter(p => {
        const nameMatch = p.full_name?.toLowerCase().includes(searchLower) || 
                         p.display_name?.toLowerCase().includes(searchLower);
        const bioMatch = p.bio?.toLowerCase().includes(searchLower);
        return nameMatch || bioMatch;
      });
    }

    const totalCount = profiles.length;
    const paginatedProfiles = profiles.slice(offset, offset + limit);

    return Response.json({ 
      profiles: paginatedProfiles,
      count: paginatedProfiles.length,
      totalCount,
      hasMore: (offset + limit) < totalCount,
      nextOffset: (offset + limit) < totalCount ? offset + limit : null
    });

  } catch (error) {
    console.error('Error listing PlayerProfiles:', error);
    return Response.json({ 
      error: error.message,
      profiles: [],
      count: 0,
      totalCount: 0
    }, { status: 500 });
  }
});
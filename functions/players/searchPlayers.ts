import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { search_query, limit = 50 } = await req.json();

    // Search for users using service role
    let users = await base44.asServiceRole.entities.User.list('-created_date', limit * 2);
    
    // Filter users
    users = users.filter(u => {
      // Exclude current user
      if (u.id === user.id) return false;
      
      // Exclude blocked users
      if (u.blocked === true) return false;
      
      // Exclude private profiles
      if (u.publicProfile === false) return false;
      
      // If search query provided, filter by name or city
      if (search_query && search_query.trim()) {
        const query = search_query.toLowerCase();
        const matchesName = (u.display_name || u.full_name || '').toLowerCase().includes(query);
        const matchesCity = (u.city || '').toLowerCase().includes(query);
        return matchesName || matchesCity;
      }
      
      return true;
    });

    // Limit results
    users = users.slice(0, limit);

    return Response.json({ users });
  } catch (error) {
    console.error('Error searching players:', error);
    return Response.json({ error: error.message || 'Failed to search players' }, { status: 500 });
  }
});
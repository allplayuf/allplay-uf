import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters for filtering and pagination
        const url = new URL(req.url);
        const city = url.searchParams.get('city') || null;
        const skillLevel = url.searchParams.get('skill_level') || null;
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const search = url.searchParams.get('search') || null;

        // Use service role to fetch users
        let allUsers = await base44.asServiceRole.entities.User.list();
        
        // Filter on backend
        let publicUsers = allUsers.filter(u => {
            // Don't show blocked or private users
            if (u.blocked === true || u.publicProfile === false) return false;
            
            // City filter
            if (city && u.cityNormalized !== city.toLowerCase().trim()) return false;
            
            // Skill level filter
            if (skillLevel && skillLevel !== 'all' && u.skill_level !== skillLevel) return false;
            
            // Search filter (name or bio)
            if (search) {
                const searchLower = search.toLowerCase();
                const nameMatch = u.full_name?.toLowerCase().includes(searchLower);
                const bioMatch = u.bio?.toLowerCase().includes(searchLower);
                if (!nameMatch && !bioMatch) return false;
            }
            
            return true;
        });

        const totalCount = publicUsers.length;

        // Apply pagination
        const paginatedUsers = publicUsers.slice(offset, offset + limit);

        console.log('getPublicUsers:', {
            totalUsers: allUsers.length,
            filteredUsers: totalCount,
            returnedUsers: paginatedUsers.length,
            filters: { city, skillLevel, search, limit, offset },
            requestedBy: user.email
        });

        return Response.json({ 
            users: paginatedUsers,
            count: paginatedUsers.length,
            totalCount,
            hasMore: (offset + limit) < totalCount,
            nextOffset: (offset + limit) < totalCount ? offset + limit : null
        });

    } catch (error) {
        console.error('Error in getPublicUsers:', error);
        return Response.json({ 
            error: error.message,
            users: [],
            count: 0,
            totalCount: 0,
            hasMore: false
        }, { status: 500 });
    }
});
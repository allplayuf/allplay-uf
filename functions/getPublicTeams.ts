import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role to fetch ALL teams
        let allTeams = await base44.asServiceRole.entities.Team.list();
        
        // Filter to only return public and active teams
        let publicTeams = allTeams.filter(t => {
            // Only public teams
            if (t.is_public !== true) return false;
            
            // Only active teams (not deleted)
            if (t.is_active !== true && t.is_active !== undefined) return false;
            
            return true;
        });

        console.log('getPublicTeams:', {
            totalTeams: allTeams.length,
            filteredTeams: publicTeams.length,
            requestedBy: user.email
        });

        return Response.json({ 
            teams: publicTeams,
            count: publicTeams.length
        });

    } catch (error) {
        console.error('Error in getPublicTeams:', error);
        return Response.json({ 
            error: error.message,
            teams: [],
            count: 0
        }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ADMIN ONLY: Cleanup all pending friend requests and team applications
 * 
 * This function:
 * 1. Deletes all Friendship records with status='pending'
 * 2. Deletes all TeamMember records with status='pending'
 * 3. Keeps all accepted friendships and active team members
 * 
 * Call this once from admin dashboard or via API
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin user
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                error: 'ADMIN_ONLY',
                message: 'Only admin users can run cleanup' 
            }, { status: 403 });
        }

        // Get all pending friendships
        const allFriendships = await base44.asServiceRole.entities.Friendship.list();
        const pendingFriendships = allFriendships.filter(f => f.status === 'pending');
        
        // Get all pending team members
        const allTeamMembers = await base44.asServiceRole.entities.TeamMember.list();
        const pendingTeamMembers = allTeamMembers.filter(tm => tm.status === 'pending');

        // Delete pending friendships
        let deletedFriendships = 0;
        for (const friendship of pendingFriendships) {
            try {
                await base44.asServiceRole.entities.Friendship.delete(friendship.id);
                deletedFriendships++;
            } catch (err) {
                console.error(`Error deleting friendship ${friendship.id}:`, err);
            }
        }

        // Delete pending team members
        let deletedTeamMembers = 0;
        for (const teamMember of pendingTeamMembers) {
            try {
                await base44.asServiceRole.entities.TeamMember.delete(teamMember.id);
                deletedTeamMembers++;
            } catch (err) {
                console.error(`Error deleting team member ${teamMember.id}:`, err);
            }
        }

        return Response.json({
            success: true,
            message: 'Cleanup completed',
            stats: {
                totalFriendships: allFriendships.length,
                deletedFriendships,
                keptFriendships: allFriendships.length - deletedFriendships,
                totalTeamMembers: allTeamMembers.length,
                deletedTeamMembers,
                keptTeamMembers: allTeamMembers.length - deletedTeamMembers
            }
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return Response.json({ 
            error: 'SERVER_ERROR',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});
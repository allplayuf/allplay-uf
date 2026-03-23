import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated and is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        // Get all friendships using service role
        const allFriendships = await base44.asServiceRole.entities.Friendship.list();
        
        // Find duplicates
        const friendshipMap = new Map();
        const duplicates = [];
        
        for (const friendship of allFriendships) {
            // Create a unique key for each friendship pair (order-independent)
            const key = [friendship.requester_id, friendship.addressee_id].sort().join('-');
            
            if (friendshipMap.has(key)) {
                // This is a duplicate
                const existing = friendshipMap.get(key);
                
                // Keep the accepted one, or the older one if both have same status
                if (existing.status === 'accepted' && friendship.status !== 'accepted') {
                    duplicates.push(friendship.id);
                } else if (existing.status !== 'accepted' && friendship.status === 'accepted') {
                    duplicates.push(existing.id);
                    friendshipMap.set(key, friendship);
                } else {
                    // Both have same status, keep the older one (smaller ID or earlier created_date)
                    const existingDate = new Date(existing.created_date);
                    const friendshipDate = new Date(friendship.created_date);
                    
                    if (friendshipDate > existingDate) {
                        duplicates.push(friendship.id);
                    } else {
                        duplicates.push(existing.id);
                        friendshipMap.set(key, friendship);
                    }
                }
            } else {
                friendshipMap.set(key, friendship);
            }
        }
        
        // Delete duplicates
        const deletePromises = duplicates.map(id => 
            base44.asServiceRole.entities.Friendship.delete(id)
        );
        
        await Promise.all(deletePromises);
        
        return Response.json({
            success: true,
            message: `Removed ${duplicates.length} duplicate friendships`,
            duplicatesRemoved: duplicates.length,
            totalFriendshipsChecked: allFriendships.length
        });

    } catch (error) {
        console.error('Error removing friendship duplicates:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});
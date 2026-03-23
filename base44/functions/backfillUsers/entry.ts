import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ADMIN ONLY: Backfill users to ensure correct data types
 * 
 * This function:
 * 1. Converts string "true"/"false" to boolean for publicProfile and blocked
 * 2. Sets defaults: publicProfile = true, blocked = false
 * 3. Creates cityNormalized from city
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
                message: 'Only admin users can run backfill' 
            }, { status: 403 });
        }

        // Get all users using service role (admin privileges)
        const users = await base44.asServiceRole.entities.User.list();
        
        let updated = 0;
        let errors = 0;
        const updates = [];

        for (const userDoc of users) {
            const fix = {};
            let needsUpdate = false;

            // Fix publicProfile - must be boolean
            if (typeof userDoc.publicProfile !== 'boolean') {
                if (typeof userDoc.publicProfile === 'string') {
                    fix.publicProfile = userDoc.publicProfile === 'true';
                } else if (userDoc.publicProfile === undefined || userDoc.publicProfile === null) {
                    fix.publicProfile = true; // default public
                }
                needsUpdate = true;
            }

            // Fix blocked - must be boolean
            if (typeof userDoc.blocked !== 'boolean') {
                if (typeof userDoc.blocked === 'string') {
                    fix.blocked = userDoc.blocked === 'true';
                } else if (userDoc.blocked === undefined || userDoc.blocked === null) {
                    fix.blocked = false; // default not blocked
                }
                needsUpdate = true;
            }

            // Create cityNormalized from city
            if (!userDoc.cityNormalized && userDoc.city && typeof userDoc.city === 'string') {
                fix.cityNormalized = userDoc.city.trim().toLowerCase();
                needsUpdate = true;
            }

            // Apply updates if needed
            if (needsUpdate && Object.keys(fix).length > 0) {
                try {
                    await base44.asServiceRole.entities.User.update(userDoc.id, fix);
                    updated++;
                    updates.push({
                        userId: userDoc.id,
                        email: userDoc.email,
                        changes: fix
                    });
                } catch (err) {
                    console.error(`Error updating user ${userDoc.id}:`, err);
                    errors++;
                }
            }
        }

        return Response.json({
            success: true,
            message: 'Backfill completed',
            stats: {
                totalUsers: users.length,
                updated,
                errors,
                skipped: users.length - updated - errors
            },
            sampleUpdates: updates.slice(0, 10) // Show first 10 updates
        });

    } catch (error) {
        console.error('Backfill error:', error);
        return Response.json({ 
            error: 'SERVER_ERROR',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});
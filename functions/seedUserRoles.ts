import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Seed initial custom roles to existing admin users
 * Should be run once to bootstrap the system
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only full admins can seed roles
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminUsers = allUsers.filter(u => u.role === 'admin');

    const updates = [];

    // Give all admins CUP_ADMIN and MODERATOR roles by default
    for (const admin of adminUsers) {
      // Skip if already has custom_roles
      if (admin.custom_roles && admin.custom_roles.length > 0) {
        continue;
      }

      await base44.asServiceRole.entities.User.update(admin.id, {
        custom_roles: ['CUP_ADMIN', 'MODERATOR']
      });

      updates.push({
        user_id: admin.id,
        email: admin.email,
        roles_assigned: ['CUP_ADMIN', 'MODERATOR']
      });
    }

    console.log('SEED LOG:', {
      action: 'SEED_USER_ROLES',
      admin_id: user.id,
      admin_email: user.email,
      users_updated: updates.length,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: `${updates.length} admin-användare uppdaterade`,
      updates
    });

  } catch (error) {
    console.error('Error in seedUserRoles:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
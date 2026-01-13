import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Update user role or custom_roles
 * Only full admins can use this
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only full admins can update roles
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { targetUserId, role, customRoles } = await req.json();

    if (!targetUserId) {
      return Response.json({ error: 'targetUserId krävs' }, { status: 400 });
    }

    const targetUser = await base44.asServiceRole.entities.User.get(targetUserId);
    if (!targetUser) {
      return Response.json({ error: 'Användare hittades inte' }, { status: 404 });
    }

    const updates = {};

    // Update built-in role if provided
    if (role && ['admin', 'user'].includes(role)) {
      updates.role = role;
    }

    // Update custom roles if provided
    if (customRoles !== undefined) {
      const validRoles = ['CUP_ADMIN', 'MODERATOR', 'VENUE_MANAGER'];
      const filteredRoles = customRoles.filter(r => validRoles.includes(r));
      updates.custom_roles = filteredRoles;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'Ingen giltig uppdatering angiven' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(targetUserId, updates);

    console.log('AUDIT LOG:', {
      action: 'UPDATE_USER_ROLE',
      admin_id: user.id,
      admin_email: user.email,
      target_user_id: targetUserId,
      target_user_email: targetUser.email,
      updates: updates,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Användarroll uppdaterad',
      updates
    });

  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
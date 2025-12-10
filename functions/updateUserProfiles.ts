import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const currentUser = await base44.auth.me();
    if (!currentUser || currentUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { updates } = await req.json();

    // Update users with profile images
    const results = await Promise.all(
      updates.map(async ({ userId, profile_image_url }) => {
        try {
          const users = await base44.asServiceRole.entities.User.list();
          const user = users.find(u => u.id === userId);
          
          if (!user) {
            return { userId, success: false, error: 'User not found' };
          }

          await base44.asServiceRole.entities.User.update(userId, {
            profile_image_url
          });

          return { userId, success: true };
        } catch (error) {
          return { userId, success: false, error: error.message };
        }
      })
    );

    return Response.json({ results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
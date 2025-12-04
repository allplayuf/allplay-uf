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
    const { full_name } = await req.json();

    // Validate name
    if (!full_name || full_name.trim().length < 2) {
      return Response.json({ error: 'Namnet måste vara minst 2 tecken' }, { status: 400 });
    }

    if (full_name.trim().length > 50) {
      return Response.json({ error: 'Namnet får inte vara längre än 50 tecken' }, { status: 400 });
    }

    // Update user's full_name using service role
    await base44.asServiceRole.entities.User.update(user.id, {
      full_name: full_name.trim()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating user name:', error);
    return Response.json({ error: error.message || 'Failed to update name' }, { status: 500 });
  }
});
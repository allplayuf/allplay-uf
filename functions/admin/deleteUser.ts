import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        // Check if requester is admin
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId } = await req.json();
        if (!userId) {
            return Response.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Delete user using service role
        await base44.asServiceRole.entities.User.delete(userId);

        return Response.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
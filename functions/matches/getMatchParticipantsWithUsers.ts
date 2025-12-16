import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const { match_id } = await req.json();
    
    if (!match_id) {
      return Response.json({ error: 'match_id is required' }, { status: 400 });
    }

    // Use service role to fetch participants and their user data
    const participants = await base44.asServiceRole.entities.MatchParticipant.filter({ 
      match_id 
    });

    // Fetch all user data in parallel using service role
    const userIds = [...new Set(participants.map(p => p.user_id))];
    const usersData = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await base44.asServiceRole.entities.User.get(userId);
          return user;
        } catch (err) {
          console.error(`Failed to fetch user ${userId}:`, err);
          return null;
        }
      })
    );

    // Filter out null values and create user map
    const usersMap = {};
    usersData.filter(u => u !== null).forEach(u => {
      usersMap[u.id] = u;
    });

    // Merge participant data with user data
    const enrichedParticipants = participants
      .map(p => {
        const userData = usersMap[p.user_id];
        if (!userData) return null;
        
        return {
          ...userData,
          participantInfo: p
        };
      })
      .filter(p => p !== null);

    return Response.json({
      participants: enrichedParticipants,
      count: enrichedParticipants.length
    });

  } catch (error) {
    console.error('Error in getMatchParticipantsWithUsers:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});
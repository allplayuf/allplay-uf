import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id, team_name, team_color } = await req.json();

    if (!cup_id || !team_name) {
      return Response.json({ 
        error: 'Cup ID and team name are required' 
      }, { status: 400 });
    }

    // Validate team name length
    if (team_name.length < 3 || team_name.length > 50) {
      return Response.json({ 
        error: 'Team name must be between 3 and 50 characters' 
      }, { status: 400 });
    }

    // Fetch cup to verify it exists and get location
    const cup = await base44.entities.Cup.get(cup_id);

    // Create a cup-specific team using service role
    const team = await base44.asServiceRole.entities.Team.create({
      name: `${team_name} (${cup.name})`,
      description: `Lag skapat för ${cup.name}`,
      city: cup.location,
      teamColor: team_color || '#F59E0B',
      captain_id: user.id,
      is_public: false,
      is_cup_team: true,
      cup_id: cup_id,
      current_members: 1,
      matches_played: 0,
      wins: 0,
      losses: 0,
      draws: 0
    });

    // Add user as team member (captain)
    await base44.asServiceRole.entities.TeamMember.create({
      team_id: team.id,
      user_id: user.id,
      role: 'captain',
      status: 'active',
      joined_at: new Date().toISOString()
    });

    // Automatically signup the team to the cup
    await base44.asServiceRole.entities.CupParticipant.create({
      cup_id,
      team_id: team.id,
      signup_type: 'team',
      status: 'pending'
    });

    // Update cup participant count
    await base44.asServiceRole.entities.Cup.update(cup_id, {
      current_participants: (cup.current_participants || 0) + 1
    });

    return Response.json({ 
      success: true,
      team,
      message: 'Cup team created and signed up successfully'
    });

  } catch (error) {
    console.error('Error creating cup team:', error);
    return Response.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});
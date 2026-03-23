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

    // --- VALIDATION START ---

    // Check registration status
    if (cup.status !== 'registration_open' && cup.status !== 'upcoming') {
      return Response.json({ 
        error: 'Registration is closed' 
      }, { status: 400 });
    }

    // Check if cup is full
    if (cup.current_participants >= cup.max_participants) {
      return Response.json({ 
        error: 'Tournament is full' 
      }, { status: 400 });
    }

    // Check if user is already signed up to this cup (solo or in another team)
    // 1. Check direct participation (solo or team captain of another team)
    const existingDirectSignup = await base44.entities.CupParticipant.filter({
      cup_id: cup_id,
      user_id: user.id 
    });
    
    // 2. Check if user is a member of ANY team that is already signed up
    // First get all teams this user is a member of
    const userTeamMemberships = await base44.entities.TeamMember.filter({ user_id: user.id, status: 'active' });
    const userTeamIds = userTeamMemberships.map(m => m.team_id);
    
    if (userTeamIds.length > 0) {
        // Check if any of these teams are participants in this cup
        const teamSignups = await base44.entities.CupParticipant.list(); // Optimizable with filter if supported
        const teamsInCup = teamSignups.filter(p => p.cup_id === cup_id && userTeamIds.includes(p.team_id));
        
        if (teamsInCup.length > 0) {
             return Response.json({ 
                error: 'You are already part of a team registered for this tournament' 
              }, { status: 400 });
        }
    }
    
    if (existingDirectSignup.length > 0) {
      return Response.json({ 
        error: 'You are already registered for this tournament' 
      }, { status: 400 });
    }

    // --- VALIDATION END ---

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
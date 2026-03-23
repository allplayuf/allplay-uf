import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RATE_LIMITS = new Map();

function checkRateLimit(key, maxCalls, windowMs) {
  const now = Date.now();
  const entry = RATE_LIMITS.get(key);
  if (!entry || now - entry.start > windowMs) {
    RATE_LIMITS.set(key, { start: now, count: 1 });
    return { allowed: true };
  }
  entry.count++;
  if (entry.count > maxCalls) return { allowed: false };
  return { allowed: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limiting - max 5 teams per hour
    const rateLimit = checkRateLimit(`create-team-${user.id}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json({ error: 'Du skapar lag för snabbt. Vänta en stund.' }, { status: 429 });
    }

    const teamData = await req.json();
    console.log('[createTeam] Incoming data:', JSON.stringify(teamData));
    console.log('[createTeam] User:', user.id, user.email);

    // Validate input
    const name = (teamData.name || '').trim();
    const city = (teamData.city || '').trim();
    
    if (!name || name.length < 2) {
      return Response.json({ error: 'Lagnamn måste vara minst 2 tecken' }, { status: 400 });
    }
    if (name.length > 50) {
      return Response.json({ error: 'Lagnamn får vara max 50 tecken' }, { status: 400 });
    }
    if (!city || city.length < 2) {
      return Response.json({ error: 'Stad krävs (minst 2 tecken)' }, { status: 400 });
    }

    // Sanitize
    const description = (teamData.description || '').trim().substring(0, 500);
    const logoUrl = teamData.logo_url || '';
    const isPublic = teamData.is_public !== false;
    const maxMembers = Math.min(Math.max(parseInt(teamData.max_members) || 20, 5), 50);
    const teamColor = teamData.teamColor || teamData.team_color || '#2BA84A';

    // Check profanity on team name
    try {
      const nameCheck = await base44.functions.invoke('profanityFilter', {
        text: name,
        field: 'team_name'
      });
      if (nameCheck?.data?.hasProfanity) {
        return Response.json({ 
          error: nameCheck.data.message || 'Lagnamnet innehåller olämpligt språk' 
        }, { status: 400 });
      }
    } catch (profErr) {
      console.warn('[createTeam] Profanity check failed (non-blocking):', profErr.message);
    }

    // Create team with service role
    console.log('[createTeam] Creating team entity...');
    const team = await base44.asServiceRole.entities.Team.create({
      name,
      description: description || undefined,
      city,
      logo_url: logoUrl || undefined,
      teamColor,
      captain_id: user.id,
      is_public: isPublic,
      max_members: maxMembers,
      current_members: 1,
      elo_rating: 1000,
      matches_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      is_active: true,
    });

    console.log('[createTeam] Team created:', team.id);

    // Add captain as first member
    try {
      await base44.asServiceRole.entities.TeamMember.create({
        team_id: team.id,
        user_id: user.id,
        role: 'captain',
        status: 'active',
      });
      console.log('[createTeam] Captain membership created');
    } catch (memberErr) {
      console.error('[createTeam] Failed to create captain membership:', memberErr.message);
      // Don't fail the whole operation - team is created
    }

    return Response.json({ 
      success: true,
      team,
      team_id: team.id,
    }, { status: 201 });

  } catch (error) {
    console.error('[createTeam] Error:', error.message, error.stack);
    
    if (error.message?.includes('Authentication')) {
      return Response.json({ error: 'Du måste vara inloggad' }, { status: 401 });
    }
    
    return Response.json({ 
      error: error.message || 'Kunde inte skapa laget' 
    }, { status: 500 });
  }
});
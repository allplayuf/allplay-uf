import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { validateTeamData } from '../utils/validation.js';
import { sanitizeTeamData } from '../utils/contentSanitizer.js';
import { checkRateLimit } from '../utils/permissions.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - max 5 teams per hour
    const rateLimit = checkRateLimit(`create-team-${user.id}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }

    const teamData = await req.json();

    // Validate input
    const validation = validateTeamData(teamData);
    if (!validation.isValid) {
      return Response.json({ 
        error: 'Validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Sanitize user input
    const sanitized = sanitizeTeamData(teamData);

    // Check for profanity in name and description
    const nameCheck = await base44.functions.invoke('profanityFilter', {
      text: sanitized.name,
      field: 'team_name'
    });
    
    if (nameCheck.data.hasProfanity) {
      return Response.json({ 
        error: 'Team name contains inappropriate language',
        message: nameCheck.data.message 
      }, { status: 400 });
    }

    if (sanitized.description) {
      const descCheck = await base44.functions.invoke('profanityFilter', {
        text: sanitized.description,
        field: 'team_description'
      });
      
      if (descCheck.data.hasProfanity) {
        return Response.json({ 
          error: 'Team description contains inappropriate language',
          message: descCheck.data.message 
        }, { status: 400 });
      }
    }

    // Create team with sanitized data
    const team = await base44.entities.Team.create({
      ...sanitized,
      captain_id: user.id,
      current_members: 1,
      elo_rating: 1000,
      matches_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      is_active: true
    });

    // Add captain as first member
    await base44.entities.TeamMember.create({
      team_id: team.id,
      user_id: user.id,
      role: 'captain',
      status: 'active'
    });

    return Response.json({ 
      success: true,
      team 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating team:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
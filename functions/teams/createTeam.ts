import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAuth } from '../utils/authorization.js';
import { validateTeamData } from '../utils/validation.js';
import { sanitizeTeamData } from '../utils/sanitizer.js';
import { withErrorHandler, ErrorTypes, successResponse } from '../utils/errorHandler.js';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimit.js';

const handler = async (req, logger) => {
  // Require authentication
  const { base44, user } = await requireAuth(req);

  // Rate limiting - max 5 teams per hour
  const rateLimitKey = `create-team:${user.id}`;
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.CREATE_TEAM.requests, RATE_LIMITS.CREATE_TEAM.windowMs);
  
  if (!rateLimit.allowed) {
    throw ErrorTypes.RATE_LIMIT(rateLimit.retryAfter);
  }

  const teamData = await req.json();
  
  logger.info('Creating team', { userId: user.id });

    // Validate input
    const validation = validateTeamData(teamData);
    if (!validation.isValid) {
      throw ErrorTypes.VALIDATION_ERROR(validation.errors.join(', '));
    }

    // Sanitize user input
    const sanitized = sanitizeTeamData(teamData);

    // Check for profanity in name and description
    try {
      const nameCheck = await base44.functions.invoke('profanityFilter', {
        text: sanitized.name,
        field: 'team_name'
      });
      
      if (nameCheck.data.hasProfanity) {
        throw ErrorTypes.VALIDATION_ERROR('Team name contains inappropriate language');
      }

      if (sanitized.description) {
        const descCheck = await base44.functions.invoke('profanityFilter', {
          text: sanitized.description,
          field: 'team_description'
        });
        
        if (descCheck.data.hasProfanity) {
          throw ErrorTypes.VALIDATION_ERROR('Team description contains inappropriate language');
        }
      }
    } catch (error) {
      // If profanity filter fails, log but don't block creation
      logger.warn('Profanity filter failed', { error: error.message });
    }

    // Create team with sanitized data
    const team = await base44.asServiceRole.entities.Team.create({
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
    await base44.asServiceRole.entities.TeamMember.create({
      team_id: team.id,
      user_id: user.id,
      role: 'captain',
      status: 'active'
    });

    logger.logAction('team_created', user.id, { teamId: team.id, teamName: team.name });

    return successResponse({ team }, 201);
};

Deno.serve(withErrorHandler(handler, 'create-team'));
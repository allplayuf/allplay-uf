import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAuth } from '../utils/authorization.js';
import { sanitizeCupData } from '../utils/sanitizer.js';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimit.js';
import { withErrorHandler, ErrorTypes, successResponse } from '../utils/errorHandler.js';
import { Logger } from '../utils/logger.js';

const handler = async (req, logger) => {
  // Require authentication
  const { base44, user } = await requireAuth(req);
  
  // Rate limiting - 3 cups per hour
  const rateLimitKey = `create-cup:${user.id}`;
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.CREATE_CUP.requests, RATE_LIMITS.CREATE_CUP.windowMs);
  
  if (!rateLimit.allowed) {
    throw ErrorTypes.RATE_LIMIT(rateLimit.retryAfter);
  }
  
  const cupData = await req.json();
  
  logger.info('Creating cup', { userId: user.id });

    // Basic validation
    if (!cupData.name || !cupData.location || !cupData.start_date || !cupData.start_time) {
      throw ErrorTypes.VALIDATION_ERROR('Missing required fields: name, location, start_date, start_time');
    }

    if (cupData.max_participants < 4 || cupData.max_participants > 64) {
      throw ErrorTypes.VALIDATION_ERROR('max_participants must be between 4 and 64');
    }

    // Sanitize input data
    const sanitized = sanitizeCupData(cupData);
    
    // Prepare data
    const sanitizedData = {
      name: sanitized.name,
      description: sanitized.description || '',
      logo_url: cupData.logo_url || '',
      location: sanitized.location || cupData.location,
      venue_ids: cupData.venue_ids || [],
      start_date: cupData.start_date,
      end_date: cupData.end_date || cupData.start_date,
      start_time: cupData.start_time,
      format: cupData.format || '5v5',
      signup_type: cupData.signup_type || 'team',
      skill_level: cupData.skill_level || 'mixed',
      age_group: cupData.age_group || 'Open',
      max_participants: parseInt(cupData.max_participants) || 16,
      rules: sanitized.rules || '',
      prize: sanitized.prize || '',
      entry_fee: parseFloat(cupData.entry_fee) || 0,
      has_group_stage: cupData.has_group_stage !== false,
      has_playoffs: cupData.has_playoffs !== false,
      number_of_groups: parseInt(cupData.number_of_groups) || 4,
      teams_advance_per_group: parseInt(cupData.teams_advance_per_group) || 2,
      enable_mvp_voting: cupData.enable_mvp_voting !== false,
      is_public: cupData.is_public !== false,
      organizer_id: user.id,
      current_participants: 0,
      status: 'registration_open'
    };

    // Create cup using service role for elevated permissions
    const cup = await base44.asServiceRole.entities.Cup.create(sanitizedData);

    // Create groups if group stage is enabled
    if (cup.has_group_stage && cup.number_of_groups) {
      const groupPromises = [];
      for (let i = 0; i < cup.number_of_groups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        groupPromises.push(
          base44.asServiceRole.entities.CupGroup.create({
            cup_id: cup.id,
            name: `Grupp ${groupName}`,
            team_ids: [],
            standings: []
          })
        );
      }
      await Promise.all(groupPromises);
    }

    logger.logAction('cup_created', user.id, { cupId: cup.id, cupName: cup.name });
    
    return successResponse({ cup }, 201);
};

Deno.serve(withErrorHandler(handler, 'create-cup'));
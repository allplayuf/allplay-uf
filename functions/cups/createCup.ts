import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { validateCupData } from '../utils/cupValidation.js';
import { sanitizeUserInput, sanitizeUrl } from '../utils/contentSanitizer.js';
import { checkRateLimit } from '../utils/permissions.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - max 3 tournaments per day
    const rateLimit = checkRateLimit(`create-cup-${user.id}`, 3, 24 * 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json({ 
        error: 'Rate limit exceeded. Max 3 tournaments per day.' 
      }, { status: 429 });
    }

    const cupData = await req.json();

    // Validate input
    const validation = validateCupData(cupData);
    if (!validation.isValid) {
      return Response.json({ 
        error: 'Validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Sanitize input
    const sanitized = {
      ...cupData,
      name: sanitizeUserInput(cupData.name, { maxLength: 100, stripHtmlTags: true }),
      description: cupData.description ? sanitizeUserInput(cupData.description, { maxLength: 1000, allowLineBreaks: true }) : '',
      location: sanitizeUserInput(cupData.location, { maxLength: 100, stripHtmlTags: true }),
      rules: cupData.rules ? sanitizeUserInput(cupData.rules, { maxLength: 5000, allowLineBreaks: true }) : '',
      logo_url: cupData.logo_url ? sanitizeUrl(cupData.logo_url) : '',
      organizer_id: user.id
    };

    // Check for profanity in name
    const nameCheck = await base44.functions.invoke('profanityFilter', {
      text: sanitized.name,
      field: 'tournament_name'
    });
    
    if (nameCheck.data.hasProfanity) {
      return Response.json({ 
        error: 'Tournament name contains inappropriate language',
        message: nameCheck.data.message 
      }, { status: 400 });
    }

    // Verify venues exist if provided
    if (sanitized.venue_ids && Array.isArray(sanitized.venue_ids)) {
      for (const venueId of sanitized.venue_ids) {
        try {
          await base44.entities.Venue.get(venueId);
        } catch (error) {
          return Response.json({ 
            error: 'Invalid venue ID',
            details: `Venue ${venueId} does not exist` 
          }, { status: 400 });
        }
      }
    }

    // Create cup
    const cup = await base44.entities.Cup.create({
      ...sanitized,
      current_participants: 0,
      status: 'registration_open'
    });

    // Create groups if group stage is enabled
    if (cup.has_group_stage && cup.number_of_groups) {
      const groupPromises = [];
      for (let i = 0; i < cup.number_of_groups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        groupPromises.push(
          base44.entities.CupGroup.create({
            cup_id: cup.id,
            name: `Group ${groupName}`,
            team_ids: [],
            standings: []
          })
        );
      }
      await Promise.all(groupPromises);
    }

    return Response.json({ 
      success: true,
      cup 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating cup:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
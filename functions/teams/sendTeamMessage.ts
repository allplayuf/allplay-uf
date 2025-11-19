import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { validateChatMessage } from '../utils/validation.js';
import { sanitizeMessageData } from '../utils/sanitizer.js';
import { canSendTeamMessage, checkRateLimit } from '../utils/permissions.js';
import { requireAuth } from '../utils/authorization.js';

Deno.serve(async (req) => {
  try {
    // Require authentication
    const { base44, user } = await requireAuth(req);

    const { team_id, content } = await req.json();

    if (!team_id) {
      return Response.json({ 
        error: 'Team ID is required' 
      }, { status: 400 });
    }

    // Check permissions - user must be team member
    const hasPermission = await canSendTeamMessage(base44, user, team_id);
    if (!hasPermission) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You must be a team member to send messages' 
      }, { status: 403 });
    }

    // Rate limiting - max 60 messages per minute
    const rateLimit = checkRateLimit(`team-msg-${user.id}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please slow down.' 
      }, { status: 429 });
    }

    // Validate message content
    const validation = validateChatMessage(content);
    if (!validation.isValid) {
      return Response.json({ 
        error: 'Validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Sanitize content
    const sanitized = sanitizeMessageData({ content }).content;

    // Check for profanity
    const profanityCheck = await base44.functions.invoke('profanityFilter', {
      text: sanitized,
      field: 'team_message'
    });
    
    if (profanityCheck.data.hasProfanity) {
      return Response.json({ 
        error: 'Message contains inappropriate language',
        message: profanityCheck.data.message 
      }, { status: 400 });
    }

    // Create message using service role
    const message = await base44.asServiceRole.entities.TeamMessage.create({
      team_id,
      user_id: user.id,
      message_type: 'text',
      content: sanitized
    });

    return Response.json({ 
      success: true,
      message 
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending team message:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
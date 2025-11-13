import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { canSendCupAnnouncement } from '../utils/cupPermissions.js';
import { sanitizeUserInput } from '../utils/contentSanitizer.js';
import { checkRateLimit } from '../utils/permissions.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cup_id, title, message, recipient_type } = await req.json();

    if (!cup_id || !title || !message) {
      return Response.json({ 
        error: 'Cup ID, title, and message are required' 
      }, { status: 400 });
    }

    // Check permissions
    const hasPermission = await canSendCupAnnouncement(base44, user, cup_id);
    if (!hasPermission) {
      return Response.json({ 
        error: 'Forbidden',
        details: 'You do not have permission to send announcements' 
      }, { status: 403 });
    }

    // Rate limiting - max 10 announcements per hour
    const rateLimit = checkRateLimit(`cup-announce-${user.id}`, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json({ 
        error: 'Rate limit exceeded. Max 10 announcements per hour.' 
      }, { status: 429 });
    }

    // Sanitize input
    const sanitizedTitle = sanitizeUserInput(title, { maxLength: 100, stripHtmlTags: true });
    const sanitizedMessage = sanitizeUserInput(message, { maxLength: 1000, allowLineBreaks: true });

    // Check for profanity
    const titleCheck = await base44.functions.invoke('profanityFilter', {
      text: sanitizedTitle,
      field: 'announcement_title'
    });
    
    if (titleCheck.data.hasProfanity) {
      return Response.json({ 
        error: 'Title contains inappropriate language',
        message: titleCheck.data.message 
      }, { status: 400 });
    }

    const messageCheck = await base44.functions.invoke('profanityFilter', {
      text: sanitizedMessage,
      field: 'announcement_message'
    });
    
    if (messageCheck.data.hasProfanity) {
      return Response.json({ 
        error: 'Message contains inappropriate language',
        message: messageCheck.data.message 
      }, { status: 400 });
    }

    // Get participants to send to
    const participants = await base44.entities.CupParticipant.filter({
      cup_id,
      status: 'confirmed'
    });

    // Create notifications
    const validRecipientTypes = ['user', 'team', 'all'];
    const finalRecipientType = validRecipientTypes.includes(recipient_type) ? recipient_type : 'all';

    if (finalRecipientType === 'all') {
      // Send to all participants
      for (const participant of participants) {
        await base44.entities.CupNotification.create({
          cup_id,
          recipient_id: participant.user_id || participant.team_id,
          recipient_type: participant.signup_type === 'solo' ? 'user' : 'team',
          type: 'announcement',
          title: sanitizedTitle,
          message: sanitizedMessage
        });
      }
    } else {
      // Send to specific recipient type
      const filteredParticipants = participants.filter(p => 
        (finalRecipientType === 'user' && p.signup_type === 'solo') ||
        (finalRecipientType === 'team' && p.signup_type === 'team')
      );

      for (const participant of filteredParticipants) {
        await base44.entities.CupNotification.create({
          cup_id,
          recipient_id: participant.user_id || participant.team_id,
          recipient_type: finalRecipientType,
          type: 'announcement',
          title: sanitizedTitle,
          message: sanitizedMessage
        });
      }
    }

    return Response.json({ 
      success: true,
      message: 'Announcement sent successfully',
      recipients: participants.length
    });

  } catch (error) {
    console.error('Error sending announcement:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
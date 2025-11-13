import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { validateCupSignup } from '../utils/cupValidation.js';
import { canSignupToCup } from '../utils/cupPermissions.js';
import { sanitizeUserInput } from '../utils/contentSanitizer.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signupData = await req.json();

    // Validate input
    const validation = validateCupSignup(signupData);
    if (!validation.isValid) {
      return Response.json({ 
        error: 'Validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Check if cup exists
    let cup;
    try {
      cup = await base44.entities.Cup.get(signupData.cup_id);
    } catch (error) {
      return Response.json({ 
        error: 'Tournament not found' 
      }, { status: 404 });
    }

    // Verify signup type matches cup type
    if (cup.signup_type !== signupData.signup_type) {
      return Response.json({ 
        error: `This tournament only accepts ${cup.signup_type} signups` 
      }, { status: 400 });
    }

    // Check permissions
    const permission = await canSignupToCup(
      base44, 
      user, 
      signupData.cup_id, 
      signupData.team_id
    );
    
    if (!permission.allowed) {
      return Response.json({ 
        error: 'Cannot signup to tournament',
        reason: permission.reason 
      }, { status: 403 });
    }

    // Sanitize notes
    const sanitizedNotes = signupData.notes ? 
      sanitizeUserInput(signupData.notes, { maxLength: 500 }) : '';

    // Create participant entry
    const participant = await base44.entities.CupParticipant.create({
      cup_id: signupData.cup_id,
      team_id: signupData.team_id || null,
      user_id: signupData.signup_type === 'solo' ? user.id : null,
      signup_type: signupData.signup_type,
      status: 'pending',
      preferred_position: signupData.preferred_position || null,
      notes: sanitizedNotes,
      payment_status: cup.entry_fee > 0 ? 'pending' : 'not_required'
    });

    // Update cup participant count
    await base44.entities.Cup.update(cup.id, {
      current_participants: (cup.current_participants || 0) + 1
    });

    // Send notification to organizer
    if (cup.notifications_enabled) {
      await base44.entities.CupNotification.create({
        cup_id: cup.id,
        recipient_id: cup.organizer_id,
        recipient_type: 'user',
        type: 'announcement',
        title: 'New tournament registration',
        message: `${signupData.signup_type === 'team' ? 'A team' : user.full_name} has registered for ${cup.name}`
      });
    }

    return Response.json({ 
      success: true,
      participant,
      message: 'Successfully registered for tournament!' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error signing up to cup:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
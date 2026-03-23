import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date_of_birth } = await req.json();

    if (!date_of_birth) {
      return Response.json({ error: 'Date of birth required' }, { status: 400 });
    }

    const birthDate = new Date(date_of_birth);
    const today = new Date();
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Block users under 13
    if (age < 13) {
      console.log('AUDIT LOG:', {
        action: 'UNDERAGE_REGISTRATION_BLOCKED',
        user_id: user.id,
        age: age,
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: false,
        allowed: false,
        reason: 'underage',
        message: 'Du måste vara minst 13 år för att använda AllPlay.'
      });
    }

    const isMinor = age < 18;

    // Update user with verified age
    await base44.asServiceRole.entities.User.update(user.id, {
      date_of_birth: date_of_birth,
      birth_year: birthDate.getFullYear(),
      age_verified: true,
      is_minor: isMinor,
      hide_exact_location: isMinor // Auto-enable location masking for minors
    });

    console.log('AUDIT LOG:', {
      action: 'AGE_VERIFIED',
      user_id: user.id,
      age: age,
      is_minor: isMinor,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      allowed: true,
      is_minor: isMinor,
      age: age,
      message: isMinor 
        ? 'Ålder verifierad. Vissa funktioner är begränsade för din säkerhet.' 
        : 'Ålder verifierad.'
    });

  } catch (error) {
    console.error('Error in verifyAge:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
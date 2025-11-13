import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as jose from 'npm:jose@5.2.0';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'default-jwt-secret-change-me');
const REFRESH_SECRET = new TextEncoder().encode(Deno.env.get('REFRESH_SECRET') || 'default-refresh-secret-change-me');

async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const combined = new Uint8Array(salt.length + hash.byteLength);
    combined.set(salt, 0);
    combined.set(new Uint8Array(hash), salt.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
  }
}

async function generateTokens(userId, username, role) {
  const accessToken = await new jose.SignJWT({ sub: userId, username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('20m')
    .sign(JWT_SECRET);

  const refreshToken = await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(REFRESH_SECRET);

  return { accessToken, refreshToken };
}

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { username, password, display_name, email, birth_year, city } = body;

    console.log('=== REGISTRATION START ===');
    console.log('Data received:', { username, email, display_name, city, birth_year });

    // Validate input
    if (!username || username.length < 3 || username.length > 30) {
      console.log('Validation failed: Invalid username');
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Användarnamnet måste vara mellan 3 och 30 tecken'
        }
      }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      console.log('Validation failed: Invalid username format');
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Användarnamnet får bara innehålla bokstäver, siffror och understreck'
        }
      }, { status: 400 });
    }

    if (!password || password.length < 8) {
      console.log('Validation failed: Invalid password');
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Lösenordet måste vara minst 8 tecken'
        }
      }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('Validation failed: Invalid email');
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ogiltig e-postadress'
        }
      }, { status: 400 });
    }

    // Check for existing users
    console.log('Checking for existing users...');
    let existingUsers;
    try {
      existingUsers = await base44.asServiceRole.entities.User.list();
      console.log(`Found ${existingUsers.length} existing users`);
    } catch (listError) {
      console.error('Error listing users:', listError);
      return Response.json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Kunde inte kontrollera befintliga användare',
          details: listError.message
        }
      }, { status: 500 });
    }
    
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();
    
    const usernameExists = existingUsers.find(u => 
      u.username?.toLowerCase().trim() === normalizedUsername
    );
    
    const emailExists = existingUsers.find(u => 
      u.email?.toLowerCase().trim() === normalizedEmail
    );

    if (usernameExists) {
      console.log('Username conflict:', normalizedUsername);
      return Response.json({
        error: {
          code: 'CONFLICT',
          message: 'Användarnamnet är redan taget. Prova ett annat.'
        }
      }, { status: 409 });
    }

    if (emailExists) {
      console.log('Email conflict:', normalizedEmail);
      return Response.json({
        error: {
          code: 'CONFLICT',
          message: 'E-postadressen används redan. Försök logga in istället.'
        }
      }, { status: 409 });
    }

    // Hash password
    console.log('Hashing password...');
    let password_hash;
    try {
      password_hash = await hashPassword(password);
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return Response.json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Kunde inte hasha lösenord',
          details: hashError.message
        }
      }, { status: 500 });
    }

    // Calculate is_minor
    let is_minor = false;
    if (birth_year) {
      const currentYear = new Date().getFullYear();
      is_minor = (currentYear - parseInt(birth_year)) < 18;
    }

    // Prepare user data - only include fields that are not undefined
    const userData = {
      username: normalizedUsername,
      email: normalizedEmail,
      password_hash,
      display_name: display_name || username,
      full_name: display_name || username,
      status: 'active',
      blocked: false,
      publicProfile: true,
      profile_completed: false,
      role: 'user',
      elo_rating: 1200,
      matches_played: 0,
      mvp_count: 0,
      current_streak: 0,
      longest_streak: 0,
      fitness_level: 5,
      skill_level: 'intermediate',
      is_minor
    };

    // Only add optional fields if they have values
    if (birth_year) {
      userData.birth_year = parseInt(birth_year);
    }
    if (city) {
      userData.city = city;
      userData.cityNormalized = city.toLowerCase().trim();
    }

    console.log('Creating user with data:', { 
      ...userData, 
      password_hash: '[HIDDEN]',
      has_birth_year: !!birth_year,
      has_city: !!city
    });

    // Create user
    let newUser;
    try {
      newUser = await base44.asServiceRole.entities.User.create(userData);
      console.log('User created successfully:', newUser.id);
    } catch (createError) {
      console.error('User creation error:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      return Response.json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Kunde inte skapa användare',
          details: createError.message
        }
      }, { status: 500 });
    }

    // Generate tokens
    console.log('Generating tokens...');
    let accessToken, refreshToken;
    try {
      const tokens = await generateTokens(newUser.id, newUser.username, newUser.role);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      console.log('Tokens generated successfully');
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return Response.json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Kunde inte generera tokens',
          details: tokenError.message
        }
      }, { status: 500 });
    }

    // Create session
    console.log('Creating session...');
    try {
      const refreshTokenHash = await hashToken(refreshToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      await base44.asServiceRole.entities.Session.create({
        user_id: newUser.id,
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });
      console.log('Session created successfully');
    } catch (sessionError) {
      console.error('Session creation error (non-critical):', sessionError);
    }

    // Create UserXP record
    console.log('Creating UserXP record...');
    try {
      await base44.asServiceRole.entities.UserXP.create({
        user_id: newUser.id,
        total_xp: 0,
        current_level: 1,
        current_level_xp: 0,
        xp_for_next_level: 1000,
        last_xp_date: new Date().toISOString()
      });
      console.log('UserXP created successfully');
    } catch (xpError) {
      console.error('UserXP creation error (non-critical):', xpError);
    }

    // Log audit
    console.log('Logging audit...');
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        actor_id: newUser.id,
        actor_role: 'user',
        action: 'auth.register',
        target_type: 'User',
        target_id: newUser.id,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        after: { username: newUser.username, email: newUser.email }
      });
      console.log('Audit logged successfully');
    } catch (auditError) {
      console.error('Audit log error (non-critical):', auditError);
    }

    // Remove sensitive data from response
    const userResponse = { ...newUser };
    delete userResponse.password_hash;

    console.log('Registration complete!');
    console.log('=== REGISTRATION SUCCESS ===');

    return Response.json({
      success: true,
      accessToken,
      refreshToken,
      user: userResponse
    });

  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return Response.json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ett oväntat fel uppstod vid registrering',
        details: error.message,
        type: error.constructor.name
      }
    }, { status: 500 });
  }
});
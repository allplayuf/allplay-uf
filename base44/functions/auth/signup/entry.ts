import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as jose from 'npm:jose@5.2.0';
import * as bcrypt from 'npm:bcryptjs@2.4.3';
import { ulid } from 'npm:ulid@2.3.0';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'allplay-secret-key-change-in-production');
const REFRESH_SECRET = new TextEncoder().encode(Deno.env.get('REFRESH_SECRET') || 'allplay-refresh-secret-change-in-production');

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashRequestBody(body) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(body));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Rate limiting (in-memory, resets on restart)
const rateLimits = new Map();
const MAX_ATTEMPTS = 30;
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = rateLimits.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }
  
  recentAttempts.push(now);
  rateLimits.set(ip, recentAttempts);
  return true;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return Response.json(
        { error: { code: 'RATE_LIMIT', message: 'För många försök. Försök igen om en minut.' } },
        { status: 429 }
      );
    }

    // Get idempotency key
    const idempotencyKey = req.headers.get('idempotency-key') || ulid();
    
    const body = await req.json();
    const requestHash = await hashRequestBody(body);
    
    // Check idempotency
    const existingKey = await base44.asServiceRole.entities.IdempotencyKey.filter({
      key: idempotencyKey,
      endpoint: '/auth/signup'
    });
    
    if (existingKey.length > 0) {
      const existing = existingKey[0];
      if (existing.request_hash === requestHash && new Date(existing.expires_at) > new Date()) {
        // Return cached response
        return Response.json(existing.response_body, { status: existing.response_status });
      }
    }

    const { email, password, displayName, birthYear, city } = body;

    // Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const errorResponse = { error: { code: 'VALIDATION_ERROR', message: 'Ogiltig e-postadress' } };
      return Response.json(errorResponse, { status: 400 });
    }

    if (!password || password.length < 8) {
      const errorResponse = { error: { code: 'VALIDATION_ERROR', message: 'Lösenordet måste vara minst 8 tecken' } };
      return Response.json(errorResponse, { status: 400 });
    }

    if (!displayName || displayName.length < 2 || displayName.length > 32) {
      const errorResponse = { error: { code: 'VALIDATION_ERROR', message: 'Visningsnamnet måste vara 2-32 tecken' } };
      return Response.json(errorResponse, { status: 400 });
    }

    if (birthYear && (birthYear < 1950 || birthYear > new Date().getFullYear())) {
      const errorResponse = { error: { code: 'VALIDATION_ERROR', message: 'Ogiltigt födelseår' } };
      return Response.json(errorResponse, { status: 400 });
    }

    // Check if email exists
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
    if (existingUsers.length > 0) {
      const errorResponse = { error: { code: 'CONFLICT', message: 'Ett konto med denna e-postadress finns redan' } };
      
      // Save idempotency
      await base44.asServiceRole.entities.IdempotencyKey.create({
        key: idempotencyKey,
        endpoint: '/auth/signup',
        request_hash: requestHash,
        response_status: 409,
        response_body: errorResponse,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      return Response.json(errorResponse, { status: 409 });
    }

    // Hash password with bcrypt (cost 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Determine if minor
    const currentYear = new Date().getFullYear();
    const isMinor = birthYear ? (currentYear - birthYear) < 18 : false;

    // Create user
    const user = await base44.asServiceRole.entities.User.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName,
      full_name: displayName,
      username: email.split('@')[0].toLowerCase(),
      birth_year: birthYear || null,
      is_minor: isMinor,
      city: city || null,
      cityNormalized: city ? city.toLowerCase().trim() : null,
      profile_completed: false,
      last_login_at: new Date().toISOString(),
      role: 'user',
      elo_rating: 1200
    });

    // Generate tokens
    const accessToken = await new jose.SignJWT({ sub: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('20m')
      .sign(JWT_SECRET);

    const refreshToken = await new jose.SignJWT({ sub: user.id, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('14d')
      .sign(REFRESH_SECRET);

    // Store session
    const refreshTokenHash = await hashToken(refreshToken);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await base44.asServiceRole.entities.Session.create({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      user_agent: userAgent,
      ip_address: ip,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

    const successResponse = {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        username: user.username,
        profile_completed: user.profile_completed,
        role: user.role,
        is_minor: user.is_minor
      }
    };

    // Save idempotency
    await base44.asServiceRole.entities.IdempotencyKey.create({
      key: idempotencyKey,
      endpoint: '/auth/signup',
      request_hash: requestHash,
      response_status: 200,
      response_body: successResponse,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return Response.json(successResponse);

  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Ett oväntat fel uppstod', details: error.message } },
      { status: 500 }
    );
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as jose from 'npm:jose@5.2.0';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'allplay-secret-key-change-in-production');
const REFRESH_SECRET = new TextEncoder().encode(Deno.env.get('REFRESH_SECRET') || 'allplay-refresh-secret-change-in-production');

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Rate limiting
const rateLimits = new Map();
const MAX_ATTEMPTS = 120;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(userId) {
  const now = Date.now();
  const attempts = rateLimits.get(userId) || [];
  const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }
  
  recentAttempts.push(now);
  rateLimits.set(userId, recentAttempts);
  return true;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Refresh token krävs' } },
        { status: 400 }
      );
    }

    // Verify refresh token
    let payload;
    try {
      const { payload: verifiedPayload } = await jose.jwtVerify(refreshToken, REFRESH_SECRET);
      payload = verifiedPayload;
    } catch (error) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Ogiltig eller utgången token' } },
        { status: 401 }
      );
    }

    const userId = payload.sub;

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return Response.json(
        { error: { code: 'RATE_LIMIT', message: 'För många försök. Försök igen om en minut.' } },
        { status: 429 }
      );
    }

    // Find session
    const refreshTokenHash = await hashToken(refreshToken);
    const sessions = await base44.asServiceRole.entities.Session.filter({
      user_id: userId,
      refresh_token_hash: refreshTokenHash
    });

    if (sessions.length === 0) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Session hittades inte' } },
        { status: 401 }
      );
    }

    const session = sessions[0];

    // Check if revoked or expired
    if (session.revoked_at || new Date(session.expires_at) < new Date()) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Session har utgått' } },
        { status: 401 }
      );
    }

    // Get user
    const user = await base44.asServiceRole.entities.User.get(userId);

    if (!user || user.blocked || user.status === 'banned') {
      return Response.json(
        { error: { code: 'FORBIDDEN', message: 'Användaren är blockerad' } },
        { status: 403 }
      );
    }

    // Generate new tokens
    const newAccessToken = await new jose.SignJWT({ sub: user.id, email: user.email, role: user.role || 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('20m')
      .sign(JWT_SECRET);

    const newRefreshToken = await new jose.SignJWT({ sub: user.id, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('14d')
      .sign(REFRESH_SECRET);

    // Revoke old session
    await base44.asServiceRole.entities.Session.update(session.id, {
      revoked_at: new Date().toISOString()
    });

    // Create new session
    const newRefreshTokenHash = await hashToken(newRefreshToken);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    await base44.asServiceRole.entities.Session.create({
      user_id: user.id,
      refresh_token_hash: newRefreshTokenHash,
      user_agent: userAgent,
      ip_address: ip,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

    return Response.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        username: user.username,
        full_name: user.full_name,
        profile_completed: user.profile_completed,
        role: user.role || 'user',
        is_minor: user.is_minor
      }
    });

  } catch (error) {
    console.error('Refresh error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Ett oväntat fel uppstod', details: error.message } },
      { status: 500 }
    );
  }
});
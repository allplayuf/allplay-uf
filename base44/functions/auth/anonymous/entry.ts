import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as jose from 'npm:jose@5.2.0';

const REFRESH_SECRET = new TextEncoder().encode(Deno.env.get('REFRESH_SECRET') || 'allplay-refresh-secret-change-in-production');

// Use Web Crypto API for hashing (not bcrypt, but works for tokens)
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Generate anonymous ID
    const anonymousId = `anon_${crypto.randomUUID()}`;

    // Create anonymous refresh token
    const refreshToken = await new jose.SignJWT({ 
      sub: anonymousId, 
      type: 'anonymous' 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(REFRESH_SECRET);

    // Store anonymous session
    const refreshTokenHash = await hashToken(refreshToken);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    try {
      await base44.asServiceRole.entities.Session.create({
        anonymous_id: anonymousId,
        refresh_token_hash: refreshTokenHash,
        user_agent: userAgent,
        ip_address: ip,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // Continue anyway - session is optional for anonymous
    }

    return Response.json({
      anonymousId,
      refreshToken
    });

  } catch (error) {
    console.error('Anonymous session error:', error);
    console.error('Error stack:', error.stack);
    return Response.json(
      { 
        error: 'Ett fel uppstod',
        details: error.message 
      },
      { status: 500 }
    );
  }
});
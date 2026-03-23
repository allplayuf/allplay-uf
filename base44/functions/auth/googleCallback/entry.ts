import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as jose from 'npm:jose@5.2.0';

async function exchangeCodeForTokens(code, redirectUri) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Token exchange failed:', errorData);
    throw new Error('Failed to exchange code for tokens');
  }
  
  return await response.json();
}

async function verifyGoogleIdToken(idToken) {
  const JWKS = jose.createRemoteJWKSet(
    new URL('https://www.googleapis.com/oauth2/v3/certs')
  );
  
  const { payload } = await jose.jwtVerify(idToken, JWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: Deno.env.get('GOOGLE_CLIENT_ID')
  });
  
  return payload;
}

async function generateTokens(userId) {
  const jwtSecret = new TextEncoder().encode(Deno.env.get('JWT_SECRET'));
  
  // Access token (15 min)
  const accessToken = await new jose.SignJWT({ userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
  
  // Refresh token (30 days)
  const refreshToken = await new jose.SignJWT({ userId, type: 'refresh', jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(jwtSecret);
  
  return { accessToken, refreshToken };
}

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      const frontendUrl = url.origin;
      return Response.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return Response.redirect(`${url.origin}?auth_error=no_code`);
    }
    
    // Exchange code for tokens
    const redirectUri = `${url.origin}/api/functions/auth/googleCallback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    
    // Verify ID token
    const googleUser = await verifyGoogleIdToken(tokens.id_token);
    
    // Find or create user
    const allUsers = await base44.asServiceRole.entities.User.list();
    let user = allUsers.find(u => u.email === googleUser.email);
    
    if (!user) {
      // Create new user
      user = await base44.asServiceRole.entities.User.create({
        email: googleUser.email,
        full_name: googleUser.name || googleUser.email.split('@')[0],
        profile_image_url: googleUser.picture,
        profile_completed: false,
        status: 'active',
        role: 'user'
      });
      
      // Create OAuth account record
      await base44.asServiceRole.entities.OAuthAccount.create({
        user_id: user.id,
        provider: 'google',
        provider_user_id: googleUser.sub,
        email: googleUser.email,
        last_login_at: new Date().toISOString()
      });
    } else {
      // Update last login
      const oauthAccounts = await base44.asServiceRole.entities.OAuthAccount.filter({
        user_id: user.id,
        provider: 'google'
      });
      
      if (oauthAccounts.length > 0) {
        await base44.asServiceRole.entities.OAuthAccount.update(oauthAccounts[0].id, {
          last_login_at: new Date().toISOString()
        });
      } else {
        // Create OAuth account if it doesn't exist
        await base44.asServiceRole.entities.OAuthAccount.create({
          user_id: user.id,
          provider: 'google',
          provider_user_id: googleUser.sub,
          email: googleUser.email,
          last_login_at: new Date().toISOString()
        });
      }
    }
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);
    
    // Hash refresh token before storing
    const refreshTokenHash = await hashToken(refreshToken);
    
    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await base44.asServiceRole.entities.Session.create({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      user_agent: req.headers.get('user-agent') || '',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      expires_at: expiresAt.toISOString()
    });
    
    // Redirect to frontend with tokens
    const frontendUrl = url.origin;
    const profileCompleted = user.profile_completed ? '1' : '0';
    
    return Response.redirect(
      `${frontendUrl}?access_token=${accessToken}&refresh_token=${refreshToken}&profile_completed=${profileCompleted}`
    );
    
  } catch (error) {
    console.error('Google callback error:', error);
    const url = new URL(req.url);
    return Response.redirect(`${url.origin}?auth_error=${encodeURIComponent(error.message)}`);
  }
});
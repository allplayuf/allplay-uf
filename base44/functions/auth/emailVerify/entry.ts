import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as jose from 'npm:jose@5.2.0';

async function generateTokens(userId) {
  const jwtSecret = new TextEncoder().encode(Deno.env.get('JWT_SECRET'));
  
  const accessToken = await new jose.SignJWT({ userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
  
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
    const { token, email } = await req.json();
    
    if (!token || !email) {
      return Response.json({ 
        error: 'Saknar token eller e-post' 
      }, { status: 400 });
    }
    
    // Find verification token
    const verifications = await base44.asServiceRole.entities.EmailVerification.filter({
      email,
      token,
      purpose: 'login'
    });
    
    if (verifications.length === 0) {
      return Response.json({ 
        error: 'Ogiltig eller utgången länk' 
      }, { status: 400 });
    }
    
    const verification = verifications[0];
    
    // Check if already consumed
    if (verification.consumed_at) {
      return Response.json({ 
        error: 'Länken har redan använts' 
      }, { status: 400 });
    }
    
    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return Response.json({ 
        error: 'Länken har gått ut' 
      }, { status: 400 });
    }
    
    // Mark as consumed
    await base44.asServiceRole.entities.EmailVerification.update(verification.id, {
      consumed_at: new Date().toISOString()
    });
    
    // Find or create user
    const allUsers = await base44.asServiceRole.entities.User.list();
    let user = allUsers.find(u => u.email === email);
    
    if (!user) {
      // Create new user
      user = await base44.asServiceRole.entities.User.create({
        email,
        full_name: email.split('@')[0],
        profile_completed: false,
        status: 'active',
        role: 'user'
      });
      
      // Create OAuth account record
      await base44.asServiceRole.entities.OAuthAccount.create({
        user_id: user.id,
        provider: 'email',
        provider_user_id: email,
        email,
        last_login_at: new Date().toISOString()
      });
    } else {
      // Update last login
      const oauthAccounts = await base44.asServiceRole.entities.OAuthAccount.filter({
        user_id: user.id,
        provider: 'email'
      });
      
      if (oauthAccounts.length > 0) {
        await base44.asServiceRole.entities.OAuthAccount.update(oauthAccounts[0].id, {
          last_login_at: new Date().toISOString()
        });
      } else {
        await base44.asServiceRole.entities.OAuthAccount.create({
          user_id: user.id,
          provider: 'email',
          provider_user_id: email,
          email,
          last_login_at: new Date().toISOString()
        });
      }
    }
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);
    
    // Hash refresh token
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
    
    return Response.json({
      accessToken,
      refreshToken,
      user
    });
    
  } catch (error) {
    console.error('Email verify error:', error);
    return Response.json({ 
      error: 'Verifiering misslyckades' 
    }, { status: 500 });
  }
});
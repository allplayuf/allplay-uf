import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as jose from 'npm:jose@5.2.0';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'default-jwt-secret-change-me');
const REFRESH_SECRET = new TextEncoder().encode(Deno.env.get('REFRESH_SECRET') || 'default-refresh-secret-change-me');

// Helper: Verify password
async function verifyPassword(password, storedHash) {
  try {
    const encoder = new TextEncoder();
    const decoded = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    
    const salt = decoded.slice(0, 16);
    const hash = decoded.slice(16);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const computedHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const computedArray = new Uint8Array(computedHash);
    
    if (hash.length !== computedArray.length) return false;
    
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] !== computedArray[i]) return false;
    }
    
    return true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Helper: Generate JWT tokens
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

// Helper: Hash refresh token
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
    
    const { identifier, password } = body;

    console.log('Login attempt for:', identifier);

    if (!identifier || !password) {
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Användarnamn/e-post och lösenord krävs'
        }
      }, { status: 400 });
    }

    // Find user by username or email
    console.log('Fetching users...');
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`Found ${allUsers.length} total users`);
    
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const user = allUsers.find(u => 
      u.username?.toLowerCase().trim() === normalizedIdentifier ||
      u.email?.toLowerCase().trim() === normalizedIdentifier
    );

    if (!user) {
      console.log('User not found for identifier:', normalizedIdentifier);
      return Response.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Fel användarnamn/e-post eller lösenord'
        }
      }, { status: 401 });
    }

    console.log('User found:', user.id, user.username);

    if (!user.password_hash) {
      console.log('User has no password hash');
      return Response.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Fel användarnamn/e-post eller lösenord'
        }
      }, { status: 401 });
    }

    // Verify password
    console.log('Verifying password...');
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      console.log('Password verification failed');
      return Response.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Fel användarnamn/e-post eller lösenord'
        }
      }, { status: 401 });
    }

    console.log('Password verified successfully');

    // Check if user is banned/suspended
    if (user.status === 'banned' || user.blocked) {
      console.log('User is banned/blocked');
      return Response.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Ditt konto har blivit avstängt'
        }
      }, { status: 403 });
    }

    if (user.status === 'suspended') {
      console.log('User is suspended');
      return Response.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Ditt konto är tillfälligt avstängt'
        }
      }, { status: 403 });
    }

    // Update last login
    console.log('Updating last login...');
    await base44.asServiceRole.entities.User.update(user.id, {
      last_login_at: new Date().toISOString()
    });

    // Generate tokens
    console.log('Generating tokens...');
    const { accessToken, refreshToken } = await generateTokens(
      user.id,
      user.username,
      user.role || 'user'
    );

    // Create session
    console.log('Creating session...');
    const refreshTokenHash = await hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await base44.asServiceRole.entities.Session.create({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    // Log audit
    console.log('Logging audit...');
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        actor_id: user.id,
        actor_role: user.role || 'user',
        action: 'auth.loginSuccess',
        target_type: 'User',
        target_id: user.id,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (auditError) {
      console.error('Audit log error (non-critical):', auditError);
    }

    // Remove sensitive data
    const userResponse = { ...user };
    delete userResponse.password_hash;

    console.log('Login successful for user:', user.id);

    return Response.json({
      accessToken,
      refreshToken,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    return Response.json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ett fel uppstod vid inloggning',
        details: error.message
      }
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, email, newPassword } = await req.json();
    
    if (!token || !email || !newPassword) {
      return Response.json({ 
        error: 'Saknar obligatoriska fält' 
      }, { status: 400 });
    }
    
    if (newPassword.length < 8) {
      return Response.json({ 
        error: 'Lösenordet måste vara minst 8 tecken' 
      }, { status: 400 });
    }
    
    // Find verification token
    const verifications = await base44.asServiceRole.entities.EmailVerification.filter({
      email,
      token,
      purpose: 'password_reset'
    });
    
    if (verifications.length === 0) {
      return Response.json({ 
        error: 'Ogiltig eller utgången återställningslänk' 
      }, { status: 400 });
    }
    
    const verification = verifications[0];
    
    // Check if already consumed
    if (verification.consumed_at) {
      return Response.json({ 
        error: 'Återställningslänken har redan använts' 
      }, { status: 400 });
    }
    
    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return Response.json({ 
        error: 'Återställningslänken har gått ut' 
      }, { status: 400 });
    }
    
    // Find user
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (users.length === 0) {
      return Response.json({ 
        error: 'Användare hittades inte' 
      }, { status: 404 });
    }
    
    const user = users[0];
    
    // Mark verification as consumed
    await base44.asServiceRole.entities.EmailVerification.update(verification.id, {
      consumed_at: new Date().toISOString()
    });
    
    // Update password
    const passwordHash = await hashPassword(newPassword);
    await base44.asServiceRole.entities.User.update(user.id, {
      password_hash: passwordHash
    });
    
    // Revoke all existing sessions for security
    const sessions = await base44.asServiceRole.entities.Session.filter({
      user_id: user.id
    });
    
    for (const session of sessions) {
      if (!session.revoked_at) {
        await base44.asServiceRole.entities.Session.update(session.id, {
          revoked_at: new Date().toISOString()
        });
      }
    }
    
    return Response.json({
      success: true,
      message: 'Lösenord återställt! Du kan nu logga in med ditt nya lösenord.'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json({ 
      error: 'Återställning misslyckades' 
    }, { status: 500 });
  }
});
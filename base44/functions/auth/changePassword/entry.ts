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

async function verifyPassword(password, storedHash) {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
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
    const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return computedHashHex === hashHex;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Inte inloggad' } },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nuvarande och nytt lösenord krävs' } },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nytt lösenord måste vara minst 8 tecken' } },
        { status: 400 }
      );
    }

    const fullUser = await base44.asServiceRole.entities.User.get(user.id);

    if (!fullUser.password_hash) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Du måste först sätta ett lösenord för ditt konto' } },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(currentPassword, fullUser.password_hash);
    
    if (!isValid) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Nuvarande lösenord är felaktigt' } },
        { status: 401 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await base44.asServiceRole.entities.User.update(user.id, {
      password_hash: newPasswordHash
    });

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
      message: 'Lösenord ändrat. Du har loggats ut från alla enheter.' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Ett oväntat fel uppstod', details: error.message } },
      { status: 500 }
    );
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Use Web Crypto API for password hashing (PBKDF2)
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
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password, username } = await req.json();

    // Validation
    if (!password || password.length < 8) {
      return Response.json(
        { error: 'Lösenordet måste vara minst 8 tecken' },
        { status: 400 }
      );
    }

    // Check if user already has a password
    if (user.password_hash) {
      return Response.json(
        { error: 'Användaren har redan ett lösenord. Använd ändra lösenord istället.' },
        { status: 400 }
      );
    }

    const updateData = {
      password_hash: await hashPassword(password)
    };

    // If username is provided and different, update it too
    if (username && username.trim() !== user.username) {
      // Validate username
      if (username.trim().length < 3) {
        return Response.json(
          { error: 'Användarnamnet måste vara minst 3 tecken' },
          { status: 400 }
        );
      }

      if (username.length > 30) {
        return Response.json(
          { error: 'Användarnamnet får inte vara längre än 30 tecken' },
          { status: 400 }
        );
      }

      // Check profanity
      try {
        const profanityCheck = await base44.asServiceRole.functions.invoke('profanityFilter', {
          text: username,
          field: 'username'
        });

        if (!profanityCheck.data.isClean) {
          return Response.json(
            { error: profanityCheck.data.message || 'Användarnamnet innehåller olämpligt språk' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Profanity check failed:', error);
      }

      // Check if username is taken
      const existingUsers = await base44.asServiceRole.entities.User.filter({ 
        username: username.trim().toLowerCase() 
      });
      
      if (existingUsers.length > 0 && existingUsers[0].id !== user.id) {
        return Response.json(
          { error: 'Användarnamnet är redan taget' },
          { status: 400 }
        );
      }

      updateData.username = username.trim().toLowerCase();
    }

    // Update user with new password (and optionally username)
    await base44.asServiceRole.entities.User.update(user.id, updateData);

    return Response.json({ 
      success: true,
      message: 'Lösenord har lagts till framgångsrikt'
    });

  } catch (error) {
    console.error('Add password error:', error);
    return Response.json(
      { error: 'Ett fel uppstod', details: error.message },
      { status: 500 }
    );
  }
});
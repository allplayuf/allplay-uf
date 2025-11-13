import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { identifier, password } = await req.json();

    console.log('=== TEST LOGIN ===');
    console.log('Identifier:', identifier);
    console.log('Password:', password);

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`Total users: ${allUsers.length}`);

    const normalizedIdentifier = identifier.toLowerCase().trim();
    const user = allUsers.find(u => 
      u.username?.toLowerCase().trim() === normalizedIdentifier ||
      u.email?.toLowerCase().trim() === normalizedIdentifier
    );

    if (!user) {
      return Response.json({
        success: false,
        error: 'User not found',
        searched_for: normalizedIdentifier,
        available_users: allUsers.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email
        }))
      });
    }

    console.log('Found user:', user.id, user.username, user.email);
    console.log('Has password hash:', !!user.password_hash);

    if (!user.password_hash) {
      return Response.json({
        success: false,
        error: 'User has no password hash',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          has_password: false
        }
      });
    }

    // Test password verification
    console.log('Testing password verification...');
    const isValid = await verifyPassword(password, user.password_hash);
    console.log('Password valid:', isValid);

    return Response.json({
      success: true,
      password_valid: isValid,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        has_password: true,
        status: user.status,
        blocked: user.blocked
      }
    });

  } catch (error) {
    console.error('Test login error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
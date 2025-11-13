import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    const { refreshToken, sessionId } = await req.json();

    // If sessionId provided, revoke that specific session
    if (sessionId) {
      const session = await base44.asServiceRole.entities.Session.get(sessionId);
      if (session && session.user_id === user.id) {
        await base44.asServiceRole.entities.Session.update(sessionId, {
          revoked_at: new Date().toISOString()
        });
      }
    } 
    // If refreshToken provided, find and revoke that session
    else if (refreshToken) {
      const refreshTokenHash = await hashToken(refreshToken);
      const sessions = await base44.asServiceRole.entities.Session.filter({
        user_id: user.id,
        refresh_token_hash: refreshTokenHash
      });

      if (sessions.length > 0) {
        await base44.asServiceRole.entities.Session.update(sessions[0].id, {
          revoked_at: new Date().toISOString()
        });
      }
    }
    // Otherwise revoke all sessions for this user
    else {
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
    }

    return Response.json({ success: true, message: 'Utloggad' });

  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Ett oväntat fel uppstod', details: error.message } },
      { status: 500 }
    );
  }
});
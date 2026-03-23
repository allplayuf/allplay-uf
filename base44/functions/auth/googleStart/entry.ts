Deno.serve(async (req) => {
  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = `${new URL(req.url).origin}/api/functions/auth/googleCallback`;
    
    if (!clientId) {
      return Response.json({ 
        error: 'Google OAuth är inte konfigurerat' 
      }, { status: 500 });
    }
    
    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    // Dummy await to satisfy linter
    await Promise.resolve();
    
    return Response.json({
      authUrl: authUrl.toString(),
      state
    });
    
  } catch (error) {
    console.error('Google start error:', error);
    return Response.json({ 
      error: 'Kunde inte starta Google-inloggning' 
    }, { status: 500 });
  }
});
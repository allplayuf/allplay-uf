import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function sendPasswordResetEmail(email, token) {
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
  const resetLink = `${appUrl}?reset_token=${token}&email=${encodeURIComponent(email)}`;
  
  if (!sendgridKey) {
    console.warn('SendGrid not configured, would send:', resetLink);
    return;
  }
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: 'Återställ ditt lösenord - AllPlay'
      }],
      from: {
        email: 'noreply@allplay.se',
        name: 'AllPlay UF'
      },
      content: [{
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2BA84A;">Återställ ditt lösenord ⚽</h2>
            <p>Vi fick en förfrågan om att återställa lösenordet för ditt AllPlay-konto.</p>
            <p>Klicka på knappen nedan för att skapa ett nytt lösenord:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2BA84A; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
              Återställ lösenord
            </a>
            <p style="color: #666; font-size: 14px;">Länken är giltig i 1 timme.</p>
            <p style="color: #666; font-size: 12px;">Om du inte begärde återställning av lösenord kan du ignorera detta meddelande.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">Detta är ett automatiskt meddelande från AllPlay UF. Svara inte på detta e-postmeddelande.</p>
          </div>
        `
      }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SendGrid error:', errorText);
    throw new Error('Failed to send email');
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return Response.json({ 
        error: 'Ogiltig e-postadress' 
      }, { status: 400 });
    }
    
    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (users.length === 0) {
      // Don't reveal if email exists for security
      return Response.json({
        success: true,
        message: 'Om e-postadressen finns i systemet har vi skickat återställningsinstruktioner.'
      });
    }
    
    const user = users[0];
    
    // Check if user has a password (not just OAuth)
    if (!user.password_hash) {
      return Response.json({
        success: true,
        message: 'Om e-postadressen finns i systemet har vi skickat återställningsinstruktioner.'
      });
    }
    
    // Rate limiting check
    const recentResets = await base44.asServiceRole.entities.EmailVerification.filter({
      email,
      purpose: 'password_reset'
    });
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCount = recentResets.filter(v => 
      new Date(v.created_date) > fiveMinutesAgo
    ).length;
    
    if (recentCount >= 3) {
      return Response.json({ 
        error: 'För många försök. Vänta 5 minuter.' 
      }, { status: 429 });
    }
    
    // Generate token
    const token = crypto.randomUUID();
    
    // Store verification token
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour
    
    await base44.asServiceRole.entities.EmailVerification.create({
      email,
      token,
      purpose: 'password_reset',
      expires_at: expiresAt.toISOString()
    });
    
    // Send email
    await sendPasswordResetEmail(email, token);
    
    return Response.json({
      success: true,
      message: 'Om e-postadressen finns i systemet har vi skickat återställningsinstruktioner.'
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    return Response.json({ 
      error: 'Kunde inte skicka e-post. Försök igen.' 
    }, { status: 500 });
  }
});
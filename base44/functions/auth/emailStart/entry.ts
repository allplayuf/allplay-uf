import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function sendMagicLinkEmail(email, token) {
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
  const magicLink = `${appUrl}?magic_token=${token}&email=${encodeURIComponent(email)}`;
  
  if (!sendgridKey) {
    console.warn('SendGrid not configured, would send:', magicLink);
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
        subject: 'Din inloggningslänk till AllPlay'
      }],
      from: {
        email: 'noreply@allplay.se',
        name: 'AllPlay UF'
      },
      content: [{
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2BA84A;">Välkommen till AllPlay! ⚽</h2>
            <p>Klicka på knappen nedan för att logga in:</p>
            <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #2BA84A; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
              Logga in
            </a>
            <p style="color: #666; font-size: 14px;">Länken är giltig i 15 minuter.</p>
            <p style="color: #666; font-size: 12px;">Om du inte begärde denna inloggning, kan du ignorera detta meddelande.</p>
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
    
    // Rate limiting check (simple version)
    const recentVerifications = await base44.asServiceRole.entities.EmailVerification.filter({
      email,
      purpose: 'login'
    });
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = recentVerifications.filter(v => 
      new Date(v.created_date) > oneMinuteAgo
    ).length;
    
    if (recentCount >= 3) {
      return Response.json({ 
        error: 'För många försök. Vänta en minut.' 
      }, { status: 429 });
    }
    
    // Generate token
    const token = crypto.randomUUID();
    
    // Store verification token
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    await base44.asServiceRole.entities.EmailVerification.create({
      email,
      token,
      purpose: 'login',
      expires_at: expiresAt.toISOString()
    });
    
    // Send email
    await sendMagicLinkEmail(email, token);
    
    return Response.json({
      success: true,
      message: 'E-post skickad! Kolla din inkorg.'
    });
    
  } catch (error) {
    console.error('Email start error:', error);
    return Response.json({ 
      error: 'Kunde inte skicka e-post. Försök igen.' 
    }, { status: 500 });
  }
});
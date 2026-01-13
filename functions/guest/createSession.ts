import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { ulid } from 'npm:ulid@2.3.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Generate unique guest ID
    const guestId = ulid();
    
    // Create device fingerprint from IP + User Agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const fingerprintData = `${ipAddress}-${userAgent}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const deviceFingerprint = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    // Create guest session
    const session = await base44.asServiceRole.entities.GuestSession.create({
      guest_id: guestId,
      device_fingerprint: deviceFingerprint,
      last_seen_at: new Date().toISOString(),
      ab_bucket: Math.random() > 0.5 ? 'A' : 'B',
      feature_flags: {}
    });

    // Log telemetry
    console.log('Guest session created:', {
      guest_id: guestId,
      ip: ipAddress,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      guestId,
      createdAt: session.created_date
    }, { status: 201 });

  } catch (error) {
    console.error('Create guest session error:', error);
    return Response.json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ett fel uppstod'
      }
    }, { status: 500 });
  }
});
/**
 * Match Notification Triggers
 * 
 * Called to notify players about:
 * - Match invitations
 * - Match reminders (upcoming matches)
 * - Nearby matches
 * 
 * Payload: { type: 'invitation' | 'reminder' | 'nearby', match_id: string, user_ids?: string[] }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, match_id, user_ids } = await req.json();

    if (!type || !match_id) {
      return Response.json({ error: 'Missing required: type, match_id' }, { status: 400 });
    }

    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    // Fetch match details
    const matchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/matches?id=eq.${match_id}&select=*`,
      { headers }
    );
    const matches = await matchRes.json();
    const match = matches?.[0];

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Fetch venue name
    let venueName = 'Okänd plats';
    if (match.venue_id) {
      const venueRes = await fetch(
        `${SUPABASE_URL}/rest/v1/venues?id=eq.${match.venue_id}&select=name`,
        { headers }
      );
      const venues = await venueRes.json();
      if (venues?.[0]?.name) venueName = venues[0].name;
    }

    let targetUserIds = user_ids || [];
    let title = '';
    let body = '';
    let data = { match_id, click_action: `/MatchDetail?id=${match_id}` };

    switch (type) {
      case 'invitation': {
        // user_ids should already be provided (the invited users)
        title = '⚽ Matchinbjudan!';
        body = `Du har blivit inbjuden till "${match.title}" på ${venueName}, ${match.date} kl ${match.time}`;
        break;
      }
      
      case 'reminder': {
        // Get all participants for this match
        const partRes = await fetch(
          `${SUPABASE_URL}/rest/v1/match_participants?match_id=eq.${match_id}&status=in.(registered,confirmed)&select=user_id`,
          { headers }
        );
        const participants = await partRes.json();
        targetUserIds = (participants || []).map(p => p.user_id);
        
        title = '⏰ Matchpåminnelse';
        body = `"${match.title}" börjar snart! ${match.date} kl ${match.time} på ${venueName}`;
        break;
      }
      
      case 'nearby': {
        // user_ids should be provided (users near the venue)
        title = '📍 Match nära dig!';
        body = `"${match.title}" spelas på ${venueName}, ${match.date} kl ${match.time}. Häng med!`;
        break;
      }
      
      default:
        return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (targetUserIds.length === 0) {
      return Response.json({ sent: 0, message: 'No target users' });
    }

    // Call sendPushNotification function
    const result = await base44.functions.invoke('sendPushNotification', {
      user_ids: targetUserIds,
      title,
      body,
      data
    });

    return Response.json({ 
      ok: true, 
      type,
      match_id,
      target_users: targetUserIds.length,
      push_result: result
    });
  } catch (error) {
    console.error('notifyMatchUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
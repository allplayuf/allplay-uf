/**
 * Match Notification Triggers
 * 
 * Supports two call modes:
 * 1. Frontend: { type: string, match_id: string, user_ids?: string[] }
 * 2. Entity automation: { event: { type, entity_name, entity_id }, data: {...}, old_data: {...} }
 * 
 * Supported types:
 * - new_match: Ny match skapad
 * - match_updated: Match ändrad
 * - player_joined: Spelare gick med
 * - player_left: Spelare lämnade
 * - match_cancelled: Match inställd
 * - match_reminder: Påminnelse
 * - match_full: Matchen full
 * - invitation: Matchinbjudan
 * - nearby: Match nära dig
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';

const EVENT_CONFIG = {
  new_match:       { emoji: '⚽', title: 'Ny match!',           template: (m, v) => `"${m.title}" på ${v}, ${m.date} kl ${m.time}` },
  match_updated:   { emoji: '📝', title: 'Match uppdaterad',    template: (m, v) => `"${m.title}" på ${v} har uppdaterats` },
  player_joined:   { emoji: '👋', title: 'Ny spelare!',         template: (m, v) => `En spelare har gått med i "${m.title}"` },
  player_left:     { emoji: '🚶', title: 'Spelare lämnade',     template: (m, v) => `En spelare har lämnat "${m.title}"` },
  match_cancelled: { emoji: '❌', title: 'Match inställd',      template: (m, v) => `"${m.title}" på ${v} har ställts in` },
  match_reminder:  { emoji: '⏰', title: 'Matchpåminnelse',     template: (m, v) => `"${m.title}" börjar snart! ${m.date} kl ${m.time} på ${v}` },
  match_full:      { emoji: '🎉', title: 'Matchen full!',       template: (m, v) => `"${m.title}" på ${v} är nu full` },
  invitation:      { emoji: '⚽', title: 'Matchinbjudan!',      template: (m, v) => `Du har blivit inbjuden till "${m.title}" på ${v}, ${m.date} kl ${m.time}` },
  nearby:          { emoji: '📍', title: 'Match nära dig!',     template: (m, v) => `"${m.title}" spelas på ${v}, ${m.date} kl ${m.time}. Häng med!` },
};

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  return res.ok ? await res.json() : [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const dbHeaders = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    // Determine if this is an entity automation call or a frontend call
    let eventType, matchId, providedUserIds, triggerUserId;

    if (payload.event?.entity_name) {
      // Entity automation trigger
      const { event, data, old_data } = payload;
      matchId = event.entity_id || data?.id;
      triggerUserId = data?.organizer_id;

      if (event.type === 'create') {
        eventType = 'new_match';
      } else if (event.type === 'update') {
        if (data?.status === 'cancelled' && old_data?.status !== 'cancelled') {
          eventType = 'match_cancelled';
        } else if (data?.current_players > (old_data?.current_players || 0)) {
          eventType = 'player_joined';
        } else if (data?.current_players < (old_data?.current_players || 0)) {
          eventType = 'player_left';
        } else if (data?.max_players && data?.current_players >= data?.max_players) {
          eventType = 'match_full';
        } else {
          eventType = 'match_updated';
        }
      } else {
        return Response.json({ ok: true, skipped: true, reason: 'delete event' });
      }
    } else {
      // Frontend call - requires auth
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      triggerUserId = user.id;
      eventType = payload.type || payload.event_type;
      matchId = payload.match_id;
      providedUserIds = payload.user_ids;
    }

    if (!eventType || !matchId) {
      return Response.json({ error: 'Missing required: type/event_type, match_id' }, { status: 400 });
    }

    const config = EVENT_CONFIG[eventType];
    if (!config) {
      return Response.json({ error: `Unknown event type: ${eventType}` }, { status: 400 });
    }

    // Fetch match details
    const matches = await fetchJson(
      `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}&select=*`,
      dbHeaders
    );
    const match = matches?.[0];
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Fetch venue name
    let venueName = 'Okänd plats';
    if (match.venue_id) {
      const venues = await fetchJson(
        `${SUPABASE_URL}/rest/v1/venues?id=eq.${match.venue_id}&select=name`,
        dbHeaders
      );
      if (venues?.[0]?.name) venueName = venues[0].name;
    }

    // Determine target users
    let targetUserIds = providedUserIds || [];

    if (targetUserIds.length === 0) {
      // For most events, notify all match participants except the trigger user
      const participants = await fetchJson(
        `${SUPABASE_URL}/rest/v1/match_participants?match_id=eq.${matchId}&status=in.(registered,confirmed)&select=user_id`,
        dbHeaders
      );
      targetUserIds = (participants || [])
        .map(p => p.user_id)
        .filter(id => id !== triggerUserId); // Don't notify the person who triggered it
    }

    if (targetUserIds.length === 0) {
      return Response.json({ ok: true, sent: 0, message: 'No target users' });
    }

    const title = `${config.emoji} ${config.title}`;
    const body = config.template(match, venueName);
    const data = { match_id: matchId, click_action: `/MatchDetail?id=${matchId}` };

    // Call sendPushNotification
    const result = await base44.asServiceRole.functions.invoke('sendPushNotification', {
      user_ids: targetUserIds,
      title,
      body,
      data
    });

    console.log(`[notifyMatchUpdate] ${eventType} for match ${matchId} → ${targetUserIds.length} users`);

    return Response.json({
      ok: true,
      event_type: eventType,
      match_id: matchId,
      target_users: targetUserIds.length,
      push_result: result
    });
  } catch (error) {
    console.error('notifyMatchUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
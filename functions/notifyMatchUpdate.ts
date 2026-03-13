/**
 * Match Notification Triggers
 * 
 * Supports two call modes:
 * 1. Frontend: { type: string, match_id: string, user_ids?: string[] }
 * 2. Entity automation: { event: { type, entity_name, entity_id }, data: {...}, old_data: {...} }
 * 
 * Supported types:
 * - new_match, match_updated, player_joined, player_left
 * - match_cancelled, match_reminder, match_full
 * - invitation, nearby
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Determine if this is an entity automation call or a frontend call
    let eventType, matchId, providedUserIds, triggerUserId;

    if (payload.event?.entity_name) {
      // Entity automation trigger — no user auth available
      const { event, data, old_data } = payload;
      matchId = event.entity_id || data?.id;
      triggerUserId = data?.organizer_id || data?.created_by;

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

    // Use service role for all DB reads, fall back to automation payload data
    let match;
    try {
      match = await base44.asServiceRole.entities.Match.get(matchId);
    } catch (e) {
      console.warn('Failed to fetch match via SDK:', e.message);
      // For entity automations, use the data from the payload
      if (payload.data && payload.data.title) {
        match = payload.data;
      }
    }

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Fetch venue name
    let venueName = 'Okänd plats';
    if (match.venue_id) {
      try {
        const venue = await base44.asServiceRole.entities.Venue.get(match.venue_id);
        if (venue?.name) venueName = venue.name;
      } catch (e) {
        console.warn('Failed to fetch venue:', e.message);
      }
    }

    // Determine target users
    let targetUserIds = providedUserIds || [];

    if (targetUserIds.length === 0) {
      try {
        const participants = await base44.asServiceRole.entities.MatchParticipant.filter({ match_id: matchId });
        targetUserIds = (participants || [])
          .filter(p => p.status === 'registered' || p.status === 'confirmed')
          .map(p => p.user_id)
          .filter(id => id && id !== triggerUserId);
      } catch (e) {
        console.warn('Failed to fetch participants:', e.message);
      }
    }

    if (targetUserIds.length === 0) {
      console.log(`[notifyMatchUpdate] No target users for ${eventType} on match ${matchId}`);
      return Response.json({ ok: true, sent: 0, message: 'No target users' });
    }

    const title = `${config.emoji} ${config.title}`;
    const body = config.template(match, venueName);
    const notifData = { match_id: matchId, click_action: `/MatchDetail?id=${matchId}` };

    // Call sendPushNotification directly via internal function invoke
    let pushResult;
    try {
      pushResult = await base44.functions.invoke('sendPushNotification', {
        user_ids: targetUserIds,
        title,
        body,
        data: notifData
      });
    } catch (e) {
      console.error('Failed to invoke sendPushNotification:', e.message);
      // Fallback: try service role
      try {
        pushResult = await base44.asServiceRole.functions.invoke('sendPushNotification', {
          user_ids: targetUserIds,
          title,
          body,
          data: notifData
        });
      } catch (e2) {
        console.error('Service role invoke also failed:', e2.message);
        pushResult = { error: e2.message };
      }
    }

    console.log(`[notifyMatchUpdate] ${eventType} for match ${matchId} → ${targetUserIds.length} users, result:`, JSON.stringify(pushResult));

    return Response.json({
      ok: true,
      event_type: eventType,
      match_id: matchId,
      target_users: targetUserIds.length,
      push_result: pushResult
    });
  } catch (error) {
    console.error('notifyMatchUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
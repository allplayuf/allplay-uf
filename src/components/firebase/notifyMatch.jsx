/**
 * Frontend helper to trigger match push notifications via Supabase Edge Function.
 * 
 * Usage (fire-and-forget, no await):
 *   import { notifyMatch } from '@/components/firebase/notifyMatch';
 *   notifyMatch(matchId, 'player_joined');
 *   notifyMatch(matchId, 'match_invite', [userId1, userId2]);
 */
import { callEdgeFunction } from '@/components/supabase/callEdgeFunction';

export function notifyMatch(matchId, eventType, userIds = null) {
  const payload = {
    match_id: matchId,
    event_type: eventType,
  };
  if (userIds) {
    payload.user_ids = userIds;
  }

  // Fire-and-forget — never block the UI
  callEdgeFunction('notify-match-update', payload)
    .then(res => console.log(`[notifyMatch] ${eventType} for ${matchId}:`, res))
    .catch(err => console.error('[notifyMatch] Push notification error (non-blocking):', err.message));
}
/**
 * Frontend helper to trigger match push notifications.
 * 
 * Usage:
 *   import { notifyMatch } from '@/components/firebase/notifyMatch';
 *   await notifyMatch(matchId, 'player_joined');
 *   await notifyMatch(matchId, 'invitation', [userId1, userId2]);
 */
import { notifyMatchUpdate } from '@/functions/notifyMatchUpdate';

export async function notifyMatch(matchId, eventType, userIds = null) {
  try {
    const payload = {
      match_id: matchId,
      type: eventType,
    };
    if (userIds) {
      payload.user_ids = userIds;
    }
    
    const response = await notifyMatchUpdate(payload);
    console.log(`[notifyMatch] ${eventType} for ${matchId}:`, response?.data);
    return response?.data;
  } catch (err) {
    // Non-blocking — notifications should never break app flow
    console.error('[notifyMatch] Push notification error:', err);
    return null;
  }
}
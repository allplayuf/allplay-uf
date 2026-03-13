/**
 * Frontend helper to trigger match push notifications.
 * Calls the Supabase Edge Function notify-match-update directly.
 * 
 * Usage:
 *   import { notifyMatch } from '@/components/firebase/notifyMatch';
 *   notifyMatch(matchId, 'player_joined');  // fire-and-forget
 */
import { sessionStore } from '@/components/supabase/client';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/components/supabase/config';

export async function notifyMatch(matchId, eventType = 'match_update') {
  if (!matchId) {
    console.warn('[NOTIFY] Inget matchId — skippar notis');
    return;
  }

  try {
    console.log('[NOTIFY] Skickar notis för match:', matchId, 'event:', eventType);

    const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-match-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${sessionStore.accessToken}`,
      },
      body: JSON.stringify({
        match_id: matchId,
        event_type: eventType,
      }),
    });

    if (!res.ok) {
      console.error('[NOTIFY] Edge function error:', res.status, await res.text().catch(() => ''));
    } else {
      const data = await res.json().catch(() => ({}));
      console.log('[NOTIFY] Notis skickad:', data);
    }
  } catch (err) {
    // Notiser ska ALDRIG blocka huvudflödet
    console.error('[NOTIFY] Fetch error:', err);
  }
}
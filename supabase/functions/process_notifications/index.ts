// Scheduled worker (pg_cron, every minute):
//   1. Drains notification_queue (rows enqueued by DB triggers: friend
//      requests, team invites, soft-cancelled matches, player_left, ...)
//   2. Sends MATCH_STARTING_SOON reminders 120 min and 30 min before
//      starts_at to all joined players (flags: reminder_120_sent /
//      reminder_sent on matches).
//
// Delivery goes through the shared sendPushNotification helper (Expo Push
// API for ExponentPushToken[...], direct APNs for raw device tokens).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushNotification } from '../_shared/push.ts';

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const stats = { processed: 0, skipped: 0, errors: 0, reminders: 0 };

  // ── 1. Drain the notification queue (up to 50 per invocation) ──────────────
  const { data: queue } = await supabase
    .from('notification_queue')
    .select('*')
    .is('processed_at', null)
    .order('created_at', { ascending: true })
    .limit(50);

  for (const job of queue ?? []) {
    // DB triggers enqueue Swedish title/body and may put English variants in
    // data.title_en / data.body_en — lift those out for per-device locale.
    const { title_en, body_en, ...jobData } = (job.data ?? {}) as Record<string, unknown>;
    const result = await sendPushNotification(
      [job.user_id],
      { sv: job.title, en: (title_en as string) ?? job.title },
      { sv: job.body, en: (body_en as string) ?? job.body },
      jobData,
      supabase,
    );

    let jobError: string | null = null;
    if (result.error) {
      jobError = result.error;
      stats.errors++;
    } else if (result.total === 0) {
      stats.skipped++; // user has no registered device
    } else {
      stats.processed++;
    }

    await supabase
      .from('notification_queue')
      .update({ processed_at: new Date().toISOString(), error: jobError })
      .eq('id', job.id);
  }

  // ── 2. MATCH_STARTING_SOON — 120 min and 30 min before starts_at ───────────
  const REMINDERS = [
    { minutes: 120, flag: 'reminder_120_sent' },
    { minutes: 30,  flag: 'reminder_sent' },
  ] as const;

  const now = Date.now();

  for (const { minutes, flag } of REMINDERS) {
    // ±5 min window around the target so a once-a-minute cron can't miss it
    const winLo = new Date(now + (minutes - 5) * 60_000).toISOString();
    const winHi = new Date(now + (minutes + 5) * 60_000).toISOString();

    const { data: upcoming } = await supabase
      .from('matches')
      .select('id, title, venue:venues(name)')
      .eq('status', 'upcoming')
      .eq(flag, false)
      .gte('starts_at', winLo)
      .lte('starts_at', winHi);

    for (const match of upcoming ?? []) {
      // Flag first so a crash mid-send can't double-notify on the next run
      await supabase.from('matches').update({ [flag]: true }).eq('id', match.id);

      const { data: players } = await supabase
        .from('match_players')
        .select('user_id')
        .eq('match_id', match.id)
        .in('status', ['joined', 'checked_in']);

      const userIds = (players ?? []).map((p) => p.user_id);
      if (userIds.length === 0) continue;

      const venueName = (match as any).venue?.name ?? match.title ?? 'din match';
      const venueNameEn = (match as any).venue?.name ?? match.title ?? 'your match';
      const result = await sendPushNotification(
        userIds,
        {
          sv: `🕐 Match om ${minutes} minuter`,
          en: `🕐 Match in ${minutes} minutes`,
        },
        {
          sv: `Din match på ${venueName} börjar om ${minutes} minuter`,
          en: `Your match at ${venueNameEn} starts in ${minutes} minutes`,
        },
        { type: 'MATCH_STARTING_SOON', match_id: match.id, minutes },
        supabase,
      );
      stats.reminders += result.sent;
    }
  }

  return Response.json(stats);
});

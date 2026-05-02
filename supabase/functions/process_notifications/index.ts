import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;

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
    let jobError: string | null = null;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send_push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          user_id: job.user_id,
          title:   job.title,
          body:    job.body,
          data:    job.data,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        jobError = JSON.stringify(result);
        stats.errors++;
      } else if (result.sent === false && result.reason === 'no_device_token') {
        stats.skipped++;
      } else {
        stats.processed++;
      }
    } catch (e) {
      jobError = String(e);
      stats.errors++;
    }
    await supabase
      .from('notification_queue')
      .update({ processed_at: new Date().toISOString(), error: jobError })
      .eq('id', job.id);
  }

  // ── 2. 30-minute match reminders ────────────────────────────────────────────
  const now   = new Date();
  const win25 = new Date(now.getTime() + 25 * 60_000).toISOString();
  const win35 = new Date(now.getTime() + 35 * 60_000).toISOString();

  const { data: upcoming } = await supabase
    .from('matches')
    .select('id, title')
    .eq('status', 'upcoming')
    .eq('reminder_sent', false)
    .gte('starts_at', win25)
    .lte('starts_at', win35);

  for (const match of upcoming ?? []) {
    const { data: players } = await supabase
      .from('match_players')
      .select('user_id')
      .eq('match_id', match.id)
      .in('status', ['joined', 'checked_in']);

    const rows = (players ?? []).map((p) => ({
      user_id: p.user_id,
      title:   '⚽ Match om 30 min!',
      body:    (match.title ?? 'Din match') + ' börjar snart — ta dig dit!',
      data:    { match_id: match.id },
    }));

    if (rows.length > 0) await supabase.from('notification_queue').insert(rows);
    await supabase.from('matches').update({ reminder_sent: true }).eq('id', match.id);
    stats.reminders += rows.length;
  }

  return Response.json(stats);
});

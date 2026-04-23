/**
 * Scheduled cron: sends reminder emails to registered match participants
 * approximately 1 hour before kickoff.
 *
 * Runs every 15 minutes. Uses a 15-minute window (60–75 min before match)
 * so every upcoming match gets exactly one reminder per participant.
 *
 * Idempotency: tracks sent reminders in the EmailNotificationLog entity.
 * Each (user_id, match_id) pair is emailed at most once.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function sb(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${path} ${res.status}: ${text}`);
  }
  return res.json();
}

function formatMatchTime(startsAt) {
  try {
    return new Date(startsAt).toLocaleString('sv-SE', {
      timeZone: 'Europe/Stockholm',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return startsAt;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000); // +60 min
    const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);   // +75 min

    // Upcoming matches starting in the reminder window
    const matches = await sb(
      `matches?select=id,title,starts_at,venue_id,status` +
      `&starts_at=gte.${encodeURIComponent(windowStart.toISOString())}` +
      `&starts_at=lte.${encodeURIComponent(windowEnd.toISOString())}` +
      `&status=in.(upcoming,scheduled)`
    );

    if (!matches.length) {
      return Response.json({ success: true, matches_processed: 0, emails_sent: 0 });
    }

    let emailsSent = 0;

    for (const match of matches) {
      // Already-notified users for this match
      const alreadyLogged = await base44.asServiceRole.entities.EmailNotificationLog.filter({
        notification_type: 'match_reminder',
        match_id: match.id,
      });
      const notifiedUserIds = new Set(alreadyLogged.map((l) => l.user_id));

      // Active participants
      const participants = await sb(
        `match_participants?select=user_id,status&match_id=eq.${match.id}&status=in.(registered,confirmed)`
      );
      const pendingUserIds = participants
        .map((p) => p.user_id)
        .filter((uid) => !notifiedUserIds.has(uid));

      if (!pendingUserIds.length) continue;

      const users = await sb(
        `users?select=id,email,full_name,display_name&id=in.(${pendingUserIds.join(',')})`
      );

      // Venue name (non-fatal)
      let venueName = '';
      if (match.venue_id) {
        try {
          const venues = await sb(`venues?select=name&id=eq.${match.venue_id}`);
          venueName = venues?.[0]?.name || '';
        } catch { /* ignore */ }
      }

      const whenText = formatMatchTime(match.starts_at);

      for (const u of users) {
        if (!u.email) continue;
        const name = u.display_name || u.full_name || 'Spelare';
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'AllPlay UF',
            to: u.email,
            subject: `⏰ Din match börjar om 1 timme — ${match.title}`,
            body: `Hej ${name}!\n\nEn liten påminnelse — din match "${match.title}" startar ${whenText}${venueName ? ` på ${venueName}` : ''}.\n\nSe till att du är på plats i god tid. Lycka till! ⚽\n\n— AllPlay UF`,
          });

          await base44.asServiceRole.entities.EmailNotificationLog.create({
            notification_type: 'match_reminder',
            user_id: u.id,
            match_id: match.id,
            sent_at: new Date().toISOString(),
          });

          emailsSent += 1;
        } catch (e) {
          console.warn('SendEmail failed for', u.email, e.message);
        }
      }
    }

    return Response.json({
      success: true,
      matches_processed: matches.length,
      emails_sent: emailsSent,
    });
  } catch (error) {
    console.error('sendMatchReminders failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
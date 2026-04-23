/**
 * Scheduled cron: sends a "we miss you" email to users who have been
 * inactive for 14+ days.
 *
 * Activity signal: the most recent timestamp across a few common sources:
 *   1. Last match they participated in (match_participants.created_date, falling back to row id order)
 *   2. Their own user row (we auto-detect which timestamp column exists)
 *
 * Idempotency: tracks sent emails in EmailNotificationLog.
 * A user gets reminded at most once every 14 days.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const INACTIVITY_DAYS = 14;
const BATCH_LIMIT = 200;

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

// Probe the users table to find an available timestamp column
async function detectUserTimestampColumn() {
  const candidates = ['last_seen_at', 'last_active_at', 'last_sign_in_at', 'updated_at', 'created_at', 'inserted_at'];
  for (const col of candidates) {
    try {
      await sb(`users?select=${col}&limit=1`);
      return col;
    } catch { /* try next */ }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = Date.now();
    const cutoffMs = now - INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
    const cutoff = new Date(cutoffMs).toISOString();

    const tsCol = await detectUserTimestampColumn();

    // Fetch candidate users. If we have a timestamp column, pre-filter by it.
    // Otherwise fetch all users with emails (small apps only).
    let users;
    if (tsCol) {
      users = await sb(
        `users?select=id,email,full_name,display_name,${tsCol}` +
        `&${tsCol}=lt.${encodeURIComponent(cutoff)}` +
        `&email=not.is.null` +
        `&limit=${BATCH_LIMIT}`
      );
    } else {
      users = await sb(`users?select=id,email,full_name,display_name&email=not.is.null&limit=${BATCH_LIMIT}`);
    }

    if (!users.length) {
      return Response.json({ success: true, users_processed: 0, emails_sent: 0, ts_col: tsCol });
    }

    // Cross-check actual activity: if any match_participant row exists for them
    // within the cutoff, they are active → skip.
    const userIds = users.map((u) => u.id);
    const recentParticipants = await sb(
      `match_participants?select=user_id&user_id=in.(${userIds.join(',')})` +
      `&created_date=gte.${encodeURIComponent(cutoff)}`
    ).catch(() => []);
    const activeUserIds = new Set(recentParticipants.map((p) => p.user_id));

    // Skip users we already reminded within this cutoff window
    const recentLogs = await base44.asServiceRole.entities.EmailNotificationLog.filter({
      notification_type: 'inactivity',
    });
    const recentlyReminded = new Set(
      recentLogs
        .filter((l) => l.sent_at && new Date(l.sent_at).getTime() >= cutoffMs)
        .map((l) => l.user_id)
    );

    const targets = users.filter(
      (u) => !activeUserIds.has(u.id) && !recentlyReminded.has(u.id)
    );

    if (!targets.length) {
      return Response.json({ success: true, users_processed: users.length, emails_sent: 0, ts_col: tsCol });
    }

    let emailsSent = 0;

    for (const u of targets) {
      if (!u.email) continue;
      const name = u.display_name || u.full_name || 'Spelare';

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'AllPlay UF',
          to: u.email,
          subject: 'Vi saknar dig på plan! ⚽',
          body: `Hej ${name}!\n\nDet var ett tag sen vi såg dig senast. Under tiden har nya matcher, lag och turneringar dykt upp i ditt område.\n\nKom tillbaka och hitta en match nära dig — det tar bara några sekunder att hoppa in!\n\n⚽ Öppna AllPlay UF och se vad som händer idag.\n\nVi ses snart!\n— AllPlay UF`,
        });

        await base44.asServiceRole.entities.EmailNotificationLog.create({
          notification_type: 'inactivity',
          user_id: u.id,
          sent_at: new Date().toISOString(),
        });

        emailsSent += 1;
      } catch (e) {
        console.warn('Inactivity email failed for', u.email, e.message);
      }
    }

    return Response.json({
      success: true,
      users_processed: users.length,
      emails_sent: emailsSent,
      ts_col: tsCol,
    });
  } catch (error) {
    console.error('sendInactivityEmails failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
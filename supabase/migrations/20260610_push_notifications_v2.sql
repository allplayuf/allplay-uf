-- Push notifications v2 — notifications sent from edge functions via the
-- shared sendPushNotification helper (supabase/functions/_shared/push.ts).
--
-- 1) MATCH_STARTING_SOON gets a second reminder window (120 min) alongside
--    the existing 30-min one (matches.reminder_sent).
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS reminder_120_sent boolean NOT NULL DEFAULT false;

-- 2) MATCH_NEAR_YOU cooldown: each user gets at most one nearby-match push
--    per hour (checked/stamped by the create_match edge function).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_nearby_notified_at timestamptz;

-- 3) PLAYER_JOINED and MATCH_FULL are now sent directly from the join_match
--    edge function. The old queue-based triggers would double-notify.
DROP TRIGGER IF EXISTS trg_notify_player_joined ON public.match_players;
DROP TRIGGER IF EXISTS trg_notify_match_full ON public.matches;

-- NOTE: trg_notify_match_cancelled stays. The primary cancel path is the
-- delete_matches edge function (rows are deleted, trigger never fires), but
-- the admin REST fallback soft-cancels via status='cancelled' — the trigger
-- covers that path through notification_queue.

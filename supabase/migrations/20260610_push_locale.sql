-- Push notification localization.
--
-- Swedish is the default; a device gets English when user_devices.locale
-- starts with 'en' (set by the client from app language / phone locale).
-- The edge helper (_shared/push.ts) resolves per device. DB triggers keep
-- enqueueing Swedish title/body and now also carry English variants in
-- data.title_en / data.body_en, which process_notifications lifts out.

ALTER TABLE public.user_devices
  ADD COLUMN IF NOT EXISTS locale text;

-- ── Friend request ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE v_name TEXT;
BEGIN
  IF NEW.status != 'pending' THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, full_name, 'Någon')
    INTO v_name FROM public.profiles WHERE id = NEW.requester_id;
  PERFORM public.enqueue_notification(
    NEW.addressee_id, 'Ny vänförfrågan 👋',
    v_name || ' vill bli vän med dig',
    jsonb_build_object(
      'user_id', NEW.requester_id::text,
      'type', 'friend_request',
      'title_en', 'New friend request 👋',
      'body_en', v_name || ' wants to be your friend'
    )
  );
  RETURN NEW;
END;
$function$;

-- ── Friend request accepted ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_friend_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE v_name TEXT;
BEGIN
  IF NEW.status != 'accepted' OR OLD.status = 'accepted' THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, full_name, 'Någon')
    INTO v_name FROM public.profiles WHERE id = NEW.addressee_id;
  PERFORM public.enqueue_notification(
    NEW.requester_id, 'Vänförfrågan accepterad ✅',
    v_name || ' är nu din vän!',
    jsonb_build_object(
      'user_id', NEW.addressee_id::text,
      'title_en', 'Friend request accepted ✅',
      'body_en', v_name || ' is now your friend!'
    )
  );
  RETURN NEW;
END;
$function$;

-- ── Player left ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_player_left()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_organizer   UUID;
  v_title       TEXT;
  v_player_name TEXT;
BEGIN
  IF NEW.status != 'left' OR OLD.status = 'left' THEN RETURN NEW; END IF;
  SELECT organizer_id, title
    INTO v_organizer, v_title FROM public.matches WHERE id = NEW.match_id;
  IF v_organizer IS NULL OR v_organizer = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, full_name, 'En spelare')
    INTO v_player_name FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.enqueue_notification(
    v_organizer, 'Spelare lämnade ⚠️',
    v_player_name || ' lämnade ' || COALESCE(v_title, 'matchen'),
    jsonb_build_object(
      'match_id', NEW.match_id::text,
      'title_en', 'Player left ⚠️',
      'body_en', v_player_name || ' left ' || COALESCE(v_title, 'the match')
    )
  );
  RETURN NEW;
END;
$function$;

-- ── Team invite ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_team_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE v_team_name TEXT;
BEGIN
  IF NEW.status != 'invited' THEN RETURN NEW; END IF;
  SELECT name INTO v_team_name FROM public.teams WHERE id = NEW.team_id;
  PERFORM public.enqueue_notification(
    NEW.user_id, 'Lagsinbjudan ⚽',
    'Du är inbjuden till laget ' || COALESCE(v_team_name, 'ett lag'),
    jsonb_build_object(
      'team_id', NEW.team_id::text,
      'type', 'team_invite',
      'title_en', 'Team invite ⚽',
      'body_en', 'You have been invited to ' || COALESCE(v_team_name, 'a team')
    )
  );
  RETURN NEW;
END;
$function$;

-- ── Match cancelled (REST soft-cancel fallback path) ───────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_match_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE v_p RECORD;
BEGIN
  IF NEW.status != 'cancelled' OR OLD.status = 'cancelled' THEN RETURN NEW; END IF;
  FOR v_p IN
    SELECT user_id FROM public.match_players
    WHERE match_id = NEW.id AND status IN ('joined', 'checked_in')
      AND user_id IS DISTINCT FROM NEW.organizer_id
  LOOP
    PERFORM public.enqueue_notification(
      v_p.user_id, 'Match inställd ❌',
      COALESCE(NEW.title, 'Matchen') || ' har ställts in',
      jsonb_build_object(
        'match_id', NEW.id::text,
        'title_en', 'Match cancelled ❌',
        'body_en', COALESCE(NEW.title, 'The match') || ' has been cancelled'
      )
    );
  END LOOP;
  RETURN NEW;
END;
$function$;

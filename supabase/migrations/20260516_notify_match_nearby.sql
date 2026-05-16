-- Match-nearby push notifications
--
-- When a new public match is inserted, queue a notification for every user
-- whose `city` matches the match's venue city. The notifications get sent
-- on the next `process_notifications` invocation.
--
-- We cap fanout at 200 users per match to keep the queue sane on day one.
-- We skip the organizer (they don't need to notify themselves).
-- We only fire for public, upcoming matches that start in the future.
--
-- If you later add lat/lng + PostGIS, swap the city-equality filter for a
-- ST_DWithin radius check (25km recommended).

CREATE OR REPLACE FUNCTION public.notify_users_near_new_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_city       text;
  v_venue_name text;
  v_match_when text;
BEGIN
  -- Only notify for upcoming, public matches scheduled in the future
  IF NEW.is_public IS DISTINCT FROM true THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM 'upcoming' THEN RETURN NEW; END IF;
  IF NEW.starts_at IS NULL OR NEW.starts_at <= NOW() THEN RETURN NEW; END IF;

  -- Pull venue city + name (best-effort; null is fine — we still notify)
  SELECT v.city, v.name INTO v_city, v_venue_name
  FROM public.venues v
  WHERE v.id = NEW.venue_id;

  IF v_city IS NULL THEN RETURN NEW; END IF;

  -- Format "today/tomorrow HH:MM" for the body, Swedish locale
  v_match_when := to_char(NEW.starts_at AT TIME ZONE 'Europe/Stockholm', 'DD/MM HH24:MI');

  -- Queue one notification per matching user (capped at 200)
  INSERT INTO public.notification_queue (user_id, title, body, data)
  SELECT
    u.id,
    '⚽ Ny match nära dig',
    COALESCE(v_venue_name, 'En ny match') || ' · ' || v_match_when || ' — gå med innan platserna tar slut!',
    jsonb_build_object(
      'type', 'match_nearby',
      'match_id', NEW.id,
      'venue_id', NEW.venue_id
    )
  FROM public.users u
  WHERE u.city = v_city
    AND u.id <> NEW.organizer_id
    AND COALESCE(u.is_public, true) = true
  LIMIT 200;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block match creation if notification queueing fails
  RAISE WARNING 'notify_users_near_new_match failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_match_nearby ON public.matches;
CREATE TRIGGER trg_notify_match_nearby
AFTER INSERT ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_near_new_match();

-- Social-event push notifications: friend requests + team invites.
--
-- Both fire on INSERT and queue a row into notification_queue, which the
-- existing process_notifications function drains and sends via APNs.
--
-- All triggers use EXCEPTION WHEN OTHERS so a notification failure can
-- never block the underlying insert.

-- ── Friend requests ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_name text;
BEGIN
  -- Only on initial pending requests (not on accept/decline updates)
  IF NEW.status IS DISTINCT FROM 'pending' THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL OR NEW.friend_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.user_id = NEW.friend_id THEN RETURN NEW; END IF;

  SELECT COALESCE(u.display_name, u.full_name, 'Någon')
    INTO v_requester_name
    FROM public.users u
   WHERE u.id = NEW.user_id;

  INSERT INTO public.notification_queue (user_id, title, body, data)
  VALUES (
    NEW.friend_id,
    '👋 Ny vänförfrågan',
    v_requester_name || ' vill bli vän med dig.',
    jsonb_build_object(
      'type', 'friend_request',
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_friend_request failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_friend_request ON public.friendships;
CREATE TRIGGER trg_notify_friend_request
AFTER INSERT ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.notify_friend_request();

-- ── Team invites ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_team_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_name text;
BEGIN
  -- Only fire for invites still pending acceptance
  IF NEW.status IS DISTINCT FROM 'pending' THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL OR NEW.team_id IS NULL THEN RETURN NEW; END IF;

  SELECT t.name INTO v_team_name FROM public.teams t WHERE t.id = NEW.team_id;
  IF v_team_name IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notification_queue (user_id, title, body, data)
  VALUES (
    NEW.user_id,
    '🛡️ Inbjudan till lag',
    'Du är inbjuden till ' || v_team_name || '.',
    jsonb_build_object(
      'type', 'team_invite',
      'team_id', NEW.team_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_team_invite failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_team_invite ON public.team_members;
CREATE TRIGGER trg_notify_team_invite
AFTER INSERT ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_team_invite();

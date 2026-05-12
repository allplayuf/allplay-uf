-- Revoke EXECUTE on all SECURITY DEFINER functions from PUBLIC, anon, and authenticated.
-- Postgres grants EXECUTE to PUBLIC by default, so PUBLIC must be explicitly revoked.
-- These functions use SECURITY DEFINER and must only be callable through Edge Functions
-- or trusted server-side contexts — not directly from client-supplied JWTs.

REVOKE EXECUTE ON FUNCTION public.can_check_in(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_in_match(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_in_match_500m(p_match_id uuid, p_user_lat double precision, p_user_lng double precision)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_match(p_title text, p_notes text, p_is_spontaneous boolean, p_level text, p_max_players integer, p_is_public boolean, p_format text, p_starts_at timestamp with time zone, p_venue_id text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.enqueue_notification(p_user_id uuid, p_title text, p_body text, p_data jsonb)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_match_details(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_auth_user_updated()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.join_match(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.join_match_atomic(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.leave_match(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.leave_match_atomic(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.my_participation(p_match_id uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_my_location(p_lat double precision, p_lng double precision)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.upsert_user_device(p_expo_push_token text, p_platform device_platform)
  FROM PUBLIC, anon, authenticated;

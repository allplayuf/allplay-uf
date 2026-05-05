-- Fix: revoke public execute access on SECURITY DEFINER functions.
--
-- Category 1: trigger-only functions — must never be callable via REST.
-- These are invoked exclusively by database triggers; revoking from all roles.
REVOKE EXECUTE ON FUNCTION public.handle_auth_user_updated()  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_friend_accepted()  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_friend_request()   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_match_cancelled()  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_match_full()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_player_joined()    FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_player_left()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_team_invite()      FROM anon, authenticated;

-- Category 2: internal helper — not a public API endpoint.
REVOKE EXECUTE ON FUNCTION public.enqueue_notification(uuid, text, text, jsonb) FROM anon, authenticated;

-- Category 3: auth-required actions — revoke anon only.
-- Authenticated users still need these; SECURITY DEFINER is intentional for atomic ops.
REVOKE EXECUTE ON FUNCTION public.can_check_in(uuid)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_in_match(uuid)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_in_match_500m(uuid, double precision, double precision) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_match(text, text, boolean, text, integer, boolean, text, timestamptz, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_match_details(uuid)     FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_match(uuid)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.leave_match(uuid)           FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_participation(uuid)      FROM anon;

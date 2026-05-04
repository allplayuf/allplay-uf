-- Add rank columns to the base profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rank_tier     INT  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rank_division TEXT DEFAULT 'Brons';

-- Recreate the public.users view to expose rank columns
CREATE OR REPLACE VIEW public.users AS
  SELECT
    id,
    COALESCE(full_name, display_name) AS full_name,
    username,
    avatar_url,
    bio,
    city,
    skill_level,
    birth_year,
    COALESCE(elo_rating, 1000)      AS elo_rating,
    COALESCE(matches_played, 0)     AS matches_played,
    COALESCE(mvp_count, 0)          AS mvp_count,
    is_admin,
    display_name,
    email,
    rank_tier,
    rank_division
  FROM public.profiles p;

-- Function: compute rank from matches_played (immutable, reusable)
CREATE OR REPLACE FUNCTION public.compute_rank(p_matches INT)
RETURNS TABLE(tier INT, division TEXT)
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_tier  INT;
  v_min   INT;
  v_max   INT;
  v_third INT;
BEGIN
  IF    p_matches <= 2   THEN v_tier := 1;  v_min := 0;   v_max := 2;
  ELSIF p_matches <= 7   THEN v_tier := 2;  v_min := 3;   v_max := 7;
  ELSIF p_matches <= 14  THEN v_tier := 3;  v_min := 8;   v_max := 14;
  ELSIF p_matches <= 24  THEN v_tier := 4;  v_min := 15;  v_max := 24;
  ELSIF p_matches <= 44  THEN v_tier := 5;  v_min := 25;  v_max := 44;
  ELSIF p_matches <= 74  THEN v_tier := 6;  v_min := 45;  v_max := 74;
  ELSIF p_matches <= 119 THEN v_tier := 7;  v_min := 75;  v_max := 119;
  ELSIF p_matches <= 179 THEN v_tier := 8;  v_min := 120; v_max := 179;
  ELSIF p_matches <= 269 THEN v_tier := 9;  v_min := 180; v_max := 269;
  ELSE                        v_tier := 10; v_min := 270; v_max := NULL;
  END IF;

  IF v_max IS NULL THEN
    tier := v_tier; division := NULL; RETURN NEXT; RETURN;
  END IF;

  v_third := FLOOR((v_max - v_min + 1)::NUMERIC / 3);

  IF p_matches < v_min + v_third THEN
    division := 'Brons';
  ELSIF p_matches < v_min + v_third * 2 THEN
    division := 'Silver';
  ELSE
    division := 'Guld';
  END IF;

  tier := v_tier; RETURN NEXT;
END;
$$;

-- Trigger function on profiles
CREATE OR REPLACE FUNCTION public.sync_rank()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT * INTO r FROM public.compute_rank(COALESCE(NEW.matches_played, 0));
  NEW.rank_tier     := r.tier;
  NEW.rank_division := r.division;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_rank ON public.profiles;
CREATE TRIGGER trg_sync_rank
  BEFORE INSERT OR UPDATE OF matches_played
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_rank();

-- Back-fill existing rows
UPDATE public.profiles p
SET
  rank_tier     = r.tier,
  rank_division = r.division
FROM public.compute_rank(COALESCE(p.matches_played, 0)) r;

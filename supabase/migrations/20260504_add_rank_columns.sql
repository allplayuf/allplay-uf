-- Add rank columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS rank_tier     INT  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rank_division TEXT DEFAULT 'Brons';

-- Function: compute rank_tier and rank_division from matches_played
CREATE OR REPLACE FUNCTION public.compute_rank(p_matches INT)
RETURNS TABLE(tier INT, division TEXT)
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_tier INT;
  v_min  INT;
  v_max  INT;
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

-- Trigger function
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

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_sync_rank ON public.users;
CREATE TRIGGER trg_sync_rank
  BEFORE INSERT OR UPDATE OF matches_played
  ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_rank();

-- Back-fill existing rows
UPDATE public.users u
SET
  rank_tier     = r.tier,
  rank_division = r.division
FROM public.compute_rank(COALESCE(u.matches_played, 0)) r;

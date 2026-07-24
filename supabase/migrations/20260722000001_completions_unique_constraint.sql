-- Fix quiz submission: completions upsert requires a unique constraint on
-- (user_id, course_id) for ON CONFLICT to resolve, and an UPDATE policy so
-- the upsert's update half isn't blocked by RLS.

-- Remove duplicate rows first, keeping the most recent per user+course.
DELETE FROM public.completions a
USING public.completions b
WHERE a.user_id  = b.user_id
  AND a.course_id = b.course_id
  AND a.completed_at < b.completed_at;

-- Unique constraint — required by upsert ON CONFLICT (user_id, course_id).
ALTER TABLE public.completions
  ADD CONSTRAINT completions_user_course_unique UNIQUE (user_id, course_id);

-- UPDATE policy — required so the ON CONFLICT DO UPDATE half of upsert succeeds.
DROP POLICY IF EXISTS "completions_update_own" ON public.completions;
CREATE POLICY "completions_update_own"
  ON public.completions
  FOR UPDATE
  TO authenticated
  USING  ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

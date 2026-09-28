-- Tracks the last time each user opened a course.
-- Drives the "Continue last lesson" card on the dashboard.

CREATE TABLE IF NOT EXISTS course_views (
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id      UUID        NOT NULL REFERENCES courses(id)    ON DELETE CASCADE,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS course_views_user_time_idx
  ON course_views(user_id, last_viewed_at DESC);

ALTER TABLE course_views ENABLE ROW LEVEL SECURITY;

-- Users manage only their own rows; admins have no special access here
CREATE POLICY "users_manage_own_course_views" ON course_views
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

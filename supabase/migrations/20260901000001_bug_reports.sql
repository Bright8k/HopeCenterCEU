-- Bug reports submitted by users, visible to admins in the portal.

CREATE TABLE IF NOT EXISTS bug_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'other',
  status       TEXT        NOT NULL DEFAULT 'open',
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx   ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS bug_reports_status_idx    ON bug_reports(status);
CREATE INDEX IF NOT EXISTS bug_reports_created_at_idx ON bug_reports(created_at DESC);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can submit their own reports
CREATE POLICY "users_insert_own_bug_reports" ON bug_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users see only their own; admins see all
CREATE POLICY "read_bug_reports" ON bug_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_user_admin());

-- Only admins can update status / add notes
CREATE POLICY "admin_update_bug_reports" ON bug_reports
  FOR UPDATE TO authenticated
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

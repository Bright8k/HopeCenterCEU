-- Study resources: books, articles, and websites to help learners prepare for tests and CEU work.

CREATE TABLE IF NOT EXISTS resources (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  author         TEXT,
  type           TEXT        NOT NULL CHECK (type IN ('book', 'article', 'website')),
  description    TEXT,
  url            TEXT,
  track          TEXT        CHECK (track IN ('RBT', 'BCBA', 'STUDENT')),
  category       TEXT        CHECK (category IN ('ethics', 'supervision', 'behavior-reduction', 'measurement', 'general')),
  is_featured    BOOLEAN     NOT NULL DEFAULT false,
  published_year INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resources_type_idx     ON resources(type);
CREATE INDEX IF NOT EXISTS resources_track_idx    ON resources(track);
CREATE INDEX IF NOT EXISTS resources_featured_idx ON resources(is_featured DESC);
CREATE INDEX IF NOT EXISTS resources_created_idx  ON resources(created_at DESC);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can browse resources
CREATE POLICY "authenticated_read_resources" ON resources
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can create resources
CREATE POLICY "admin_insert_resources" ON resources
  FOR INSERT TO authenticated
  WITH CHECK (exists (select 1 from public.admin_roles where user_id = (select auth.uid())));

-- Only admins can update resources
CREATE POLICY "admin_update_resources" ON resources
  FOR UPDATE TO authenticated
  USING  (exists (select 1 from public.admin_roles where user_id = (select auth.uid())))
  WITH CHECK (exists (select 1 from public.admin_roles where user_id = (select auth.uid())));

-- Only admins can delete resources
CREATE POLICY "admin_delete_resources" ON resources
  FOR DELETE TO authenticated
  USING (exists (select 1 from public.admin_roles where user_id = (select auth.uid())));

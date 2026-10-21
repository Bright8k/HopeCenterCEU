-- Exam prep Sections A–F are RBT Task List content: move them to the RBT track and publish
-- so they appear in the course library with their slides and transcripts. Videos are added later.
-- is_published is synced from status by trg_sync_is_published.

UPDATE courses
  SET track = 'RBT', status = 'published', review_note = NULL
  WHERE id IN (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000006'
  );

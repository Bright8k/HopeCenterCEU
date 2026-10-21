-- Removes the four BCBA courses created twice on 2026-08-24 (seed run at 20:43 and again at 20:47).
-- Keeps the 20:47 copies, which hold the intact completions. The 20:43 copies only hold
-- duplicates of those completions plus orphaned rows with no user. No certificates were issued.
-- completions_course_id_fkey has no ON DELETE action, so completions are removed first;
-- questions and course_views cascade (none exist on these courses).

DELETE FROM completions
  WHERE course_id IN (
    '875d4b48-a2fd-4bf5-901a-779585dba5a0', -- Ethics in Applied Behavior Analysis
    'd76fe104-d8a6-4e6e-9731-9d3d82cd3ec5', -- Functional Behavior Assessment
    '7e2e9fc7-08c9-49c0-bd60-8f453c034d3c', -- Supervision Best Practices
    'ea11c8d1-d1fa-493c-a4d1-b32cd45f4cc9'  -- Verbal Behavior and Language Acquisition
  );

DELETE FROM courses
  WHERE id IN (
    '875d4b48-a2fd-4bf5-901a-779585dba5a0',
    'd76fe104-d8a6-4e6e-9731-9d3d82cd3ec5',
    '7e2e9fc7-08c9-49c0-bd60-8f453c034d3c',
    'ea11c8d1-d1fa-493c-a4d1-b32cd45f4cc9'
  );

-- Follow-along slide decks (PDF) for course lessons.
-- Private bucket: learners read via short-lived signed URLs; admins manage files.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS slides_path TEXT;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('course-slides', 'course-slides', false, 26214400, array['application/pdf'])
  on conflict (id) do nothing;

drop policy if exists "course_slides_read_authenticated" on storage.objects;
create policy "course_slides_read_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'course-slides');

drop policy if exists "course_slides_admin_insert" on storage.objects;
create policy "course_slides_admin_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'course-slides'
    and exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

drop policy if exists "course_slides_admin_update" on storage.objects;
create policy "course_slides_admin_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'course-slides'
    and exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

drop policy if exists "course_slides_admin_delete" on storage.objects;
create policy "course_slides_admin_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'course-slides'
    and exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- Section A exam-prep deck (uploaded to course-slides separately)
update courses
  set slides_path = '20000000-0000-0000-0000-000000000001/slides.pdf'
  where id = '20000000-0000-0000-0000-000000000001' and slides_path is null;

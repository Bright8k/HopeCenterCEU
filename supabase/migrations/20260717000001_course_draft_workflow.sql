-- Adds status-based publish workflow and course-media storage bucket.

-- 1. Status column (single source of truth for visibility)
alter table public.courses
  add column if not exists status text
    not null default 'draft'
    check (status in ('draft', 'pending_review', 'published', 'archived'));

-- 2. Review note: populated when an admin returns a submission with feedback
alter table public.courses
  add column if not exists review_note text;

-- 3. Backfill: mirror existing is_published into status
update public.courses set status = 'published' where is_published = true;
-- rows with is_published = false remain 'draft' (the column default)

-- 4. Trigger: keep is_published in sync whenever status changes
create or replace function public.sync_is_published_from_status()
returns trigger language plpgsql as $$
begin
  new.is_published := (new.status = 'published');
  return new;
end;
$$;

drop trigger if exists trg_sync_is_published on public.courses;
create trigger trg_sync_is_published
  before insert or update of status on public.courses
  for each row execute function public.sync_is_published_from_status();

-- 5. Update learner-facing RLS: only published courses are visible
drop policy if exists "courses_select_published" on public.courses;
create policy "courses_select_published"
  on public.courses
  for select
  to authenticated
  using (
    status = 'published'
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- 6. course-media bucket for thumbnail uploads
insert into storage.buckets (id, name, public)
  values ('course-media', 'course-media', true)
  on conflict (id) do nothing;

-- Admins can upload to course-media
drop policy if exists "course_media_admin_insert" on storage.objects;
create policy "course_media_admin_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'course-media'
    and exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- Admins can update objects in course-media
drop policy if exists "course_media_admin_update" on storage.objects;
create policy "course_media_admin_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'course-media'
    and exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- Admins can delete from course-media
drop policy if exists "course_media_admin_delete" on storage.objects;
create policy "course_media_admin_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'course-media'
    and exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- All authenticated users can read course-media (thumbnails displayed in course viewer)
drop policy if exists "course_media_read_authenticated" on storage.objects;
create policy "course_media_read_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'course-media');

-- BACB ACE Provider Handbook (effective 2026-07-01) support:
--  * learners' BACB certification numbers (required on CE documentation)
--  * per-course instructor, learning objectives, affiliation disclosures, publication date
--  * provider settings (provider number, coordinator) and the admin ACE to-do checklist state
--  * learner feedback on completed courses (must be offered within 14 days of the event)
--  * credit in 0.5 increments only

-- ── Learner BACB number ───────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists bacb_cert_number text
    check (bacb_cert_number is null or char_length(bacb_cert_number) between 3 and 32);

-- ── Course details shown publicly and printed on certificates ─────────────────────────────
alter table public.courses
  add column if not exists instructor_name text,
  add column if not exists instructor_credentials text,
  add column if not exists learning_objectives text,
  add column if not exists disclosures text,
  add column if not exists published_at timestamptz;

alter table public.courses
  add constraint courses_ceu_half_increments check (ceu_value >= 0 and (ceu_value * 2) = floor(ceu_value * 2));

update public.courses set published_at = created_at where status = 'published' and published_at is null;

create or replace function public.set_course_published_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists courses_set_published_at on public.courses;
create trigger courses_set_published_at
  before insert or update of status on public.courses
  for each row execute function public.set_course_published_at();

-- ── Provider settings (single row) ────────────────────────────────────────────────────────
create table if not exists public.ace_settings (
  id boolean primary key default true check (id),
  provider_name text not null default 'Hope Center for Behavior Change',
  provider_number text,
  coordinator_name text,
  coordinator_email text,
  approval_expires_on date,
  checklist jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.ace_settings (id) values (true) on conflict (id) do nothing;

alter table public.ace_settings enable row level security;

-- Learners need the provider name and coordinator contact (complaint process)
create policy ace_settings_select_authenticated on public.ace_settings
  for select to authenticated using (true);

create policy ace_settings_update_admin on public.ace_settings
  for update to authenticated
  using (exists (select 1 from public.admin_roles where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_roles where user_id = (select auth.uid())));

revoke all on public.ace_settings from anon;

-- ── Course feedback ───────────────────────────────────────────────────────────────────────
create table if not exists public.course_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comments text check (comments is null or char_length(comments) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists idx_course_feedback_course_id on public.course_feedback(course_id);

alter table public.course_feedback enable row level security;

-- Only learners who completed the course can leave feedback
create policy course_feedback_insert_own on public.course_feedback
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.completions c
      where c.user_id = (select auth.uid()) and c.course_id = course_feedback.course_id
    )
  );

create policy course_feedback_update_own on public.course_feedback
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy course_feedback_select_own_or_admin on public.course_feedback
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

revoke all on public.course_feedback from anon;

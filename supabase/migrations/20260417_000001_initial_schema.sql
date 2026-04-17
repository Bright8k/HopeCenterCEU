create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text check (role in ('RBT', 'BCBA', 'STUDENT')),
  renewal_date date,
  org_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  track text check (track in ('RBT', 'BCBA', 'STUDENT')),
  ceu_value numeric not null default 1,
  video_url text,
  thumbnail_url text,
  duration_seconds integer,
  pass_score integer not null default 80,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  score integer,
  passed boolean not null default false,
  cert_url text,
  completed_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  domain text,
  stem text not null,
  options jsonb not null,
  answer integer not null,
  explanation text,
  track text check (track in ('RBT', 'BCBA', 'STUDENT'))
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected integer,
  is_correct boolean,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_courses_track_published on public.courses(track, is_published);
create index if not exists idx_completions_user_id on public.completions(user_id);
create index if not exists idx_completions_course_id on public.completions(course_id);
create index if not exists idx_questions_course_id on public.questions(course_id);
create index if not exists idx_questions_track on public.questions(track);
create index if not exists idx_attempts_user_id on public.attempts(user_id);
create index if not exists idx_attempts_question_id on public.attempts(question_id);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.completions enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "courses_select_track" on public.courses;
create policy "courses_select_track"
on public.courses
for select
to authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and (public.courses.track is null or p.role = public.courses.track)
  )
);

drop policy if exists "completions_select_own" on public.completions;
create policy "completions_select_own"
on public.completions
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "completions_insert_own" on public.completions;
create policy "completions_insert_own"
on public.completions
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "questions_select_track" on public.questions;
create policy "questions_select_track"
on public.questions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and (public.questions.track is null or p.role = public.questions.track)
  )
);

drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own"
on public.attempts
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own"
on public.attempts
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

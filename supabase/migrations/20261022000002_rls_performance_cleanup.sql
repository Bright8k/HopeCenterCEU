-- RLS performance cleanup from the 2026-10-22 health check. Access is unchanged:
--  * legacy policies that duplicated newer ones are dropped
--  * "own row" + "admin" SELECT/UPDATE pairs are merged into one policy per action
--  * auth.uid() is wrapped in (select ...) so it is evaluated once per query, not per row
--  * course_views.course_id gets a covering index for its foreign key

-- ── attempts ──────────────────────────────────────────────────────────────────────────────
drop policy if exists "Users can view own attempts" on public.attempts;
drop policy if exists attempts_select_own on public.attempts;
drop policy if exists admins_can_select_all_attempts on public.attempts;
create policy attempts_select_own_or_admin on public.attempts
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- ── completions ───────────────────────────────────────────────────────────────────────────
drop policy if exists "Users can view own completions" on public.completions;
drop policy if exists completions_select_own on public.completions;
drop policy if exists admins_can_select_all_completions on public.completions;
create policy completions_select_own_or_admin on public.completions
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- ── profiles ──────────────────────────────────────────────────────────────────────────────
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists admins_can_select_all_profiles on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists admins_can_update_all_profiles on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  )
  with check (
    id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- ── courses: courses_select_published already covers published rows and admins ─────────
drop policy if exists courses_select_track on public.courses;
drop policy if exists admins_can_select_all_courses on public.courses;

-- ── questions ─────────────────────────────────────────────────────────────────────────────
drop policy if exists questions_select_track on public.questions;
drop policy if exists admins_can_select_all_questions on public.questions;
create policy questions_select_track_or_admin on public.questions
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (questions.track is null or p.role = questions.track)
    )
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- ── streaks: everyone signed in can read (leaderboard); only the owner writes ────────────
drop policy if exists "Users manage own streak" on public.streaks;
create policy streaks_insert_own on public.streaks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy streaks_update_own on public.streaks
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy streaks_delete_own on public.streaks
  for delete to authenticated using (user_id = (select auth.uid()));

-- ── push_tokens, course_views, bug_reports: evaluate auth.uid() once ────────────────────
drop policy if exists "Users manage own push tokens" on public.push_tokens;
create policy push_tokens_manage_own on public.push_tokens
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists users_manage_own_course_views on public.course_views;
create policy course_views_manage_own on public.course_views
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists users_insert_own_bug_reports on public.bug_reports;
create policy bug_reports_insert_own on public.bug_reports
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists read_bug_reports on public.bug_reports;
create policy bug_reports_select_own_or_admin on public.bug_reports
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

-- ── Missing foreign-key index ─────────────────────────────────────────────────────────────
create index if not exists idx_course_views_course_id on public.course_views(course_id);

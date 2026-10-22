-- Security hardening from the 2026-10-22 health check.
--  1. Quiz answer keys were readable by anyone (legacy "Anyone can view questions" policy).
--  2. get_user_ceu_summary returned any user's CEU totals without an auth check, even to anon.
--  3. Published courses were readable without signing in.
--  4. Learners wrote their own completions/attempts, so CEUs and certificates could be self-awarded.
--     Quizzes are now graded by the submit-quiz Edge Function; practice by submit_practice().
--  5. Misc advisor findings: callable internal functions, mutable search_path, duplicate index.

-- ── 1 & 3. Drop legacy permissive policies (track/status-scoped policies remain) ──────────
drop policy if exists "Anyone can view questions" on public.questions;
drop policy if exists "Anyone can view published courses" on public.courses;

-- Answers and explanations never reach clients. Admins read them via admin_get_questions().
revoke select on public.questions from anon, authenticated;
grant select (id, course_id, domain, stem, options, track) on public.questions to authenticated;

-- ── 4. Completions and attempts are written server-side only ───────────────────────────────
drop policy if exists "Users can insert own completions" on public.completions;
drop policy if exists completions_insert_own on public.completions;
drop policy if exists completions_update_own on public.completions;
drop policy if exists "Users can insert own attempts" on public.attempts;
drop policy if exists attempts_insert_own on public.attempts;

-- Grades a STUDENT exam-practice set, records attempts, and only then reveals answers.
-- Restricted to STUDENT-track questions so it can't be used to read CEU quiz answer keys.
create or replace function public.submit_practice(p_answers jsonb)
returns table (question_id uuid, selected integer, is_correct boolean, answer integer, explanation text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from profiles where id = v_uid and role = 'STUDENT') then
    raise exception 'Exam practice is available to student accounts only' using errcode = '42501';
  end if;
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'p_answers must be an object of question_id -> option index' using errcode = '22023';
  end if;

  return query
  with submitted as (
    select (kv.key)::uuid as qid, (kv.value #>> '{}')::integer as sel
    from jsonb_each(p_answers) kv
  ),
  graded as (
    select q.id, s.sel, (s.sel = q.answer) as correct, q.answer, q.explanation
    from submitted s
    join questions q on q.id = s.qid
    where q.track = 'STUDENT'
  ),
  _recorded as (  -- data-modifying CTEs always run, even when unreferenced
    insert into attempts (user_id, question_id, selected, is_correct)
    select v_uid, g.id, g.sel, g.correct from graded g
  )
  select g.id, g.sel, g.correct, g.answer, g.explanation
  from graded g;
end;
$$;

revoke execute on function public.submit_practice(jsonb) from public, anon;
grant execute on function public.submit_practice(jsonb) to authenticated;

-- Full question rows (including answers) for the admin question bank and editor.
create or replace function public.admin_get_questions(p_course_id uuid default null, p_question_id uuid default null)
returns setof public.questions
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admin_roles where user_id = auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return query
  select * from questions q
  where (p_course_id is null or q.course_id = p_course_id)
    and (p_question_id is null or q.id = p_question_id)
  order by q.domain nulls last, q.id;
end;
$$;

revoke execute on function public.admin_get_questions(uuid, uuid) from public, anon;
grant execute on function public.admin_get_questions(uuid, uuid) to authenticated;

-- ── 2. CEU summary: only your own totals (or any user's, for admins) ───────────────────────
create or replace function public.get_user_ceu_summary(p_user_id uuid)
returns table (category text, ceu_total numeric, completions_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(c.category, 'general')::text as category,
    coalesce(sum(c.ceu_value), 0)          as ceu_total,
    count(*)                               as completions_count
  from public.completions co
  join public.courses c on c.id = co.course_id
  where co.user_id = p_user_id
    and co.passed  = true
    and (
      p_user_id = auth.uid()
      or exists (select 1 from public.admin_roles where user_id = auth.uid())
    )
  group by coalesce(c.category, 'general');
$$;

-- ── 5. Function exposure, search_path, duplicate index ────────────────────────────────────
revoke execute on function public.get_user_ceu_summary(uuid) from public, anon;
revoke execute on function public.get_leaderboard(text, date) from public, anon;
revoke execute on function public.is_user_admin(uuid) from public, anon;
grant execute on function public.get_user_ceu_summary(uuid) to authenticated;
grant execute on function public.get_leaderboard(text, date) to authenticated;
grant execute on function public.is_user_admin(uuid) to authenticated;

-- Trigger / event-trigger functions: never meant to be called over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

alter function public.sync_is_published_from_status() set search_path = public;
alter function public.update_bug_reports_updated_at() set search_path = public;

-- Identical to completions_user_course_unique, which the submit-quiz upsert targets.
alter table public.completions drop constraint if exists completions_user_id_course_id_key;

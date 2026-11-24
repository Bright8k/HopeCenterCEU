-- Learners keep seeing the title and credit of courses they completed after a course is moved
-- back to draft or archived (completion history, CEU totals, certificates). The course library
-- still only lists published courses because the app filters on is_published.
drop policy if exists courses_select_published on public.courses;
create policy courses_select_published on public.courses
  for select to authenticated
  using (
    status = 'published'
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
    or exists (
      select 1 from public.completions c
      where c.course_id = courses.id and c.user_id = (select auth.uid())
    )
  );

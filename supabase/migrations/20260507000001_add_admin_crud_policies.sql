-- Admins can view all courses including unpublished drafts
create policy "admins_can_select_all_courses"
on public.courses for select
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can create new courses
create policy "admins_can_insert_courses"
on public.courses for insert
to authenticated
with check (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can update course metadata
create policy "admins_can_update_courses"
on public.courses for update
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can view all questions regardless of track
create policy "admins_can_select_all_questions"
on public.questions for select
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can add questions to courses
create policy "admins_can_insert_questions"
on public.questions for insert
to authenticated
with check (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can update question content
create policy "admins_can_update_questions"
on public.questions for update
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can delete questions
create policy "admins_can_delete_questions"
on public.questions for delete
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

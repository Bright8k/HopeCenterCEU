-- Admins can read all profiles (needed for analytics and user management)
create policy "admins_can_select_all_profiles"
on public.profiles for select
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can update any profile (needed for role assignment via client path)
create policy "admins_can_update_all_profiles"
on public.profiles for update
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can read all completions (needed for analytics)
create policy "admins_can_select_all_completions"
on public.completions for select
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

-- Admins can read all attempts (needed for analytics and question-level drill-down)
create policy "admins_can_select_all_attempts"
on public.attempts for select
to authenticated
using (
  exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
);

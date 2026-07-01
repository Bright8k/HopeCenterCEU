-- Security-definer RPC that lets an admin check if any other user has admin status.
-- Direct SELECT on admin_roles is blocked by RLS for cross-user queries, so this
-- function runs with owner privileges to bypass that restriction.
-- Non-admins always receive false regardless of the target user.

create or replace function public.is_user_admin(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      -- Caller must themselves be an admin; otherwise always return false.
      when not exists (
        select 1 from public.admin_roles where user_id = auth.uid()
      ) then false
      else exists (
        select 1 from public.admin_roles where user_id = target_user_id
      )
    end
$$;

grant execute on function public.is_user_admin(uuid) to authenticated;

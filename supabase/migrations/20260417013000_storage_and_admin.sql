create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'publisher')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_admin_roles_user_id on public.admin_roles(user_id);

alter table public.admin_roles enable row level security;

drop policy if exists "admin_roles_select_own" on public.admin_roles;
create policy "admin_roles_select_own"
on public.admin_roles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

drop policy if exists "certificate_objects_select_own" on storage.objects;
create policy "certificate_objects_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'certificates'
  and (select auth.uid()) is not null
  and split_part(name, '/', 1) = (select auth.uid())::text
);

drop policy if exists "certificate_objects_insert_service_only" on storage.objects;
drop policy if exists "certificate_objects_update_service_only" on storage.objects;
drop policy if exists "certificate_objects_delete_service_only" on storage.objects;

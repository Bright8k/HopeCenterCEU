alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Users can read any avatar (public bucket, but policy belt-and-suspenders)
drop policy if exists "avatar_objects_select_any" on storage.objects;
create policy "avatar_objects_select_any"
on storage.objects
for select
to authenticated
using (bucket_id = 'avatars');

-- Users can only upload/update their own avatar (path must start with their uid)
drop policy if exists "avatar_objects_insert_own" on storage.objects;
create policy "avatar_objects_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (select auth.uid()) is not null
  and split_part(name, '/', 1) = (select auth.uid())::text
);

drop policy if exists "avatar_objects_update_own" on storage.objects;
create policy "avatar_objects_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

drop policy if exists "avatar_objects_delete_own" on storage.objects;
create policy "avatar_objects_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

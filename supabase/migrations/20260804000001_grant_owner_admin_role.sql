-- Grant the platform owner full admin access.
-- Looks up user_id from auth.users by email to avoid hardcoding a UUID.
insert into public.admin_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'dalbright343@gmail.com'
on conflict (user_id, role) do nothing;

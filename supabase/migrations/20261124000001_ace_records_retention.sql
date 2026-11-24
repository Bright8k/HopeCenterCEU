-- BACB ACE records must be kept for 3 years (attendance/quiz records, certificates, feedback).
--  * Deleting a learner no longer deletes their completions, attempts, or feedback: the rows are
--    kept with user_id set to null, and completions keep a snapshot of the name and BACB number.
--  * Every certificate issued is logged with a snapshot of what was printed and its own PDF copy.
--  * Private bucket for admin record exports (written by the export-ace-records function).
--  * Course cleanup: BCBA courses with no quiz can't be completed, so they go back to draft;
--    Foundations runs 30 minutes, which supports 0.5 credit, not 1.

-- ── Keep learning records when a learner is deleted ─────────────────────────────────────
alter table public.completions
  add column if not exists participant_name text,
  add column if not exists participant_bacb text;

alter table public.completions alter column user_id drop not null;
alter table public.attempts alter column user_id drop not null;
alter table public.course_feedback alter column user_id drop not null;

alter table public.completions drop constraint if exists completions_user_id_fkey;
alter table public.completions add constraint completions_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.attempts drop constraint if exists attempts_user_id_fkey;
alter table public.attempts add constraint attempts_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.course_feedback drop constraint if exists course_feedback_user_id_fkey;
alter table public.course_feedback add constraint course_feedback_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

create or replace function public.snapshot_learner_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update completions
     set participant_name = coalesce(participant_name, old.display_name),
         participant_bacb = coalesce(participant_bacb, old.bacb_cert_number)
   where user_id = old.id;
  return old;
end;
$$;

revoke execute on function public.snapshot_learner_before_delete() from public, anon, authenticated;

drop trigger if exists profiles_snapshot_before_delete on public.profiles;
create trigger profiles_snapshot_before_delete
  before delete on public.profiles
  for each row execute function public.snapshot_learner_before_delete();

-- ── Certificate issuance log ──────────────────────────────────────────────────────────────
create table if not exists public.certificate_issuances (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null references public.completions(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null,
  course_id uuid not null references public.courses(id) on delete restrict,
  storage_path text not null,
  snapshot jsonb not null,
  issued_at timestamptz not null default now()
);

create index if not exists idx_certificate_issuances_completion on public.certificate_issuances(completion_id, issued_at desc);
create index if not exists idx_certificate_issuances_user on public.certificate_issuances(user_id);
create index if not exists idx_certificate_issuances_course on public.certificate_issuances(course_id);

alter table public.certificate_issuances enable row level security;

-- Written only by the issue-certificate Edge Function (service role)
create policy certificate_issuances_select_own_or_admin on public.certificate_issuances
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.admin_roles where user_id = (select auth.uid()))
  );

revoke all on public.certificate_issuances from anon;

-- ── Private bucket for record exports ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ace-exports', 'ace-exports', false, 10485760, array['text/csv'])
on conflict (id) do nothing;

-- ── Course cleanup ────────────────────────────────────────────────────────────────────────
update public.courses c
   set status = 'draft',
       review_note = 'Moved to draft: add quiz questions (3 per credit), an instructor, learning objectives, and a duration before it can award CEUs.'
 where c.track = 'BCBA'
   and c.status = 'published'
   and c.ceu_value > 0
   and not exists (select 1 from public.questions q where q.course_id = c.id)
   and not exists (select 1 from public.completions x where x.course_id = c.id);

update public.courses
   set ceu_value = 0.5
 where id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   and duration_seconds = 1800
   and ceu_value = 1;

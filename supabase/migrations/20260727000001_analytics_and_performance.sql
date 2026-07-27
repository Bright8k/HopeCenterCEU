-- Composite index for the most common CEU query: passed completions per user
-- Used by leaderboard, renewal tracker, and profile completion counts
create index if not exists idx_completions_user_passed
  on public.completions (user_id, passed);

-- Time-based index for leaderboard period filters (year/month)
create index if not exists idx_completions_completed_at
  on public.completions (completed_at desc);

-- Admin course management views filter by status
create index if not exists idx_courses_status
  on public.courses (status);

-- CEU breakdown by category for the renewal tracker
-- Returns totals per category (ethics / supervision / general) for a given user,
-- filtering only passed completions.
create or replace function public.get_user_ceu_summary(p_user_id uuid)
returns table (
  category  text,
  ceu_total numeric,
  completions_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    coalesce(c.category, 'general')::text as category,
    coalesce(sum(c.ceu_value), 0)          as ceu_total,
    count(*)                               as completions_count
  from public.completions co
  join public.courses c on c.id = co.course_id
  where co.user_id  = p_user_id
    and co.passed   = true
  group by coalesce(c.category, 'general');
$$;

grant execute on function public.get_user_ceu_summary(uuid) to authenticated;

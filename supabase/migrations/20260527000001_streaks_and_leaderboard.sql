-- ── Streaks ──────────────────────────────────────────────────────────────────
create table public.streaks (
  user_id         uuid    primary key references auth.users on delete cascade,
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_activity_date date,
  updated_at      timestamptz not null default now()
);

alter table public.streaks enable row level security;

-- All authenticated users can read the full streaks table (leaderboard needs it)
create policy "Authenticated users can read all streaks"
  on public.streaks for select
  to authenticated
  using (true);

-- Users can only insert / update their own row
create policy "Users manage own streak"
  on public.streaks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Leaderboard RPC ───────────────────────────────────────────────────────────
-- Returns up to 50 users ranked by total CEUs earned.
-- p_role:  null = all roles | 'RBT' | 'BCBA'
-- p_since: null = all time  | ISO date string (YYYY-MM-DD)
create or replace function public.get_leaderboard(
  p_role  text  default null,
  p_since date  default null
)
returns table(
  user_id            uuid,
  display_name       text,
  role               text,
  total_ceus         float,
  completions_count  int,
  current_streak     int,
  longest_streak     int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id                                            as user_id,
    coalesce(p.display_name, 'Learner')::text       as display_name,
    p.role::text                                    as role,
    coalesce(sum(co.ceu_value)::float, 0)           as total_ceus,
    count(c.id)::int                                as completions_count,
    coalesce(s.current_streak, 0)                   as current_streak,
    coalesce(s.longest_streak, 0)                   as longest_streak
  from profiles p
  left join completions c
    on  c.user_id   = p.id
    and c.passed    = true
    and (p_since is null or c.completed_at::date >= p_since)
  left join courses co on co.id = c.course_id
  left join streaks  s on s.user_id = p.id
  where p.role is not null
    and (p_role is null or p.role = p_role)
  group by p.id, p.display_name, p.role, s.current_streak, s.longest_streak
  order by total_ceus desc nulls last
  limit 50;
end;
$$;

grant execute on function public.get_leaderboard(text, date) to authenticated;

-- BCBA CEU categories: ethics, supervision, general
-- Used to track BACB sub-requirements within the renewal cycle.
alter table public.courses
  add column if not exists category text
  check (category in ('ethics', 'supervision', 'general'));

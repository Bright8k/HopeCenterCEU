# Backend Security Baseline

The app uses Supabase as its backend. Security is enforced in Postgres (Row Level Security, column privileges, `SECURITY DEFINER` functions) and in Edge Functions — never in the mobile client. The schema and every policy live in [`supabase/migrations/`](../supabase/migrations); the most recent full review is `20261022000001_security_hardening.sql` and `20261022000002_rls_performance_cleanup.sql`.

## Keys

- The app only ever holds the publishable key (`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- The `service_role` key exists only as an Edge Function secret. Never put it in Expo config, app code, EAS public env vars, or client bundles.
- `EXPO_PUBLIC_DEV_AUTH_BYPASS` is local-only; `app.config.ts` refuses to build production with it enabled.

## Data access (signed-out visitors can read nothing)

| Table | Learners (authenticated) | Admins (`admin_roles`) |
|---|---|---|
| `profiles` | read/update own row | read/update all |
| `courses` | read published courses | read/write all |
| `questions` | read questions on their track (or with no track) **without** `answer`/`explanation` (column privileges) | full rows via `admin_get_questions()` RPC; insert/update/delete |
| `completions` | read own — **no writes** | read all |
| `attempts` | read own — **no writes** | read all |
| `streaks` | read all (leaderboard), write own | — |
| `course_views`, `push_tokens` | manage own | — |
| `bug_reports` | create, read own | read/update all |
| `resources` | read | write |
| Storage `certificates` | read own folder via signed URL | — |
| Storage `course-slides` | read via signed URL | upload/remove |

## Privileged operations

| Operation | Where | Notes |
|---|---|---|
| Grade a course quiz, record completion + attempts | `submit-quiz` Edge Function | Keeps the learner's best result; checks course is published and on the learner's track |
| Grade exam practice | `submit_practice()` RPC | STUDENT accounts and STUDENT-track questions only; answers returned after submission |
| Issue certificate PDF | `issue-certificate` Edge Function | Only for the caller's own passed completion; short-lived signed URL |
| Publish / review / delete courses | `publish-course`, `review-course`, `delete-course` | Admin only |
| Invite, role changes, delete users, password reset | `invite-user`, `set-user-role`, `toggle-admin`, `delete-user`, `send-password-reset` | Admin only |

RPCs callable by signed-in users each check the caller internally: `get_user_ceu_summary` (own totals, or any for admins), `is_user_admin` (only answers for admins), `get_leaderboard`, `admin_get_questions` (admins only), `submit_practice`.

## Rules for new work

- Every new table gets RLS with explicit policies, written as a new migration. Wrap `auth.uid()` as `(select auth.uid())` and use one permissive policy per role/action.
- Anything that awards credit, money, or elevated access goes through an Edge Function or a checked `SECURITY DEFINER` function — never a client write.
- `SECURITY DEFINER` functions set `search_path = public` and revoke `EXECUTE` from `anon` unless they are meant to be public.
- Run `supabase db advisors --linked` after schema changes; it should report no security or performance warnings beyond the expected "authenticated can execute" notices.

## Project settings (Supabase dashboard)

- Email confirmation required for sign-up; password minimum length ≥ 8.
- **Leaked password protection** (Authentication → Passwords) — currently off; turn it on.
- Redirect URLs exact and environment-specific.

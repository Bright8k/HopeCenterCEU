# Backend Security Baseline

This app uses Supabase as its backend. The goal is to keep the security model simple early, enforce it in SQL, and avoid putting privileged logic into the mobile client.

## Current baseline

- Use the Supabase publishable key only in the app.
- Never put the `service_role` key in Expo config, app code, EAS public env vars, or client bundles.
- Keep all app-facing tables in `public` protected by Row Level Security.
- Version the database schema and policies in [`supabase/migrations/20260417_000001_initial_schema.sql`](../supabase/migrations/20260417_000001_initial_schema.sql).
- Version storage and admin-role hardening in [`supabase/migrations/20260417_000002_storage_and_admin.sql`](../supabase/migrations/20260417_000002_storage_and_admin.sql).
- Treat the current `EXPO_PUBLIC_DEV_AUTH_BYPASS` flag as local-only convenience. It must remain `false` in preview and production.

## Project settings to turn on in Supabase

- Require email confirmation for email/password signup.
- Set password minimum length to at least 8 and enable stronger password rules.
- Turn on leaked password protection if your plan supports it.
- Review session duration and inactivity timeout settings based on your compliance needs.
- Keep redirect URLs exact and environment-specific.

## Data access rules

- `profiles`: users can only read/write their own row.
- `courses`: authenticated users can only read published courses matching their track.
- `questions`: authenticated users can only read question sets matching their track.
- `completions` and `attempts`: users can only read/insert their own records.
- `storage.objects` in the `certificates` bucket: users can only read files inside their own folder prefix.
- `admin_roles`: authenticated users can only read their own admin role entries.

## Development rules

- Any future admin workflows should use Edge Functions or a secure server environment, not the mobile client.
- RevenueCat webhooks, certificate generation, and any privileged writes should run server-side only.
- Storage buckets for certificates should default to private access unless there is a strong reason not to.
- Any moderation, publishing, or cross-user reporting should be implemented outside the public client with a service key stored only in server secrets.
- Edge Functions for these workflows are scaffolded under [`supabase/functions`](../supabase/functions).

## Immediate next backend tasks

1. Apply the migration in Supabase and verify all RLS policies are present.
2. Turn `EXPO_PUBLIC_DEV_AUTH_BYPASS=false` before any shared testing build.
3. Deploy the certificate and course-publishing Edge Functions with project secrets configured.
4. Add server-side PDF generation for certificates, then store paths in `completions.cert_url`.
5. Move payment and webhook logic into Edge Functions before enabling subscriptions in-app.

# Edge Function Plan

These functions are scaffolds intended to keep privileged actions off the mobile client from the start.

## Functions added

- `publish-course`
  - Requires an authenticated user with a row in `admin_roles`.
  - Uses the service role key only inside the function runtime.
  - Intended for publisher/editor tooling, not the public app client.

- `issue-certificate`
  - Requires the caller to own the completion row.
  - Returns a short-lived signed URL for files in the private `certificates` bucket.
  - Assumes certificate generation/upload happens server-side before the URL is requested.

## Required project secrets

Set these in Supabase before deploying functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` or `SB_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local development

- The Expo app TypeScript config excludes `supabase/functions`.
- Deno-specific function imports are configured in [`supabase/functions/deno.json`](../supabase/functions/deno.json).
- Serve functions locally with the Supabase CLI rather than the Expo toolchain.

## Deployment notes

- Keep `verify_jwt` logic explicit in function code.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` anywhere in Expo config or client code.
- Prefer short-lived signed URLs for private files.
- Keep certificate paths scoped by user id, for example:
  - `<user-id>/<completion-id>.pdf`

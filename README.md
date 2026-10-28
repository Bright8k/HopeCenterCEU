# Hope Center CEU

A mobile-first continuing education platform for behavior professionals at Hope Center for Behavior Change. Learners complete accredited courses, track CEU progress toward their renewal cycle, earn PDF certificates, and access study resources — all in a WCAG 2.2 AA accessible app that runs on iOS, Android, and the web.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 58](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/) |
| Backend | [Supabase](https://supabase.com/) (Postgres + RLS + Edge Functions + Storage) |
| Styling | [NativeWind v4](https://www.nativewind.dev/) (Tailwind utility classes) |
| Language | TypeScript 6 (strict mode) |
| Auth | Supabase Auth with `expo-secure-store` |
| Offline | `expo-sqlite` for cached course playback |
| Certificates | PDF generation via `pdf-lib` in a Supabase Edge Function |
| Payments | RevenueCat webhooks (server-side only) |
| CI | GitHub Actions (type-check + Jest on every PR) |

---

## Features

- **Course library** — video lessons with per-role track filtering (RBT / BCBA / Student)
- **Quizzes** — required or optional; configurable pass score; attempt history
- **CEU renewal tracker** — pace visualization against the user's renewal deadline
- **PDF certificates** — branded, generated server-side and delivered via signed URL
- **Study resources** — curated books, articles, and websites per track
- **Smart alerts** — renewal deadline warnings and new-course notifications
- **Admin dashboard** — course publishing workflow, analytics, bug report triage, user management
- **Offline mode** — download courses for playback without a network connection
- **Push notifications** — opt-in via `expo-notifications`

---

## Project Structure

```
app/                 Expo Router file-based routes
components/          Shared UI components
context/             React Context providers (Auth, Preferences)
hooks/               Custom React hooks
lib/                 Supabase client, pure utility functions, offline storage
types/               TypeScript interfaces and generated DB types
constants/           Design tokens, role configs
supabase/
  migrations/        SQL migration files (never edited after creation)
  functions/         Deno Edge Functions
__tests__/           Jest unit & hook tests
```

---

## Getting Started

### Prerequisites

- Node 22.13+ (required by Expo SDK 58 / React Native 0.88)
- [Expo CLI](https://docs.expo.dev/more/expo-cli/) (`npm install -g expo`)
- A Supabase project (free tier works)

### 1 — Clone & install

```bash
git clone https://github.com/Bright8k/HopeCenterCEU.git
cd HopeCenterCEU
npm install --legacy-peer-deps
```

### 2 — Environment variables

Create `.env` at the project root (never commit this file):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Reference these in `app.config.ts` under `extra`:

```ts
extra: {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
},
```

### 3 — Database

Apply migrations against your Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 4 — Edge Functions

```bash
supabase functions deploy issue-certificate
```

### 5 — Run

```bash
# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android

# Web
npx expo start --web
```

---

## Testing

```bash
npm test               # run all tests
npm run test:coverage  # with coverage report
npm run typecheck      # TypeScript only
```

Tests live in `__tests__/` and cover pure utility functions (`lib/`) and stateful hooks (`hooks/`).

---

## Deployment

Production builds use [EAS Build](https://docs.expo.dev/build/introduction/). All secrets are stored as EAS secrets — never in `app.config.ts`.

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

Run `npx expo-doctor` before submitting a release and fix any flagged issues.

---

## Architecture Notes

- **RLS everywhere** — every Supabase table has Row Level Security enabled. Policies are in the migration files.
- **Edge Functions for privilege** — certificate generation, role assignment, and RevenueCat webhook processing all run server-side in Deno Edge Functions. The mobile client never holds the `service_role` key.
- **Type-safe queries** — the client is initialized as `createClient<Database>(...)`. Join queries use `.returns<T>()` to avoid `any` casts while maintaining full IntelliSense.
- **Offline-first downloads** — `expo-sqlite` caches course content locally. Sync is last-write-wins.
- **Theme tokens** — colors, font scales, and spacing are defined as design tokens in `tailwind.config.js` and accessed through the `usePreferences()` hook.

---

## License

Private — Hope Center for Behavior Change. All rights reserved.

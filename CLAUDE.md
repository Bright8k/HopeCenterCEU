# Hope Center CEU — Claude Code Rules

## Project Overview

A mobile-first (iOS/Android/Web) CEU (Continuing Education Unit) platform for behavior professionals at Hope Center for Behavior Change. Built with Expo + Expo Router, Supabase, NativeWind, and TypeScript. Users complete accredited courses, track progress, and earn certificates — all within a WCAG-compliant, accessible UI.

---

## Mandatory Pre-Completion Checklist

Before marking **any** task complete, run both commands and confirm they pass:

```powershell
npx expo export --platform all --output-dir "$env:TEMP\hcceu-export" *>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
npx tsc --noEmit
```

- If either command produces errors, fix them before reporting the task as done. (Asset filenames like `expo-router/assets/error.png` match the pattern — ignore those.)
- `--no-bundle-compress` is not supported by this Expo CLI version; don't add it back.
- Never skip the typecheck. TypeScript errors introduced silently break other contributors' workflows.
- A passing typecheck does not mean the feature is correct — also manually verify the golden path if a UI change was made.

---

## Structure Rules

- **Do not restructure the project.** The existing folder layout is intentional:
  - `app/` — Expo Router file-based routes only. Do not add non-route files here.
  - `components/` — Shared, reusable UI components, grouped by feature: `ui/` (generic primitives: Button, Card, Input, Badge, Skeleton, ProgressBar, ErrorBoundary…), `admin/`, `course/`, `onboarding/`, `profile/`. Check `components/ui/` before building a new primitive.
  - `context/` — React Context providers only.
  - `hooks/` — Custom React hooks only.
  - `lib/` — Utility functions and Supabase client.
  - `types/` — TypeScript interfaces and type aliases.
  - `constants/` — App-wide constants (colors, config values).
  - `supabase/` — Migrations and Edge Functions. Never import from here in app code.
  - `assets/` — Static media. Do not generate programmatic assets here.
  - `__tests__/` — Jest tests (`lib/` utilities and hooks), with a Supabase mock in `__tests__/__helpers__/mockSupabase.ts`.
  - `docs/` — Backend security and Edge Function notes.
  - `scripts/` — Playwright visual-test script and its screenshots.
- Adding a new top-level directory requires explicit user approval.
- Routing changes (adding/removing routes) require explicit user approval.

---

## TypeScript

- Strict mode is on (`"strict": true` in tsconfig). Never suppress errors with `// @ts-ignore` or `any` unless absolutely unavoidable, and always leave a comment explaining why.
- Use the `@/*` path alias for all internal imports (e.g. `import { supabase } from '@/lib/supabase'`).
- Prefer `interface` for object shapes, `type` for unions and mapped types.
- All component props must be typed. No implicit `any` props.
- All Supabase query results must be typed against the generated database types in `types/`.

---

## React & Expo (2026 Best Practices)

- Target Expo SDK 58 conventions (React Native 0.88, React 19.3, TypeScript 6). Use Expo Router file-based routing. Install with `--legacy-peer-deps`, and add/upgrade packages with `npx expo install <pkg> -- --legacy-peer-deps` so versions stay SDK-aligned.
- Use React 19 patterns: `use()`, server components where Expo Router supports them, automatic batching. Avoid legacy lifecycle methods.
- Prefer functional components and hooks exclusively.
- Data fetching lives in custom hooks in `hooks/` (one per resource, e.g. `useCourse`, `useCourses`). The established pattern is `useEffect` + `useState` with an `active` flag to ignore stale results, returning `{ data, loading, error/errorMessage, refetch }`. SWR / React Query are **not** installed — follow the existing pattern unless the user approves adding one.
- Hooks check `hasSupabaseEnv` (from `@/lib/supabase`) and fall back to preview fixtures in `constants/previewContent.ts` so the app runs without a backend.
- Extract logic into custom hooks in `hooks/`. Components should render, not compute.
- Aim to keep new component files under 200 lines. Several existing screens exceed this (some ~500 lines); when adding to a large screen, put new UI in a subcomponent under `components/<feature>/` rather than growing the screen further. Don't refactor existing screens unless asked.
- Use `expo-router`'s `Link` and `router` for all navigation. Never use `react-navigation` APIs directly.
- Use `expo-secure-store` for any sensitive data. Never store credentials or tokens in `AsyncStorage`.
- Prefer `expo-*` modules over bare React Native equivalents for cross-platform compatibility.
- Code-split heavy screens using `React.lazy` + `Suspense` or Expo Router's lazy loading to keep TTI low.

---

## Styling

- NativeWind is installed and configured, but **no screens currently use `className`**. The established pattern is `StyleSheet.create` inside a `createStyles(colors, textScale)` factory at the bottom of each file:
  ```ts
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  // ...
  const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
    StyleSheet.create({ title: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text } });
  ```
  Follow this pattern for consistency. Ask before introducing NativeWind `className` styling.
- Colors always come from `usePreferences().colors` (light/dark/high-contrast aware, defined in `constants/theme.ts` as `LightColors`/`DarkColors`). Never hardcode hex values in components; use `withAlpha(color, 'AA')` for transparency.
- Multiply font sizes by `textScale` (the user's "larger text" preference) to support font scaling.
- Spacing, radius, and shadow tokens: `Spacing`, `Radius`, `Shadow` in `constants/theme.ts`. Use `getWebTransitionStyle()` for web hover transitions.
- Fonts: use `Typography` from `constants/theme.ts` — Cormorant Garamond (`Typography.heading*`) for hero headings/brand moments only, Nunito (`Typography.body*`) for all UI text. Fonts are loaded in `app/_layout.tsx`. Never hardcode font family strings. (Source Sans 3 is installed but not loaded or used.)
- Icons: `Ionicons` from `@expo/vector-icons`; mark decorative icons `accessibilityElementsHidden`.

---

## Supabase (2026 Best Practices)

- **Never** use the `service_role` key in client-side or mobile code. It belongs only in Edge Functions.
- **Always** use the `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/publishable) on the client.
- All database access must go through Row Level Security (RLS). Every new table must have RLS enabled with explicit policies before shipping.
- Privileged operations (issuing certificates, publishing courses, admin actions) must live in Supabase Edge Functions — not in the mobile client.
- Every schema change must be written as a new file in `supabase/migrations/` following the existing naming convention. Never edit past migrations.
- Use Supabase Realtime for live data (progress tracking, notifications) rather than polling. Give each channel a unique name (existing hooks append a random suffix) to avoid channel collisions.
- The client is `supabase` from `@/lib/supabase` (typed `createClient<Database>`; encrypted SecureStore session storage on native, localStorage on web). When a schema change adds/changes columns, update `types/database.ts` (Row/Insert/Update) and the fixtures in `constants/previewContent.ts` by hand.
- Edge Functions share helpers in `supabase/functions/_shared/auth.ts` (`requireUser`, `requireAdmin`, `createServiceClient`, CORS). Call them from the client with `supabase.functions.invoke('<name>', { body })`.
- Admin status is the `admin_roles` table (checked via `useAdminRole`), separate from the learner `profiles.role` (`RBT` | `BCBA` | `STUDENT`). Courses follow a `draft → pending_review → published → archived` workflow driven by the `review-course` function; `is_published` is synced from `status` by trigger.
- Quiz answer keys are server-only: `questions.answer`/`explanation` are column-restricted, so never `select('*')` from `questions` in learner code. Course quizzes are graded by the `submit-quiz` Edge Function, exam practice by the `submit_practice` RPC, and admins read full questions via the `admin_get_questions` RPC. Clients cannot write `completions` or `attempts`.
- Use Supabase Storage with signed URLs for all user-uploaded or sensitive content. Never expose bucket contents publicly unless explicitly required.
- Validate all user inputs server-side within Edge Functions. Client-side validation is UX only.

- Migration filenames are `YYYYMMDDNNNNNN_description.sql` (e.g. `20261013000001_add_course_transcript.sql`).

---

## Testing

- Jest (`jest-expo`) — `npm test`. CI (`.github/workflows/ci.yml`) runs `tsc --noEmit` and `jest --ci --coverage` on every push/PR to `main`.
- Add tests for new pure functions in `lib/` and for non-trivial hooks, using the Supabase mock helper.

---

## Mobile Development (2026 Best Practices)

- Target iOS 16+ and Android 13+. Do not add workarounds for older OS versions unless the user explicitly requests it.
- Always test on both platforms conceptually. If a component uses a platform-specific API, guard it with `Platform.select` or `Platform.OS`.
- Use EAS Build for production builds. Never commit `.apk` or `.ipa` artifacts.
- Deep link scheme is `hopecenterceu://`. Maintain this scheme in `app.config.ts`.
- Push notifications use `expo-notifications`. Always request permissions gracefully — never assume permission is granted.
- Performance: avoid heavy operations on the JS thread. Offload animations to the native thread using `react-native-reanimated`. Keep FlatList/ScrollView renders virtualized.
- Offline resilience: use `expo-sqlite` for critical cached data (courses downloaded for offline playback). Keep the sync strategy simple — last-write-wins unless the user specifies otherwise.

---

## WCAG & Accessibility

- Meet **WCAG 2.2 AA** as the minimum bar; target AAA where it does not compromise UX.
- Every interactive element must have `accessibilityLabel`, `accessibilityRole`, and `accessibilityHint` where applicable.
- Touch targets must be at least **44×44 pt** (iOS) / **48×48 dp** (Android).
- Color contrast ratios: 4.5:1 for normal text, 3:1 for large text and UI components.
- Never convey information through color alone — pair with text, icons, or patterns.
- All images must have descriptive `accessibilityLabel` or `accessibilityHidden={true}` if decorative.
- Support Dynamic Type / font scaling. Use relative font sizes (`rem`-equivalent via NativeWind) rather than fixed `px` values.
- Test with VoiceOver (iOS) and TalkBack (Android) in mind. Logical focus order must match visual order.
- Form fields must have visible labels; do not rely on placeholder text as the label.

---

## UI/UX Principles

- Mobile-first layout. Design for the smallest supported screen (375px width) first, then adapt up.
- Hierarchy: every screen has one clear primary action. Secondary actions are visually subordinate.
- Feedback: every user action (tap, submit, load) must produce immediate visual or haptic feedback.
- Loading states: use skeleton screens over spinners for content-heavy screens.
- Error states: surface actionable error messages. Never show raw error objects or stack traces to users.
- Empty states: always design a helpful empty state for lists and dashboards.
- Animations: use Expo Router's built-in transitions for navigation. Custom animations via `react-native-reanimated`. Keep durations under 300 ms for UI transitions; 500 ms max for emphasis animations.
- Keep the primary brand color (`#8B1A8F`) as the primary interactive color. Use accent (`#D4A843`) sparingly for highlights and CTAs.

---

## Token Efficiency

- Before writing new code, search the existing codebase for reusable components, hooks, or utilities that already solve the problem.
- Do not generate boilerplate files (README, changelog, test stubs) unless explicitly asked.
- Write minimal, purposeful code. Do not add props, variants, or configuration options that are not immediately needed.
- Do not add comments that restate what the code already says. Only comment non-obvious constraints or workarounds.
- Prefer editing existing files over creating new ones.
- When implementing a feature, read only the files directly relevant to the task. Do not load the entire codebase into context.

---

## Security

- Never hardcode secrets, API keys, or credentials in source files. All secrets go in `.env` (gitignored) and are accessed via `process.env.EXPO_PUBLIC_*` on the client or Supabase project secrets on the server.
- `DEV_AUTH_BYPASS` must never be enabled in production builds. Gate it with `__DEV__` checks.
- Sanitize all user-generated content before rendering. Use `accessibilityLabel` safe strings and avoid `dangerouslySetInnerHTML` equivalents in React Native.
- Certificate generation and any financial operations (RevenueCat webhooks) must be server-side only.

---

## Deployment

- Expo Application Services (EAS) is the only deployment pipeline. Config is in `eas.json`.
- Production builds require all environment variables set as EAS secrets — never in `app.config.ts` literals.
- Run `npx expo-doctor` before submitting a release build. Fix all flagged issues.
- Supabase Edge Functions are deployed via `supabase functions deploy`. Never deploy functions with the `--no-verify-jwt` flag in production.
- Database migrations are applied via `supabase db push` (CI) or `supabase migration up` (local). Always run against a staging environment before production.

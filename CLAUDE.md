# Hope Center CEU — Claude Code Rules

## Project Overview

A mobile-first (iOS/Android/Web) CEU (Continuing Education Unit) platform for behavior professionals at Hope Center for Behavior Change. Built with Expo + Expo Router, Supabase, NativeWind, and TypeScript. Users complete accredited courses, track progress, and earn certificates — all within a WCAG-compliant, accessible UI.

---

## Mandatory Pre-Completion Checklist

Before marking **any** task complete, run both commands and confirm they pass:

```powershell
npx expo export --platform all --no-bundle-compress 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
npx tsc --noEmit
```

- If either command produces errors, fix them before reporting the task as done.
- Never skip the typecheck. TypeScript errors introduced silently break other contributors' workflows.
- A passing typecheck does not mean the feature is correct — also manually verify the golden path if a UI change was made.

---

## Structure Rules

- **Do not restructure the project.** The existing folder layout is intentional:
  - `app/` — Expo Router file-based routes only. Do not add non-route files here.
  - `components/` — Shared, reusable UI components.
  - `context/` — React Context providers only.
  - `hooks/` — Custom React hooks only.
  - `lib/` — Utility functions and Supabase client.
  - `types/` — TypeScript interfaces and type aliases.
  - `constants/` — App-wide constants (colors, config values).
  - `supabase/` — Migrations and Edge Functions. Never import from here in app code.
  - `assets/` — Static media. Do not generate programmatic assets here.
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

- Target Expo SDK 54+ conventions. Use Expo Router v6+ file-based routing.
- Use React 19 patterns: `use()`, server components where Expo Router supports them, automatic batching. Avoid legacy lifecycle methods.
- Prefer functional components and hooks exclusively.
- Do not use `useEffect` for data fetching — use `useSWR`, Supabase realtime subscriptions, or React Query instead.
- Extract logic into custom hooks in `hooks/`. Components should render, not compute.
- Keep component files under 200 lines. Split into subcomponents if larger.
- Use `expo-router`'s `Link` and `router` for all navigation. Never use `react-navigation` APIs directly.
- Use `expo-secure-store` for any sensitive data. Never store credentials or tokens in `AsyncStorage`.
- Prefer `expo-*` modules over bare React Native equivalents for cross-platform compatibility.
- Code-split heavy screens using `React.lazy` + `Suspense` or Expo Router's lazy loading to keep TTI low.

---

## NativeWind / Styling

- All styling goes through NativeWind (Tailwind utility classes via `className`).
- Use the design token colors defined in `tailwind.config.js`:
  - Primary: `primary` (`#8B1A8F`), `primary-dark`
  - Accent: `accent` (`#D4A843`), `accent-dark`
  - Surface: `surface`
- Do not introduce inline `StyleSheet.create` objects except where NativeWind cannot reach (e.g., animated styles driven by `Animated.Value`).
- Use custom fonts (Cormorant Garamond, Nunito, Source Sans 3) via the loaded font map — never hardcode font family strings outside of the config.

---

## Supabase (2026 Best Practices)

- **Never** use the `service_role` key in client-side or mobile code. It belongs only in Edge Functions.
- **Always** use the `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/publishable) on the client.
- All database access must go through Row Level Security (RLS). Every new table must have RLS enabled with explicit policies before shipping.
- Privileged operations (issuing certificates, publishing courses, admin actions) must live in Supabase Edge Functions — not in the mobile client.
- Every schema change must be written as a new file in `supabase/migrations/` following the existing naming convention. Never edit past migrations.
- Use Supabase Realtime for live data (progress tracking, notifications) rather than polling.
- Use Supabase Storage with signed URLs for all user-uploaded or sensitive content. Never expose bucket contents publicly unless explicitly required.
- Validate all user inputs server-side within Edge Functions. Client-side validation is UX only.

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

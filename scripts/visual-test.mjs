/**
 * Visual smoke test — certificate, video player, progress bars, success states.
 * Run: node scripts/visual-test.mjs
 *
 * For full coverage (course viewer, quiz, video player) add to .env:
 *   SUPABASE_TEST_EMAIL=your@email.com
 *   SUPABASE_TEST_PASSWORD=yourpassword
 *
 * Also ensure at least one published course has a video_url. Quick SQL:
 *   UPDATE courses
 *   SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
 *   WHERE id = (SELECT id FROM courses WHERE published = true LIMIT 1);
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const SHOTS = join(ROOT, 'scripts', 'screenshots');
const BASE  = 'http://localhost:8085';

// ── Load .env ──────────────────────────────────────────────────────────────
const env = {};
try {
  readFileSync(join(ROOT, '.env'), 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    if (k?.trim() && rest.length) env[k.trim()] = rest.join('=').trim();
  });
} catch { /* .env not present */ }

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL || '';
const ANON_KEY     = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const TEST_EMAIL   = env.SUPABASE_TEST_EMAIL   || '';
const TEST_PASS    = env.SUPABASE_TEST_PASSWORD || '';

await mkdir(SHOTS, { recursive: true });

// ── Authenticate + fetch IDs ───────────────────────────────────────────────
async function fetchIdsAuthenticated() {
  if (!SUPABASE_URL || !ANON_KEY || !TEST_EMAIL || !TEST_PASS) return {};

  try {
    // Exchange email+password for a JWT via Supabase auth REST
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
    });

    if (!authRes.ok) {
      console.warn(`  ✗ Supabase auth failed (${authRes.status}):`, await authRes.text());
      return {};
    }

    const { access_token: jwt } = await authRes.json();
    if (!jwt) { console.warn('  ✗ No access_token in auth response'); return {}; }
    console.log('  ✅ Authenticated with Supabase');

    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` };

    const [cRes, compRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/courses?select=id,title,video_url&published=eq.true&order=created_at.desc&limit=5`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/completions?select=id,passed,course_id&passed=eq.true&limit=1`, { headers }),
    ]);

    const courses     = cRes.ok    ? await cRes.json()    : [];
    const completions = compRes.ok ? await compRes.json() : [];

    return { courses, courseId: courses[0]?.id, completionId: completions[0]?.id };
  } catch (e) {
    console.warn('  ✗ Authenticated fetch failed:', e.message);
    return {};
  }
}

console.log('\n── Prefetching data from Supabase…');
if (!TEST_EMAIL || !TEST_PASS) {
  console.log('  ⚠️  SUPABASE_TEST_EMAIL / SUPABASE_TEST_PASSWORD not set in .env');
  console.log('      Course viewer, video player, and quiz tests will be skipped.');
  console.log('      Add those vars and re-run for full coverage.\n');
}

const { courses = [], courseId, completionId } = await fetchIdsAuthenticated();

console.log(`Courses found: ${courses.length}`);
if (courseId)     console.log(`  course:     ${courseId}`);
if (completionId) console.log(`  completion: ${completionId}`);

const videoConn = courses.find(c => c.video_url);
if (courses.length > 0 && !videoConn) {
  console.log('\n  ⚠️  No published course has a video_url. Run in Supabase SQL editor:');
  console.log(`     UPDATE courses SET video_url =`);
  console.log(`       'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'`);
  console.log(`     WHERE id = '${courses[0].id}';\n`);
} else if (videoConn) {
  console.log(`  video course: "${videoConn.title}"`);
}

// ── Browser ────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: false, slowMo: 120 });
const ctx = await browser.newContext({
  viewport:          { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent:         'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  colorScheme:       'light',
});
const page = await ctx.newPage();

async function shot(name) {
  const path = join(SHOTS, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function waitReady() {
  await page.waitForFunction(
    () => !document.querySelector('[aria-label="Loading"]'),
    { timeout: 10000 },
  ).catch(() => {});
  await page.waitForTimeout(800);
}

// ── 1. Sign-in ─────────────────────────────────────────────────────────────
console.log('\n── 1. Sign-in');
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
await waitReady();
await shot('01-sign-in');

// Detect which mode we're in: bypass ("Enter Dashboard") vs real auth ("Sign In")
const bypassBtn = page.getByRole('button', { name: /enter dashboard/i }).first();
const signInBtn = page.getByRole('button', { name: /^sign in$/i }).first();

const isBypass = await bypassBtn.isVisible({ timeout: 2000 }).catch(() => false);
const canRealAuth = !isBypass && !!TEST_EMAIL && !!TEST_PASS;

if (canRealAuth) {
  console.log('  Signing in with real credentials…');
  const emailField = page.getByLabel('Email');
  const passField  = page.getByLabel('Password');
  if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailField.fill(TEST_EMAIL);
    await passField.fill(TEST_PASS);
    await signInBtn.click();
    await waitReady();
    await page.waitForTimeout(1500);
    console.log('  ✅ Signed in with real credentials');
  } else {
    console.log('  ⚠️  Email field not found — falling back to bypass click');
    await bypassBtn.click().catch(() => {});
    await waitReady();
  }
} else {
  if (!isBypass && TEST_EMAIL) {
    console.log('  ⚠️  "Enter Dashboard" not found and devAuthBypass not detected — trying Sign In anyway');
  }
  const btn = isBypass ? bypassBtn : signInBtn;
  await btn.click().catch(() => {});
  await waitReady();
}

await shot('02-dashboard');

// ── 2. Dashboard progress bar ──────────────────────────────────────────────
console.log('\n── 2. Dashboard — CEU progress');
await shot('03-dashboard-progress');

// ── 3. Certificate ─────────────────────────────────────────────────────────
console.log('\n── 3. Certificate');
const certUrl = completionId
  ? `${BASE}/certificate/${completionId}`
  : `${BASE}/certificate/preview`;
console.log(`  → ${certUrl}`);
await page.goto(certUrl, { waitUntil: 'networkidle', timeout: 20000 });
await waitReady();
await shot('04-certificate');
await page.evaluate(() => window.scrollBy(0, 300));
await page.waitForTimeout(400);
await shot('05-certificate-download-btn');

// ── 4. Course viewer + video player ────────────────────────────────────────
if (courseId) {
  console.log('\n── 4. Course viewer');
  await page.goto(`${BASE}/course/${courseId}`, { waitUntil: 'networkidle', timeout: 20000 });
  await waitReady();
  await shot('06-course-viewer');

  const videoEl = page.locator('video').first();
  const hasVideo = await videoEl.isVisible({ timeout: 4000 }).catch(() => false);
  if (hasVideo) {
    console.log('  ✅ <video> element present');
    await page.evaluate(() => {
      const v = document.querySelector('video');
      if (v) { v.muted = true; v.play().catch(() => {}); }
    });
    await page.waitForTimeout(1500);
    await shot('07-video-playing');
  } else {
    console.log('  ⚠️  No <video> element — course likely has no video_url');
    await shot('07-video-placeholder');
  }
} else {
  console.log('\n── 4. Course viewer — SKIPPED (no courseId)');
}

// ── 5. Quiz — progress bar + result state ─────────────────────────────────
if (courseId) {
  console.log('\n── 5. Quiz');
  await page.goto(`${BASE}/quiz/${courseId}`, { waitUntil: 'networkidle', timeout: 20000 });
  await waitReady();
  await shot('08-quiz-start');

  const counter = await page.getByText(/\d+\s*\/\s*\d+/).first().textContent().catch(() => '');
  console.log(`  Counter text: "${counter}"`);

  const options = await page.getByRole('button', { name: /^option [ABCD]:/i }).all();
  if (options.length > 0) {
    await options[0].click();
    await page.waitForTimeout(300);
    await shot('09-quiz-option-selected');

    // Walk through remaining questions always picking the first option
    while (true) {
      const nextBtn = page.getByRole('button', { name: /^next$/i }).first();
      if (!await nextBtn.isVisible().catch(() => false)) break;
      await nextBtn.click();
      await page.waitForTimeout(400);
      const opts = await page.getByRole('button', { name: /^option [ABCD]:/i }).all();
      if (opts.length > 0) await opts[0].click();
      await page.waitForTimeout(300);
    }
    await shot('10-quiz-all-answered');

    const submitBtn = page.getByRole('button', { name: /submit/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await waitReady();
      await shot('11-quiz-result');

      const passed = await page.getByText(/well done|passed/i).isVisible().catch(() => false);
      const failed = await page.getByText(/keep practicing|not passed/i).isVisible().catch(() => false);
      console.log(`  Result: ${passed ? '✅ PASSED' : failed ? '❌ FAILED' : '⚠️  state unknown'}`);
    }
  } else {
    console.log('  ⚠️  No answer options rendered — course may have no questions yet');
    await shot('08-quiz-empty-state');
  }
} else {
  console.log('\n── 5. Quiz — SKIPPED (no courseId)');
}

// ── 6. Profile ─────────────────────────────────────────────────────────────
console.log('\n── 6. Profile tab');
await page.goto(`${BASE}/(tabs)/profile`, { waitUntil: 'networkidle', timeout: 20000 });
await waitReady();
await shot('12-profile-ceu-progress');

// ── Done ───────────────────────────────────────────────────────────────────
await browser.close();
console.log(`\n✅ Screenshots saved to scripts/screenshots/`);
if (!courseId) {
  console.log('\nTo test the video player and quiz screens:');
  console.log('  1. Add to .env:  SUPABASE_TEST_EMAIL=<email>  SUPABASE_TEST_PASSWORD=<password>');
  console.log('  2. Set a video_url on a published course (SQL above)');
  console.log('  3. Disable EXPO_PUBLIC_DEV_AUTH_BYPASS (remove or set to false) so real sign-in works');
  console.log('  4. Re-run: node scripts/visual-test.mjs\n');
}

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// expo-sqlite does not support web — all public functions guard for this.
const WEB = Platform.OS === 'web';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (WEB) return null;
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync('hopecenter_offline.db');

  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_courses (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT,
      track           TEXT,
      ceu_value       REAL DEFAULT 0,
      pass_score      INTEGER DEFAULT 80,
      duration_seconds INTEGER,
      video_url       TEXT,
      is_published    INTEGER DEFAULT 1,
      cached_at       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offline_questions (
      id        TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      stem      TEXT NOT NULL,
      options   TEXT NOT NULL,
      answer    INTEGER NOT NULL,
      domain    TEXT
    );
  `);

  // Rename legacy 'question' column to 'stem' if the old schema exists
  try {
    await _db.execAsync('ALTER TABLE offline_questions RENAME COLUMN question TO stem');
  } catch {
    // Column already named 'stem' or table was freshly created — no action needed
  }

  return _db;
}

// ── Types mirroring the Supabase shape ────────────────────────────────────────

export interface OfflineCourse {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  ceu_value: number;
  pass_score: number;
  duration_seconds: number | null;
  video_url: string | null;
  is_published: boolean;
  cached_at: string;
}

export interface OfflineQuestion {
  id: string;
  course_id: string;
  stem: string;
  options: string[];
  answer: number;
  domain: string | null;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function saveCourseOffline(
  course: Omit<OfflineCourse, 'cached_at'>,
  questions: OfflineQuestion[],
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR REPLACE INTO offline_courses
       (id, title, description, track, ceu_value, pass_score, duration_seconds, video_url, is_published, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      course.id, course.title, course.description ?? null, course.track ?? null,
      course.ceu_value, course.pass_score, course.duration_seconds ?? null,
      course.video_url ?? null, course.is_published ? 1 : 0, now,
    ],
  );

  // Replace questions for this course
  await db.runAsync('DELETE FROM offline_questions WHERE course_id = ?', [course.id]);

  for (const q of questions) {
    await db.runAsync(
      `INSERT OR REPLACE INTO offline_questions (id, course_id, stem, options, answer, domain)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [q.id, q.course_id, q.stem, JSON.stringify(q.options), q.answer, q.domain ?? null],
    );
  }
}

export async function removeCourseOffline(courseId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.runAsync('DELETE FROM offline_courses WHERE id = ?', [courseId]);
  await db.runAsync('DELETE FROM offline_questions WHERE course_id = ?', [courseId]);
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getCachedCourse(courseId: string): Promise<OfflineCourse | null> {
  const db = await getDb();
  if (!db) return null;
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM offline_courses WHERE id = ?',
    [courseId],
  );
  return row ? rowToCourse(row) : null;
}

export async function getAllCachedCourses(): Promise<OfflineCourse[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM offline_courses ORDER BY cached_at DESC',
  );
  return rows.map(rowToCourse);
}

export async function getCachedQuestions(courseId: string): Promise<OfflineQuestion[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM offline_questions WHERE course_id = ?',
    [courseId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    course_id: r.course_id as string,
    stem: r.stem as string,
    options: JSON.parse(r.options as string) as string[],
    answer: r.answer as number,
    domain: (r.domain as string | null) ?? null,
  }));
}

export async function isCourseDownloaded(courseId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM offline_courses WHERE id = ?',
    [courseId],
  );
  return row !== null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToCourse(r: Record<string, unknown>): OfflineCourse {
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    track: (r.track as string | null) ?? null,
    ceu_value: r.ceu_value as number,
    pass_score: r.pass_score as number,
    duration_seconds: (r.duration_seconds as number | null) ?? null,
    video_url: (r.video_url as string | null) ?? null,
    is_published: r.is_published === 1,
    cached_at: r.cached_at as string,
  };
}

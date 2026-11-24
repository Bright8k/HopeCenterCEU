import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireAdmin, handleCors, CORS_HEADERS } from '../_shared/auth.ts'

// Admin CSV export of ACE records (completions with certificate dates, or learner feedback),
// for BACB record requests and audits. Written to the private ace-exports bucket and returned
// as a short-lived signed URL.

type ExportType = 'completions' | 'feedback'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function csv(rows: (string | number | boolean | null | undefined)[][]) {
  return rows
    .map((row) =>
      row
        .map((v) => {
          const s = v == null ? '' : String(v)
          // Prefix formula-like values so spreadsheets don't execute them
          const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
          return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
        })
        .join(','),
    )
    .join('\r\n')
}

type One<T> = T | T[] | null
const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v)

async function completionsCsv(service: ReturnType<typeof createServiceClient>) {
  const [{ data: completions, error }, { data: issuances }] = await Promise.all([
    service
      .from('completions')
      .select('id, user_id, score, passed, completed_at, participant_name, participant_bacb, courses(title, track, ceu_value, category, instructor_name), profiles(display_name, bacb_cert_number)')
      .order('completed_at', { ascending: false }),
    service.from('certificate_issuances').select('completion_id, issued_at'),
  ])
  if (error) throw new Error('Unable to read completions')

  const certs = new Map<string, { first: string; last: string; count: number }>()
  for (const i of issuances ?? []) {
    const c = certs.get(i.completion_id)
    if (!c) certs.set(i.completion_id, { first: i.issued_at, last: i.issued_at, count: 1 })
    else {
      c.count++
      if (i.issued_at < c.first) c.first = i.issued_at
      if (i.issued_at > c.last) c.last = i.issued_at
    }
  }

  const header = [
    'Completion ID', 'Participant', 'BACB #', 'Account deleted', 'Course', 'Track', 'Credit type',
    'Credits', 'Ethics', 'Supervision', 'Instructor', 'Modality', 'Score %', 'Passed', 'Completed at',
    'First certificate issued', 'Last certificate issued', 'Certificate versions',
  ]
  const rows = (completions ?? []).map((c) => {
    const course = one(c.courses as One<{ title: string; track: string | null; ceu_value: number; category: string | null; instructor_name: string | null }>)
    const profile = one(c.profiles as One<{ display_name: string | null; bacb_cert_number: string | null }>)
    const credits = Number(course?.ceu_value ?? 0)
    const unit = course?.track === 'STUDENT' || credits <= 0 ? 'None' : course?.track === 'RBT' ? 'PDU' : 'CEU'
    const cert = certs.get(c.id)
    return [
      c.id,
      profile?.display_name ?? c.participant_name,
      profile?.bacb_cert_number ?? c.participant_bacb,
      c.user_id ? 'No' : 'Yes',
      course?.title,
      course?.track,
      unit,
      credits,
      course?.category === 'ethics' ? credits : 0,
      course?.category === 'supervision' ? credits : 0,
      course?.instructor_name,
      'Online asynchronous',
      c.score,
      c.passed ? 'Yes' : 'No',
      c.completed_at,
      cert?.first,
      cert?.last,
      cert?.count ?? 0,
    ]
  })
  return csv([header, ...rows])
}

async function feedbackCsv(service: ReturnType<typeof createServiceClient>) {
  const { data, error } = await service
    .from('course_feedback')
    .select('id, user_id, rating, comments, created_at, updated_at, courses(title, instructor_name), profiles(display_name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error('Unable to read feedback')

  const header = ['Feedback ID', 'Course', 'Instructor', 'Participant', 'Rating (1-5)', 'Comments', 'Submitted at', 'Updated at']
  const rows = (data ?? []).map((f) => {
    const course = one(f.courses as One<{ title: string; instructor_name: string | null }>)
    const profile = one(f.profiles as One<{ display_name: string | null }>)
    return [f.id, course?.title, course?.instructor_name, profile?.display_name ?? (f.user_id ? '' : 'Deleted account'), f.rating, f.comments, f.created_at, f.updated_at]
  })
  return csv([header, ...rows])
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    await requireAdmin(req)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unauthorized' }, 401)
  }

  try {
    const { type }: { type: ExportType } = await req.json()
    if (type !== 'completions' && type !== 'feedback') {
      return json({ error: 'type must be "completions" or "feedback"' }, 400)
    }

    const service = createServiceClient()
    // BOM so Excel opens UTF-8 names correctly
    const body = '﻿' + (type === 'completions' ? await completionsCsv(service) : await feedbackCsv(service))
    const path = `ace-${type}-latest.csv`

    const { error: uploadErr } = await service.storage
      .from('ace-exports')
      .upload(path, new Blob([body], { type: 'text/csv' }), { contentType: 'text/csv', upsert: true })
    if (uploadErr) return json({ error: 'The export could not be saved. Try again.' }, 500)

    const { data: signed, error: signErr } = await service.storage.from('ace-exports').createSignedUrl(path, 300, { download: true })
    if (signErr || !signed) return json({ error: 'The export could not be downloaded. Try again.' }, 500)

    return json({ signedUrl: signed.signedUrl })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500)
  }
})

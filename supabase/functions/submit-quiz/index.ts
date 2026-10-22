import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireUser, handleCors, CORS_HEADERS } from '../_shared/auth.ts'

// Grades a course quiz server-side and records the completion. Clients never receive answer
// keys and cannot write completions directly, so CEUs and certificates can't be self-awarded.

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let user
  try {
    user = await requireUser(req)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unauthorized' }, 401)
  }

  try {
    const body = await req.json().catch(() => null) as { courseId?: unknown; answers?: unknown } | null
    const courseId = body?.courseId
    const answers = body?.answers

    if (typeof courseId !== 'string' || !UUID_RE.test(courseId)) {
      return json({ error: 'courseId must be a valid id' }, 400)
    }
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return json({ error: 'answers must be an object of questionId -> option index' }, 400)
    }

    const service = createServiceClient()

    const [{ data: course }, { data: profile }, { data: adminRows }] = await Promise.all([
      service.from('courses').select('id, status, track, pass_score').eq('id', courseId).maybeSingle(),
      service.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      service.from('admin_roles').select('user_id').eq('user_id', user.id).limit(1),
    ])

    const isAdmin = (adminRows?.length ?? 0) > 0
    if (!course || (course.status !== 'published' && !isAdmin)) {
      return json({ error: 'Course not found' }, 404)
    }
    if (course.track && profile?.role !== course.track && !isAdmin) {
      return json({ error: 'This course is not part of your track' }, 403)
    }

    const { data: questions, error: qErr } = await service
      .from('questions')
      .select('id, answer')
      .eq('course_id', courseId)

    if (qErr) return json({ error: 'Unable to load quiz' }, 500)
    if (!questions || questions.length === 0) {
      return json({ error: 'This course has no quiz questions' }, 409)
    }

    const submitted = answers as Record<string, unknown>
    const graded = questions.map((q) => {
      const raw = submitted[q.id]
      const selected = Number.isInteger(raw) ? (raw as number) : null
      return { question_id: q.id, selected, is_correct: selected !== null && selected === q.answer }
    })

    const total = graded.length
    const correct = graded.filter((g) => g.is_correct).length
    const score = Math.round((correct / total) * 100)
    const passed = score >= (course.pass_score ?? 80)
    const now = new Date().toISOString()

    // Keep the learner's best result: a failed retake never overwrites an earlier pass.
    const { data: existing } = await service
      .from('completions')
      .select('id, passed, score')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    let completionId: string | null = existing?.id ?? null

    if (!existing) {
      const { data: inserted, error: insErr } = await service
        .from('completions')
        .insert({ user_id: user.id, course_id: courseId, score, passed, completed_at: now })
        .select('id')
        .single()
      if (insErr) return json({ error: 'Unable to record your result' }, 500)
      completionId = inserted.id
    } else if (passed ? (!existing.passed || score > (existing.score ?? 0)) : !existing.passed) {
      // cert_url reset so the certificate is regenerated with the new score
      const { error: updErr } = await service
        .from('completions')
        .update({ score, passed, completed_at: now, cert_url: null })
        .eq('id', existing.id)
      if (updErr) return json({ error: 'Unable to record your result' }, 500)
    }

    // Best-effort per-question history for analytics
    await service.from('attempts').insert(graded.map((g) => ({ ...g, user_id: user.id })))

    const certified = passed || existing?.passed === true
    return json({
      score,
      passed,
      correct,
      total,
      completionId: certified ? completionId : null,
    })
  } catch (err) {
    console.error('submit-quiz failed', err)
    return json({ error: 'Unexpected error' }, 500)
  }
})

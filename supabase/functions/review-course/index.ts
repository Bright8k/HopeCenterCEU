import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireAdmin } from '../_shared/auth.ts'
import { aceProblems, maxCreditsForMinutes, type AceProblem } from '../_shared/ace.ts'

type ReviewAction = 'submit' | 'approve' | 'reject' | 'archive' | 'unarchive'

type Payload = {
  courseId: string
  action: ReviewAction
  note?: string
}

const ACTION_STATUS: Record<ReviewAction, string> = {
  submit: 'pending_review',
  approve: 'published',
  reject: 'draft',
  archive: 'archived',
  unarchive: 'draft',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function approvalProblems(service: ReturnType<typeof createServiceClient>, courseId: string): Promise<string[]> {
  const { data: course } = await service
    .from('courses')
    .select('track, ceu_value, duration_seconds, instructor_name, learning_objectives')
    .eq('id', courseId)
    .single()
  if (!course) return ['course not found']

  const { count } = await service
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const credits = Number(course.ceu_value)
  const minutes = Math.round((course.duration_seconds ?? 0) / 60)
  const messages: Record<AceProblem, string> = {
    increment: 'use credit in 0.5 increments',
    instructor: 'add an instructor',
    objectives: 'add learning objectives',
    questions: `add at least ${Math.ceil(credits * 3)} quiz questions (3 per credit)`,
    duration: minutes
      ? `${minutes} minutes supports at most ${maxCreditsForMinutes(minutes)} credits`
      : 'set the course duration',
  }
  return aceProblems(course, count ?? 0).map((p) => messages[p])
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    await requireAdmin(req)

    const { courseId, action, note }: Payload = await req.json()

    if (!courseId || !action || !(action in ACTION_STATUS)) {
      return json({ error: 'courseId and a valid action are required' }, 400)
    }

    const service = createServiceClient()

    if (action === 'approve') {
      const problems = await approvalProblems(service, courseId)
      if (problems.length) {
        return json({ error: `This course can't award credit yet: ${problems.join('; ')}.` }, 422)
      }
    }

    const update: Record<string, unknown> = { status: ACTION_STATUS[action] }
    if (action === 'reject') {
      update.review_note = note ?? null
    } else {
      update.review_note = null
    }

    const { error } = await service
      .from('courses')
      .update(update)
      .eq('id', courseId)

    if (error) return json({ error: error.message }, 500)

    return json({ success: true, action, status: ACTION_STATUS[action] })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 401)
  }
})

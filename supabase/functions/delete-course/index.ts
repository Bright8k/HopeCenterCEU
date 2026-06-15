import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireAdmin } from '../_shared/auth.ts'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    await requireAdmin(req)
    const { courseId }: { courseId: string } = await req.json()

    if (!courseId) return json({ error: 'courseId is required' }, 400)

    const service = createServiceClient()

    // Resolve question IDs so we can cascade-delete attempts
    const { data: questions } = await service
      .from('questions')
      .select('id')
      .eq('course_id', courseId)

    const questionIds = (questions ?? []).map((q: { id: string }) => q.id)

    if (questionIds.length > 0) {
      await service.from('attempts').delete().in('question_id', questionIds)
    }

    await service.from('questions').delete().eq('course_id', courseId)
    await service.from('completions').delete().eq('course_id', courseId)

    const { error } = await service.from('courses').delete().eq('id', courseId)

    if (error) return json({ error: 'Unable to delete course' }, 400)

    return json({ deleted: courseId })
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      401,
    )
  }
})

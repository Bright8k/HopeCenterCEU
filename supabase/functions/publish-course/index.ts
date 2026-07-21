import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireAdmin } from '../_shared/auth.ts'

type Payload = {
  courseId: string
  isPublished: boolean
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    await requireAdmin(req)
    const { courseId, isPublished }: Payload = await req.json()

    if (!courseId || typeof isPublished !== 'boolean') {
      return json({ error: 'courseId and isPublished are required' }, 400)
    }

    // Publishing must go through the review workflow to prevent bypassing it.
    // Use the review-course function with action "approve" instead.
    if (isPublished) {
      return json(
        { error: 'Direct publish is disabled. Call review-course with action "approve" to publish a course through the review workflow.' },
        400,
      )
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('courses')
      .update({ status: 'archived', review_note: null })
      .eq('id', courseId)
      .select('id, is_published, status')
      .single()

    if (error || !data) {
      return json({ error: 'Unable to archive course' }, 400)
    }

    return json({ course: data })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      401,
    )
  }
})

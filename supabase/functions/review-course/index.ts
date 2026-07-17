import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireAdmin } from '../_shared/auth.ts'

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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    await requireAdmin(req)

    const { courseId, action, note }: Payload = await req.json()

    if (!courseId || !action || !(action in ACTION_STATUS)) {
      return json({ error: 'courseId and a valid action are required' }, 400)
    }

    const service = createServiceClient()

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

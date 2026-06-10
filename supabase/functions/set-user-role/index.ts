import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireAdmin } from '../_shared/auth.ts'

type Payload = {
  userId: string
  role: string
}

const VALID_ROLES = ['RBT', 'BCBA', 'STUDENT']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    await requireAdmin(req)
    const { userId, role }: Payload = await req.json()

    if (!userId || !role || !VALID_ROLES.includes(role)) {
      return json({ error: 'userId and a valid role (RBT, BCBA, STUDENT) are required' }, 400)
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, role')
      .single()

    if (error || !data) {
      return json({ error: 'Unable to update user role' }, 400)
    }

    return json({ userId: data.id, role: data.role })
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      401,
    )
  }
})

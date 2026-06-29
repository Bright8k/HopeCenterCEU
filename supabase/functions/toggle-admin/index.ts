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
    const requestingAdmin = await requireAdmin(req)
    const { userId, grant }: { userId: string; grant: boolean } = await req.json()

    if (!userId || typeof grant !== 'boolean') {
      return json({ error: 'userId and grant (boolean) are required' }, 400)
    }

    if (userId === requestingAdmin.id) {
      return json({ error: 'You cannot change your own admin status' }, 403)
    }

    const service = createServiceClient()

    if (grant) {
      const { error } = await service
        .from('admin_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })
      if (error) return json({ error: error.message }, 400)
    } else {
      const { error } = await service
        .from('admin_roles')
        .delete()
        .eq('user_id', userId)
      if (error) return json({ error: error.message }, 400)
    }

    return json({ ok: true, userId, isAdmin: grant })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 401)
  }
})

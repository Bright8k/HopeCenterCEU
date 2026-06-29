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
    const { userId }: { userId: string } = await req.json()
    if (!userId) return json({ error: 'userId is required' }, 400)

    // Prevent an admin from deleting their own account via this endpoint
    if (userId === requestingAdmin.id) {
      return json({ error: 'You cannot delete your own account through the admin portal' }, 403)
    }

    const service = createServiceClient()

    // Deleting the auth user cascades to public.profiles via FK on delete cascade,
    // which in turn cascades to completions, attempts, streaks, and admin_roles.
    const { error } = await service.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true, deletedUserId: userId })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 401)
  }
})

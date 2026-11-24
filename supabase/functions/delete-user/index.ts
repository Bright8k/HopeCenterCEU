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

    // Deleting the auth user cascades to public.profiles, streaks, admin_roles, and push tokens.
    // Completions, attempts, feedback, and certificate logs are kept (user_id set to null) for the
    // BACB's 3-year record requirement; a trigger snapshots the learner's name and BACB number first.
    const { error } = await service.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true, deletedUserId: userId })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 401)
  }
})

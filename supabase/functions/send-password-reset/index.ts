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
    const { userId }: { userId: string } = await req.json()
    if (!userId) return json({ error: 'userId is required' }, 400)

    const service = createServiceClient()

    // Look up auth email via admin API
    const { data: userRecord, error: lookupErr } = await service.auth.admin.getUserById(userId)
    if (lookupErr || !userRecord?.user?.email) {
      return json({ error: 'User not found or has no email address' }, 404)
    }

    // Send the standard password reset email through the auth API
    const { error: resetErr } = await service.auth.resetPasswordForEmail(
      userRecord.user.email,
      { redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://app.hopecenterceu.com'}/reset-password` },
    )

    if (resetErr) return json({ error: resetErr.message }, 400)

    return json({ ok: true, email: userRecord.user.email })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 401)
  }
})

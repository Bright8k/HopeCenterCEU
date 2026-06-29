import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireAdmin } from '../_shared/auth.ts'

const VALID_ROLES = ['RBT', 'BCBA', 'STUDENT']

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
    const { email, role, displayName }: {
      email: string
      role?: string
      displayName?: string
    } = await req.json()

    if (!email || typeof email !== 'string') {
      return json({ error: 'A valid email address is required' }, 400)
    }

    if (role && !VALID_ROLES.includes(role)) {
      return json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` }, 400)
    }

    const service = createServiceClient()

    // Send an invite email. The user sets their password on first sign-in.
    // We pass role and displayName as user_metadata so the onboarding flow
    // can pre-populate their profile on first login.
    const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
      data: {
        role: role ?? null,
        display_name: displayName ?? null,
      },
      redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://app.hopecenterceu.com'}/onboarding`,
    })

    if (error) return json({ error: error.message }, 400)

    return json({ ok: true, userId: data.user?.id, email })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 401)
  }
})

import { createClient } from '@supabase/supabase-js'

export function getAuthToken(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing authorization header')

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new Error('Authorization header must be Bearer <token>')
  }

  return token
}

export function createUserClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SB_PUBLISHABLE_KEY')!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('authorization') ?? '',
        },
      },
    },
  )
}

export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export async function requireUser(req: Request) {
  const token = getAuthToken(req)
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SB_PUBLISHABLE_KEY')!,
  )

  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) {
    throw new Error('Invalid or expired token')
  }

  return data.user
}

export async function requireAdmin(req: Request) {
  const user = await requireUser(req)
  const service = createServiceClient()

  const { data, error } = await service
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (error || !data || data.length === 0) {
    throw new Error('Admin access required')
  }

  return user
}

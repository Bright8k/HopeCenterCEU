import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createServiceClient, requireUser } from '../_shared/auth.ts'

type Payload = {
  completionId: string
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
    const user = await requireUser(req)
    const { completionId }: Payload = await req.json()

    if (!completionId) {
      return json({ error: 'completionId is required' }, 400)
    }

    const service = createServiceClient()
    const { data: completion, error } = await service
      .from('completions')
      .select('id, user_id, passed, cert_url')
      .eq('id', completionId)
      .single()

    if (error || !completion) {
      return json({ error: 'Completion not found' }, 404)
    }

    if (completion.user_id !== user.id) {
      return json({ error: 'Forbidden' }, 403)
    }

    if (!completion.passed) {
      return json({ error: 'Certificate is only available for passed completions' }, 409)
    }

    if (!completion.cert_url) {
      return json(
        {
          error: 'Certificate file has not been generated yet',
          nextStep: 'Upload the certificate PDF into the private certificates bucket and store its path in completions.cert_url.',
        },
        409,
      )
    }

    const { data: signed, error: signedError } = await service.storage
      .from('certificates')
      .createSignedUrl(completion.cert_url, 60)

    if (signedError || !signed) {
      return json({ error: 'Unable to create signed URL' }, 500)
    }

    return json({
      signedUrl: signed.signedUrl,
      expiresIn: 60,
      path: completion.cert_url,
    })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      401,
    )
  }
})

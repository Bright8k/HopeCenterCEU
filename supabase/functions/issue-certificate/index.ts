import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'npm:pdf-lib@1.17.1'
import { createServiceClient, requireUser, handleCors, CORS_HEADERS } from '../_shared/auth.ts'

// Brand colors (0-1 scale)
const PURPLE = rgb(0.545, 0.102, 0.561)   // #8B1A8F
const GOLD   = rgb(0.831, 0.659, 0.263)   // #D4A843
const WHITE  = rgb(1, 1, 1)
const DARK   = rgb(0.125, 0.106, 0.125)   // #201B20
const MUTED  = rgb(0.353, 0.318, 0.353)   // #5A5157
const LIGHT  = rgb(0.937, 0.898, 0.937)   // subtle purple tint
const ALERT  = rgb(0.6, 0.15, 0.1)

// BACB ACE Provider Handbook (2026): CE documentation must show the participant's name and BACB
// number, completion date, provider name and number, coordinator, event title, instructor, modality,
// and Learning CEUs with the Ethics/Supervision split. RBT PDUs may only be documented on the
// BACB's own form, so RBT courses get a record of completion that makes no PDU claim.
type Kind = 'ceu' | 'pdu' | 'none'

interface CertParams {
  kind: Kind
  participantName: string
  bacbNumber: string | null
  courseTitle: string
  credits: number
  ethicsCredits: number
  supervisionCredits: number
  instructorName: string | null
  providerName: string
  providerNumber: string | null
  coordinatorName: string | null
  score: number
  completedAt: string
  certId: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// Standard PDF fonts only encode WinAnsi; anything else would throw while drawing
function safe(text: string) {
  return text.replace(/[^\x20-\x7E -ÿ–—‘’“”•…]/g, '?')
}

function centerX(text: string, font: PDFFont, size: number, pageWidth: number) {
  return (pageWidth - font.widthOfTextAtSize(text, size)) / 2
}

function fit(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(' ')) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

async function generateCertificatePdf(p: CertParams): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792]) // US Letter
  const W = 612
  const H = 792

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const italic  = await doc.embedFont(StandardFonts.HelveticaOblique)

  const center = (text: string, font: PDFFont, size: number, y: number, color = DARK) =>
    page.drawText(text, { x: centerX(text, font, size, W), y, font, size, color })

  // ── Header band and border ─────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 100, width: W, height: 100, color: PURPLE })
  center(p.kind === 'ceu' ? 'CERTIFICATE OF COMPLETION' : 'RECORD OF COMPLETION', bold, 22, H - 52, WHITE)
  center(safe(p.providerName), regular, 12, H - 75, LIGHT)
  page.drawRectangle({ x: 0, y: H - 104, width: W, height: 4, color: GOLD })
  page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 130, borderColor: PURPLE, borderWidth: 1.5, color: WHITE })
  page.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 142, borderColor: GOLD, borderWidth: 0.5, color: WHITE })

  // ── Participant and course ─────────────────────────────────────────────
  center('This is to certify that', italic, 13, 640, MUTED)
  const name = fit(safe(p.participantName), bold, 28, W - 120)
  center(name, bold, 28, 600, PURPLE)
  const nameX = centerX(name, bold, 28, W)
  page.drawLine({ start: { x: nameX, y: 594 }, end: { x: nameX + bold.widthOfTextAtSize(name, 28), y: 594 }, thickness: 1, color: GOLD })
  center('has successfully completed', regular, 13, 566)
  wrap(safe(p.courseTitle), bold, 18, W - 110).slice(0, 2).forEach((line, i) => center(line, bold, 18, 536 - i * 24))

  // ── Required details ───────────────────────────────────────────────────
  const dateStr = new Date(p.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const rows: [string, string][] = [
    ['BACB certification #', p.bacbNumber ?? 'Not provided'],
    ['Completion date', dateStr],
    ['Instructor', p.instructorName ?? 'Not listed'],
    ['Modality', 'Online asynchronous'],
  ]
  if (p.kind === 'ceu') {
    rows.push(
      ['Learning CEUs', String(p.credits)],
      ['Ethics CEUs', String(p.ethicsCredits)],
      ['Supervision CEUs', String(p.supervisionCredits)],
    )
  }
  rows.push(
    ['ACE provider', p.providerName],
    ['ACE provider #', p.providerNumber ?? 'Pending approval'],
    ['ACE Coordinator', p.coordinatorName ?? 'Not yet designated'],
    ['Quiz score', `${p.score}%`],
  )

  page.drawLine({ start: { x: 80, y: 476 }, end: { x: W - 80, y: 476 }, thickness: 0.75, color: GOLD })
  let y = 452
  for (const [label, value] of rows) {
    page.drawText(label, { x: 100, y, font: regular, size: 10.5, color: MUTED })
    page.drawText(fit(safe(value), bold, 10.5, W - 100 - 250), { x: 250, y, font: bold, size: 10.5, color: DARK })
    y -= 20
  }

  // ── Notices ────────────────────────────────────────────────────────────
  const notices: string[] = []
  if (!p.providerNumber) {
    notices.push('ACE provider approval is pending. This document is not valid for BACB continuing education credit.')
  }
  if (p.kind === 'pdu') {
    notices.push('This is not PDU documentation. RBT professional development units are documented on the BACB PD form issued by the ACE Coordinator.')
  }
  y -= 6
  for (const notice of notices) {
    for (const line of wrap(notice, italic, 9.5, W - 160)) {
      center(line, italic, 9.5, y, ALERT)
      y -= 13
    }
    y -= 4
  }

  // ── Signature ──────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 160, y: 118 }, end: { x: 440, y: 118 }, thickness: 0.75, color: MUTED })
  center(safe(p.coordinatorName ? `${p.coordinatorName}, ACE Coordinator` : 'ACE Coordinator'), regular, 10, 104, MUTED)

  // ── Footer ─────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: 70, color: PURPLE })
  page.drawText(`Certificate ID: ${p.certId.slice(0, 8).toUpperCase()}`, { x: 40, y: 28, font: regular, size: 9, color: LIGHT })
  const issued = `Issued ${new Date().toLocaleDateString('en-US')} via Hope Center CEU Platform`
  page.drawText(issued, { x: W - 40 - regular.widthOfTextAtSize(issued, 9), y: 28, font: regular, size: 9, color: LIGHT })

  return doc.save()
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const user = await requireUser(req)
    const { completionId }: { completionId: string } = await req.json()

    if (!completionId) {
      return json({ error: 'completionId is required' }, 400)
    }

    const service = createServiceClient()

    const [{ data: completion, error: completionErr }, { data: settings }] = await Promise.all([
      service
        .from('completions')
        .select('id, user_id, passed, score, completed_at, course_id, courses(title, ceu_value, track, category, instructor_name), profiles(display_name, bacb_cert_number)')
        .eq('id', completionId)
        .single(),
      service.from('ace_settings').select('provider_name, provider_number, coordinator_name').maybeSingle(),
    ])

    if (completionErr || !completion) {
      return json({ error: 'Completion not found' }, 404)
    }
    if (completion.user_id !== user.id) {
      return json({ error: 'Forbidden' }, 403)
    }
    if (!completion.passed) {
      return json({ error: 'Certificate is only available for passed completions' }, 409)
    }

    const course = completion.courses as {
      title: string; ceu_value: number; track: string | null; category: string | null; instructor_name: string | null
    } | null
    const profile = completion.profiles as { display_name: string | null; bacb_cert_number: string | null } | null

    const credits = Number(course?.ceu_value ?? 0)
    const kind: Kind = course?.track === 'STUDENT' || credits <= 0 ? 'none' : course?.track === 'RBT' ? 'pdu' : 'ceu'

    if (kind === 'ceu' && settings?.provider_number && !profile?.bacb_cert_number) {
      return json({ error: 'Add your BACB certification number in Edit Profile, then download your certificate again.' }, 409)
    }

    // Regenerated on every request so provider and learner details stay current (replacement
    // certificates must be available for 3 years); the stored copy is overwritten each time.
    const pdfBytes = await generateCertificatePdf({
      kind,
      participantName: profile?.display_name ?? user.email ?? 'Participant',
      bacbNumber: profile?.bacb_cert_number ?? null,
      courseTitle: course?.title ?? 'Course Completion',
      credits,
      ethicsCredits: course?.category === 'ethics' ? credits : 0,
      supervisionCredits: course?.category === 'supervision' ? credits : 0,
      instructorName: course?.instructor_name ?? null,
      providerName: settings?.provider_name ?? 'Hope Center for Behavior Change',
      providerNumber: settings?.provider_number ?? null,
      coordinatorName: settings?.coordinator_name ?? null,
      score: completion.score ?? 100,
      completedAt: completion.completed_at,
      certId: completion.id,
    })

    const storagePath = `${user.id}/${completionId}.pdf`
    const { error: uploadErr } = await service.storage
      .from('certificates')
      .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      return json({ error: 'The certificate could not be saved. Please try again.' }, 500)
    }

    await service.from('completions').update({ cert_url: storagePath }).eq('id', completionId)

    const { data: signed, error: signErr } = await service.storage
      .from('certificates')
      .createSignedUrl(storagePath, 300)

    if (signErr || !signed) {
      return json({ error: 'PDF generated but unable to create signed URL' }, 500)
    }

    return json({ signedUrl: signed.signedUrl, expiresIn: 300 })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 401)
  }
})

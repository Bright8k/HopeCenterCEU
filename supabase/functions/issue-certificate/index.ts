import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'
import { createServiceClient, requireUser } from '../_shared/auth.ts'

// Brand colors (0-1 scale)
const PURPLE = rgb(0.545, 0.102, 0.561)   // #8B1A8F
const GOLD   = rgb(0.831, 0.659, 0.263)   // #D4A843
const WHITE  = rgb(1, 1, 1)
const DARK   = rgb(0.125, 0.106, 0.125)   // #201B20
const MUTED  = rgb(0.353, 0.318, 0.353)   // #5A5157
const LIGHT  = rgb(0.937, 0.898, 0.937)   // subtle purple tint

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function centerX(text: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>, size: number, pageWidth: number) {
  return (pageWidth - font.widthOfTextAtSize(text, size)) / 2
}

async function generateCertificatePdf(params: {
  participantName: string
  courseTitle: string
  ceuValue: number
  track: string | null
  score: number
  completedAt: string
  certId: string
}): Promise<Uint8Array> {
  const { participantName, courseTitle, ceuValue, track, score, completedAt, certId } = params

  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792]) // US Letter
  const W = 612
  const H = 792

  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontItalic  = await doc.embedFont(StandardFonts.HelveticaOblique)

  // ── Purple header band ─────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 100, width: W, height: 100, color: PURPLE })

  const titleText = 'CERTIFICATE OF COMPLETION'
  page.drawText(titleText, {
    x: centerX(titleText, fontBold, 22, W),
    y: H - 52,
    font: fontBold,
    size: 22,
    color: WHITE,
  })

  const orgText = 'Hope Center for Behavior Change'
  page.drawText(orgText, {
    x: centerX(orgText, fontRegular, 12, W),
    y: H - 75,
    font: fontRegular,
    size: 12,
    color: LIGHT,
  })

  // ── Gold accent line ───────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 104, width: W, height: 4, color: GOLD })

  // ── Outer border ───────────────────────────────────────────────────────
  page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 130, borderColor: PURPLE, borderWidth: 1.5, color: WHITE })
  page.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 142, borderColor: GOLD, borderWidth: 0.5, color: WHITE })

  // ── Preamble ───────────────────────────────────────────────────────────
  const preamble = 'This is to certify that'
  page.drawText(preamble, {
    x: centerX(preamble, fontItalic, 13, W),
    y: 618,
    font: fontItalic,
    size: 13,
    color: MUTED,
  })

  // ── Participant name ───────────────────────────────────────────────────
  const nameSize = participantName.length > 30 ? 26 : 30
  page.drawText(participantName, {
    x: centerX(participantName, fontBold, nameSize, W),
    y: 568,
    font: fontBold,
    size: nameSize,
    color: PURPLE,
  })

  // Name underline
  const nameWidth = fontBold.widthOfTextAtSize(participantName, nameSize)
  const nameX = centerX(participantName, fontBold, nameSize, W)
  page.drawLine({ start: { x: nameX, y: 562 }, end: { x: nameX + nameWidth, y: 562 }, thickness: 1, color: GOLD })

  // ── Completion text ────────────────────────────────────────────────────
  const completedLine = 'has successfully completed the course'
  page.drawText(completedLine, {
    x: centerX(completedLine, fontRegular, 13, W),
    y: 532,
    font: fontRegular,
    size: 13,
    color: DARK,
  })

  // ── Course title ───────────────────────────────────────────────────────
  // Wrap long titles across two lines
  const maxTitleWidth = W - 100
  const titleSize = 20
  const titleWords = courseTitle.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of titleWords) {
    const test = currentLine ? `${currentLine} ${word}` : word
    if (fontBold.widthOfTextAtSize(test, titleSize) > maxTitleWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = test
    }
  }
  if (currentLine) lines.push(currentLine)

  const lineHeight = 28
  const titleStartY = 490
  for (let i = 0; i < Math.min(lines.length, 2); i++) {
    page.drawText(lines[i], {
      x: centerX(lines[i], fontBold, titleSize, W),
      y: titleStartY - i * lineHeight,
      font: fontBold,
      size: titleSize,
      color: DARK,
    })
  }

  // ── CEU value ──────────────────────────────────────────────────────────
  const ceuLabel = `Earning ${ceuValue} Continuing Education Unit${ceuValue !== 1 ? 's' : ''}`
  page.drawText(ceuLabel, {
    x: centerX(ceuLabel, fontRegular, 13, W),
    y: 414,
    font: fontRegular,
    size: 13,
    color: MUTED,
  })

  // ── Decorative separator ───────────────────────────────────────────────
  page.drawLine({ start: { x: 80, y: 388 }, end: { x: W - 80, y: 388 }, thickness: 0.75, color: GOLD })

  // ── Date and score row ─────────────────────────────────────────────────
  const dateObj = new Date(completedAt)
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const dateLabel = `Completed: ${dateStr}`
  const scoreLabel = `Score: ${score}%`

  page.drawText(dateLabel, { x: 80, y: 364, font: fontRegular, size: 11, color: MUTED })
  page.drawText(scoreLabel, {
    x: W - 80 - fontRegular.widthOfTextAtSize(scoreLabel, 11),
    y: 364,
    font: fontRegular,
    size: 11,
    color: MUTED,
  })

  // ── Track badge (if present) ───────────────────────────────────────────
  if (track) {
    const trackLabel = `Track: ${track}`
    page.drawText(trackLabel, {
      x: centerX(trackLabel, fontRegular, 11, W),
      y: 340,
      font: fontRegular,
      size: 11,
      color: MUTED,
    })
  }

  // ── Signature section ──────────────────────────────────────────────────
  page.drawLine({ start: { x: 160, y: 200 }, end: { x: 440, y: 200 }, thickness: 0.75, color: MUTED })
  const sigLabel = 'Authorized by Hope Center for Behavior Change'
  page.drawText(sigLabel, {
    x: centerX(sigLabel, fontRegular, 10, W),
    y: 186,
    font: fontRegular,
    size: 10,
    color: MUTED,
  })

  // ── Footer ─────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: 70, color: PURPLE })

  const certIdText = `Certificate ID: ${certId.slice(0, 8).toUpperCase()}`
  page.drawText(certIdText, { x: 40, y: 28, font: fontRegular, size: 9, color: LIGHT })

  const verifyText = 'Issued via Hope Center CEU Platform'
  page.drawText(verifyText, {
    x: W - 40 - fontRegular.widthOfTextAtSize(verifyText, 9),
    y: 28,
    font: fontRegular,
    size: 9,
    color: LIGHT,
  })

  return doc.save()
}

Deno.serve(async (req) => {
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

    // Fetch completion with course and profile in one query
    const { data: completion, error: completionErr } = await service
      .from('completions')
      .select('id, user_id, passed, score, completed_at, cert_url, course_id, courses(title, ceu_value, track), profiles(display_name)')
      .eq('id', completionId)
      .single()

    if (completionErr || !completion) {
      return json({ error: 'Completion not found' }, 404)
    }

    if (completion.user_id !== user.id) {
      return json({ error: 'Forbidden' }, 403)
    }

    if (!completion.passed) {
      return json({ error: 'Certificate is only available for passed completions' }, 409)
    }

    // If cert already exists, just return a fresh signed URL
    if (completion.cert_url) {
      const { data: signed, error: signErr } = await service.storage
        .from('certificates')
        .createSignedUrl(completion.cert_url, 300)

      if (signErr || !signed) {
        return json({ error: 'Unable to create signed URL' }, 500)
      }
      return json({ signedUrl: signed.signedUrl, expiresIn: 300 })
    }

    // Generate PDF
    const course = completion.courses as { title: string; ceu_value: number; track: string | null } | null
    const profile = completion.profiles as { display_name: string | null } | null

    const pdfBytes = await generateCertificatePdf({
      participantName: profile?.display_name ?? user.email ?? 'Participant',
      courseTitle: course?.title ?? 'Course Completion',
      ceuValue: course?.ceu_value ?? 1,
      track: course?.track ?? null,
      score: completion.score ?? 100,
      completedAt: completion.completed_at,
      certId: completion.id,
    })

    // Upload to private certificates bucket
    const storagePath = `${user.id}/${completionId}.pdf`

    const { error: uploadErr } = await service.storage
      .from('certificates')
      .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      return json({ error: `Storage upload failed: ${uploadErr.message}` }, 500)
    }

    // Update completions.cert_url
    await service.from('completions').update({ cert_url: storagePath }).eq('id', completionId)

    // Create signed URL (5 minutes)
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

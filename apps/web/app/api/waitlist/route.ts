import { NextResponse, type NextRequest } from 'next/server'
import { waitlistSchema } from '@/lib/waitlist'
import { appendWaitlist } from '@/lib/waitlist-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim()
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? undefined
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = waitlistSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json(
      { ok: false, error: first?.message ?? 'Invalid input' },
      { status: 422 },
    )
  }

  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true, created: false }, { status: 200 })
  }

  try {
    const { created, record } = await appendWaitlist(parsed.data, {
      ip: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json(
      { ok: true, created, id: record.id },
      { status: created ? 201 : 200 },
    )
  } catch (err) {
    console.error('[waitlist] failed to persist:', err)
    return NextResponse.json(
      { ok: false, error: 'Could not save right now. Please try again.' },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

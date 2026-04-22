/**
 * 微信支付 V3 webhook — verifies signature + AES-GCM decrypts + activates
 * subscription + grants credits + writes AuditLog (all via
 * `handleCnPaymentWebhook`).
 *
 * Response shape follows the official spec: `{ code: 'SUCCESS'|'FAIL', message }`.
 *
 * @owner W4 — payments real
 */
import { NextResponse, type NextRequest } from 'next/server'

import { handleCnPaymentWebhook } from '@forgely/api/payments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text()
  const headers = request.headers

  try {
    const result = await handleCnPaymentWebhook({
      channel: 'wechat',
      body: rawBody,
      headers,
    })
    if (result.status === 'processed' || result.status === 'duplicate') {
      return NextResponse.json({ code: 'SUCCESS', message: 'OK' }, { status: 200 })
    }
    return NextResponse.json(
      { code: 'SUCCESS', message: result.message ?? 'ignored' },
      { status: 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[wechat-webhook] failed', { message })
    return NextResponse.json({ code: 'FAIL', message }, { status: 400 })
  }
}

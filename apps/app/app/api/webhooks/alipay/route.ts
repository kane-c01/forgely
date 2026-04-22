/**
 * 支付宝 webhook — verifies RSA2 signature + activates subscription + grants
 * credits + writes AuditLog (via `handleCnPaymentWebhook`).
 *
 * Response spec: plain-text body `success` or `failure`.
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
      channel: 'alipay',
      body: rawBody,
      headers,
    })
    void result
    return new NextResponse('success', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[alipay-webhook] failed', { message })
    return new NextResponse('failure', {
      status: 400,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
}

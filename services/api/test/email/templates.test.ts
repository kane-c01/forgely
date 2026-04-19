import { describe, expect, it } from 'vitest'

import {
  renderEmailVerification,
  renderInvoicePaid,
  renderInvoicePaymentFailed,
  renderPasswordReset,
  renderWelcome,
} from '../../src/email/index.js'

describe('email/templates', () => {
  it('welcome renders subject + html', () => {
    const out = renderWelcome({ name: 'Jane', appUrl: 'https://example.test' })
    expect(out.subject).toMatch(/welcome/i)
    expect(out.html).toContain('Jane')
    expect(out.html).toContain('https://example.test')
  })

  it('verifyEmail includes the link and expiry', () => {
    const out = renderEmailVerification({
      verifyUrl: 'https://example.test/verify?token=abc',
      expiresInMinutes: 60,
    })
    expect(out.html).toContain('verify?token=abc')
    expect(out.html).toContain('60 minutes')
  })

  it('passwordReset includes the link and expiry', () => {
    const out = renderPasswordReset({
      resetUrl: 'https://example.test/reset?token=xyz',
      expiresInMinutes: 30,
    })
    expect(out.html).toContain('reset?token=xyz')
    expect(out.html).toContain('30 minutes')
  })

  it('invoicePaid formats the amount and includes receipt link when given', () => {
    const out = renderInvoicePaid({
      amountUsdCents: 9900,
      description: 'Pro · monthly',
      receiptUrl: 'https://example.test/r',
    })
    expect(out.html).toContain('99.00 USD')
    expect(out.html).toContain('Pro · monthly')
    expect(out.html).toContain('example.test/r')
  })

  it('invoicePaymentFailed includes retry CTA', () => {
    const out = renderInvoicePaymentFailed({
      amountUsdCents: 2900,
      retryUrl: 'https://example.test/retry',
    })
    expect(out.html).toContain('29.00 USD')
    expect(out.html).toContain('example.test/retry')
  })
})

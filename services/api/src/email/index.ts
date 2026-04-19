/**
 * Public surface of `@forgely/api/email`.
 *
 * High-level helpers (sendWelcomeEmail / sendPasswordResetEmail / …) are
 * thin compositions of `renderXxx` + `getEmailTransport().send`.
 *
 * @owner W3
 */

import {
  renderEmailVerification,
  renderInvoicePaid,
  renderInvoicePaymentFailed,
  renderPasswordReset,
  renderWelcome,
} from './templates.js'
import { getEmailTransport, isResendConfigured, setEmailTransport } from './transport.js'
import type { EmailMessage, EmailTransport } from './types.js'

const transport = () => getEmailTransport()

const appUrl = (): string => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

const verifyUrl = (token: string, email: string): string =>
  `${appUrl()}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

const resetUrl = (token: string): string =>
  `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`

export const sendWelcomeEmail = async (params: {
  to: string
  name?: string | null
}): Promise<{ id: string }> => {
  const { subject, html } = renderWelcome({ name: params.name, appUrl: appUrl() })
  return transport().send({
    to: params.to,
    subject,
    html,
    tags: { template: 'welcome' },
  })
}

export const sendVerificationEmail = async (params: {
  to: string
  token: string
  expiresInMinutes?: number
}): Promise<{ id: string }> => {
  const expiresInMinutes = params.expiresInMinutes ?? 24 * 60
  const { subject, html } = renderEmailVerification({
    verifyUrl: verifyUrl(params.token, params.to),
    expiresInMinutes,
  })
  return transport().send({
    to: params.to,
    subject,
    html,
    tags: { template: 'verify_email' },
  })
}

export const sendPasswordResetEmail = async (params: {
  to: string
  token: string
  expiresInMinutes?: number
}): Promise<{ id: string }> => {
  const expiresInMinutes = params.expiresInMinutes ?? 30
  const { subject, html } = renderPasswordReset({
    resetUrl: resetUrl(params.token),
    expiresInMinutes,
  })
  return transport().send({
    to: params.to,
    subject,
    html,
    tags: { template: 'reset_password' },
  })
}

export const sendInvoicePaidEmail = async (params: {
  to: string
  amountUsdCents: number
  description: string
  receiptUrl?: string
}): Promise<{ id: string }> => {
  const { subject, html } = renderInvoicePaid(params)
  return transport().send({
    to: params.to,
    subject,
    html,
    tags: { template: 'invoice_paid' },
  })
}

export const sendInvoicePaymentFailedEmail = async (params: {
  to: string
  amountUsdCents: number
  retryUrl: string
}): Promise<{ id: string }> => {
  const { subject, html } = renderInvoicePaymentFailed(params)
  return transport().send({
    to: params.to,
    subject,
    html,
    tags: { template: 'invoice_failed' },
  })
}

export {
  getEmailTransport,
  setEmailTransport,
  isResendConfigured,
  renderEmailVerification,
  renderInvoicePaid,
  renderInvoicePaymentFailed,
  renderPasswordReset,
  renderWelcome,
}

export type { EmailMessage, EmailTransport }

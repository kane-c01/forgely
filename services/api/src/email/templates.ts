/**
 * Inlined HTML email templates. Each template is a pure function from
 * payload to {subject, html} so we can unit-test rendering and i18n later.
 *
 * NOTE: keep templates ASCII-clean and inline-styled — most clients
 * (especially Outlook) will mangle <link> stylesheets.
 *
 * @owner W3
 */

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  background: #0a0a0b;
  color: #f5f5f7;
  padding: 32px 24px;
  border-radius: 12px;
  max-width: 540px;
  margin: 0 auto;
`

const buttonStyle = `
  display: inline-block;
  background: linear-gradient(180deg, #ff7a45 0%, #d65d2c 100%);
  color: #ffffff !important;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
`

const wrap = (inner: string): string =>
  `<div style="background:#000;padding:32px 0;"><div style="${baseStyles}">${inner}<p style="opacity:0.5;margin-top:32px;font-size:12px;">— Forgely · Brand operating system for the AI era</p></div></div>`

export interface RenderedEmail {
  subject: string
  html: string
}

export const renderWelcome = (params: { name?: string | null; appUrl: string }): RenderedEmail => ({
  subject: 'Welcome to Forgely',
  html: wrap(
    `<h1 style="margin:0 0 16px;">Welcome${params.name ? `, ${params.name}` : ''} 👋</h1>` +
      `<p>Your account is live. Paste any e-commerce URL and Forgely will turn it into a brand site in minutes.</p>` +
      `<p style="margin:32px 0;"><a href="${params.appUrl}" style="${buttonStyle}">Open the dashboard</a></p>`,
  ),
})

export const renderEmailVerification = (params: {
  verifyUrl: string
  expiresInMinutes: number
}): RenderedEmail => ({
  subject: 'Verify your Forgely email',
  html: wrap(
    `<h1 style="margin:0 0 16px;">Confirm your email</h1>` +
      `<p>Click below to confirm — link expires in ${params.expiresInMinutes} minutes.</p>` +
      `<p style="margin:32px 0;"><a href="${params.verifyUrl}" style="${buttonStyle}">Verify email</a></p>` +
      `<p style="opacity:0.6;font-size:13px;">If you didn't sign up, you can ignore this email.</p>`,
  ),
})

export const renderPasswordReset = (params: {
  resetUrl: string
  expiresInMinutes: number
}): RenderedEmail => ({
  subject: 'Reset your Forgely password',
  html: wrap(
    `<h1 style="margin:0 0 16px;">Reset your password</h1>` +
      `<p>We got a request to reset your password. The link below expires in ${params.expiresInMinutes} minutes.</p>` +
      `<p style="margin:32px 0;"><a href="${params.resetUrl}" style="${buttonStyle}">Reset password</a></p>` +
      `<p style="opacity:0.6;font-size:13px;">If you didn't request this, you can ignore this email and your password stays unchanged.</p>`,
  ),
})

export const renderInvoicePaid = (params: {
  amountUsdCents: number
  description: string
  receiptUrl?: string
}): RenderedEmail => ({
  subject: 'Forgely receipt',
  html: wrap(
    `<h1 style="margin:0 0 16px;">Thanks for your payment</h1>` +
      `<p><strong>${(params.amountUsdCents / 100).toFixed(2)} USD</strong> · ${params.description}</p>` +
      (params.receiptUrl
        ? `<p style="margin:32px 0;"><a href="${params.receiptUrl}" style="${buttonStyle}">View receipt</a></p>`
        : ''),
  ),
})

export const renderInvoicePaymentFailed = (params: {
  amountUsdCents: number
  retryUrl: string
}): RenderedEmail => ({
  subject: 'Payment problem on your Forgely subscription',
  html: wrap(
    `<h1 style="margin:0 0 16px;">Heads up — your payment failed</h1>` +
      `<p>We couldn't charge <strong>${(params.amountUsdCents / 100).toFixed(2)} USD</strong>. We'll retry automatically; you can also fix it now:</p>` +
      `<p style="margin:32px 0;"><a href="${params.retryUrl}" style="${buttonStyle}">Update payment method</a></p>`,
  ),
})

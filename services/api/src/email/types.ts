export interface EmailMessage {
  to: string
  /** Optional explicit from-address; defaults to env. */
  from?: string
  subject: string
  html: string
  /** Plaintext fallback. Generated from `html` when omitted. */
  text?: string
  /** Headers (e.g. List-Unsubscribe). */
  headers?: Record<string, string>
  /** Tags for analytics in Resend / Postmark / Sentry breadcrumbs. */
  tags?: Record<string, string>
}

export interface EmailTransport {
  name: string
  send(message: EmailMessage): Promise<{ id: string; queuedAt: Date }>
}

/**
 * Email transport selection.
 *
 *   - `RESEND_API_KEY` set → real Resend HTTP transport.
 *   - Otherwise           → console transport that logs the message and
 *                           buffers it in-memory for tests.
 *
 * The transport interface is deliberately tiny so we can swap to Postmark /
 * SES later without touching the call sites.
 *
 * @owner W3
 */

import type { EmailMessage, EmailTransport } from './types.js'

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

class ResendTransport implements EmailTransport {
  name = 'resend'
  constructor(
    private readonly apiKey: string,
    private readonly fromDefault: string,
  ) {}

  async send(message: EmailMessage): Promise<{ id: string; queuedAt: Date }> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from ?? this.fromDefault,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text ?? stripHtml(message.html),
        headers: message.headers,
        tags: message.tags
          ? Object.entries(message.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      }),
    })
    if (!response.ok) {
      throw new Error(
        `[email/resend] HTTP ${response.status}: ${await response.text().catch(() => '')}`,
      )
    }
    const json = (await response.json()) as { id?: string }
    return { id: json.id ?? 'unknown', queuedAt: new Date() }
  }
}

class ConsoleTransport implements EmailTransport {
  name = 'console'
  /** Last 50 messages, exposed for tests via `getRecentMessages`. */
  private readonly buffer: EmailMessage[] = []

  async send(message: EmailMessage): Promise<{ id: string; queuedAt: Date }> {
    this.buffer.push(message)
    if (this.buffer.length > 50) this.buffer.shift()
    console.info('[email/console]', message.to, '—', message.subject)
    return { id: `mock_${Date.now()}`, queuedAt: new Date() }
  }

  /** Test helper. */
  getRecentMessages(): readonly EmailMessage[] {
    return [...this.buffer]
  }
}

let cached: EmailTransport | null = null
let injected: EmailTransport | null = null

const buildDefaultTransport = (): EmailTransport => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Forgely <hello@forgely.app>'
  if (apiKey) return new ResendTransport(apiKey, from)
  return new ConsoleTransport()
}

export const getEmailTransport = (): EmailTransport => {
  if (injected) return injected
  if (!cached) cached = buildDefaultTransport()
  return cached
}

export const setEmailTransport = (transport: EmailTransport | null): void => {
  injected = transport
  cached = null
}

export const isResendConfigured = (): boolean => !!process.env.RESEND_API_KEY

export { ResendTransport, ConsoleTransport }

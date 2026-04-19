import { z } from 'zod'

/**
 * Permissive store-URL validator:
 *   - empty / whitespace → undefined (fine, optional field)
 *   - "x.com" or "www.x.com" → auto-prefix with `https://`
 *   - "http://x.com" / "https://x.com" → kept as-is
 *   - anything else (e.g. "ftp://x", "/path") → rejected with a
 *     clear, non-technical message
 */
const storeUrlField = z
  .union([z.string(), z.undefined()])
  .transform((raw): string | undefined => {
    const v = raw?.trim()
    if (!v) return undefined
    if (/^https?:\/\//i.test(v)) return v
    return `https://${v}`
  })
  .pipe(
    z
      .string()
      .max(500, 'Store URL is too long')
      .url('Enter a valid store URL (e.g. https://yourbrand.com)')
      .optional(),
  )

export const waitlistSchema = z.object({
  email: z
    .string({ required_error: 'Please enter your email.' })
    .min(1, 'Please enter your email.')
    .email('That does not look like a valid email.')
    .max(254, 'Email is too long.'),
  storeUrl: storeUrlField,
  plan: z.enum(['free', 'starter', 'pro', 'agency', 'enterprise']).optional().default('free'),
  /** Locale tag forwarded by the form so we can route nurture emails. */
  locale: z.string().max(10).optional(),
  /** Honeypot — bots will fill this. We accept any value here; the API handler silently
   *  drops the request when it is non-empty so the bot can't tell the field is a trap. */
  website: z.string().optional(),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>

export interface WaitlistRecord extends WaitlistInput {
  id: string
  createdAt: string
  ipHash?: string
  userAgent?: string
  source: 'web'
}

import { z } from 'zod'

export interface WaitlistMessages {
  emailRequired: string
  emailInvalid: string
  storeUrlInvalid: string
}

const defaultMessages: WaitlistMessages = {
  emailRequired: 'Email is required',
  emailInvalid: 'Enter a valid email',
  storeUrlInvalid: 'Store URL must start with http(s)://',
}

export function createWaitlistSchema(messages: WaitlistMessages = defaultMessages) {
  return z.object({
    email: z
      .string()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid)
      .max(254),
    storeUrl: z
      .string()
      .max(500)
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : undefined))
      .refine(
        (v) => v === undefined || /^https?:\/\/.+/i.test(v),
        messages.storeUrlInvalid,
      ),
    plan: z
      .enum(['free', 'starter', 'pro', 'agency', 'enterprise'])
      .optional()
      .default('free'),
    /** Honeypot — bots will fill this. We accept any value here; the API handler silently
     *  drops the request when it is non-empty so the bot can't tell the field is a trap. */
    website: z.string().optional(),
  })
}

/** Server-side schema (English messages — used by /api/waitlist for log clarity). */
export const waitlistSchema = createWaitlistSchema()

export type WaitlistInput = z.infer<typeof waitlistSchema>

export interface WaitlistRecord extends WaitlistInput {
  id: string
  createdAt: string
  ipHash?: string
  userAgent?: string
  source: 'web'
}

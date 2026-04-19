import { z } from 'zod'

export const waitlistSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email')
    .max(254),
  storeUrl: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .refine(
      (v) => v === undefined || /^https?:\/\/.+/i.test(v),
      'Store URL must start with http(s)://',
    ),
  plan: z
    .enum(['free', 'starter', 'pro', 'agency', 'enterprise'])
    .optional()
    .default('free'),
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

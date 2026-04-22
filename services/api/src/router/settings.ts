/**
 * `settings.*` tRPC router — user profile + workspace + notification +
 * per-site operational settings (domains, payments, shipping, tax,
 * storefront).
 *
 * Three layers live under this namespace because they all conceptually
 * belong to the user-administered "Settings" surface area; splitting them
 * into separate routers would just create cross-imports in apps/app.
 *
 *   - profile / workspace / notifications  → /app/settings  (user-level)
 *   - account / sessions / 2FA              → handled by `auth.*` (history)
 *   - siteSettings                          → /app/sites/[id]/settings
 *
 * @owner W2 (Sprint 3) — extended Sprint 3++ to add notifications + site.
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { prisma } from '../db.js'
import { protectedProcedure, router } from './trpc.js'

const UpdateProfileInput = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  locale: z.enum(['zh-CN', 'zh-HK', 'zh-TW', 'en']).optional(),
  region: z.enum(['cn', 'global']).optional(),
})

const UpdateWorkspaceInput = z.object({
  workspaceName: z.string().min(1).max(100).optional(),
  defaultBrandKit: z.string().optional().nullable(),
})

const UpdateNotificationsInput = z.object({
  emailOrders: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  emailSecurity: z.boolean().optional(),
  emailBilling: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
})

// ─── Site Settings ────────────────────────────────────────────────────────
//
// SiteSettings is stored as a JSON blob on Site.settings (Prisma `Json`).
// Validation lives here so add/remove a field is a one-place change with
// no migration. The shape mirrors what apps/app's site-settings tabs render.
//
// `payments.providers` is the list of provider slugs the storefront should
// expose at checkout. Stripe/PayPal/Apple Pay/Google Pay/NOWPayments only —
// the CN-specific WeChat/Alipay channels apply to *Forgely's own subscription
// billing* (see `billing.ts`), not to the user's storefront which is for an
// overseas C-end audience (PIVOT-CN.md §0).

const PaymentProviderSlug = z.enum(['stripe', 'paypal', 'apple_pay', 'google_pay', 'nowpayments'])

const SiteSettings = z.object({
  payments: z
    .object({
      providers: z.array(PaymentProviderSlug).default(['stripe']),
      stripeAccountId: z.string().optional(),
      paypalEmail: z.string().email().optional(),
      nowpaymentsApiKey: z.string().optional(),
      currency: z.string().default('USD'),
    })
    .partial()
    .optional(),
  shipping: z
    .object({
      zones: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            regions: z.array(z.string()).min(1),
            rates: z.array(
              z.object({
                id: z.string(),
                label: z.string().min(1),
                amountCents: z.number().int().nonnegative(),
                etaDays: z.string().optional(),
              }),
            ),
          }),
        )
        .default([]),
    })
    .partial()
    .optional(),
  tax: z
    .object({
      mode: z.enum(['auto', 'manual']).default('auto'),
      defaultRate: z.number().min(0).max(1).optional(),
      includedInPrice: z.boolean().default(false),
    })
    .partial()
    .optional(),
  storefront: z
    .object({
      defaultLocale: z.string().default('en'),
      enabledLocales: z.array(z.string()).default(['en']),
      defaultCurrency: z.string().default('USD'),
      supportEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z
        .object({
          line1: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          postalCode: z.string().optional(),
        })
        .optional(),
    })
    .partial()
    .optional(),
})

export type SiteSettingsShape = z.infer<typeof SiteSettings>

const SiteIdInput = z.object({ siteId: z.string().min(1) })
const UpdateSiteSettingsInput = SiteIdInput.extend({ settings: SiteSettings })

const UpdateCustomDomainInput = SiteIdInput.extend({
  customDomain: z
    .string()
    .trim()
    .min(3)
    .max(253)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Must be a bare host like example.com')
    .nullable(),
})

/** Default values returned when a user has never explicitly toggled anything. */
const DEFAULT_NOTIF = {
  emailOrders: true,
  emailMarketing: false,
  emailSecurity: true,
  emailBilling: true,
  pushEnabled: false,
}

async function assertSiteOwnership(userId: string, siteId: string): Promise<void> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { userId: true },
  })
  if (!site) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Site not found.' })
  }
  if (site.userId !== userId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this site.' })
  }
}

export const settingsRouter = router({
  // ─── Profile / Workspace ─────────────────────────────────────────────
  /** Current user profile. */
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        region: true,
        role: true,
        plan: true,
        emailVerifiedAt: true,
        totpEnabledAt: true,
        phoneE164: true,
        phoneVerifiedAt: true,
        wechatUnionId: true,
        createdAt: true,
      },
    })
    return user
  }),

  /** Update profile fields. */
  updateProfile: protectedProcedure.input(UpdateProfileInput).mutation(async ({ ctx, input }) => {
    return prisma.user.update({
      where: { id: ctx.user.id },
      data: input,
    })
  }),

  /** Workspace preferences (stored as user-level for now). */
  workspace: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: { id: true, name: true, locale: true, region: true },
    })
    return {
      workspaceName: user.name ?? 'My Workspace',
      locale: user.locale,
      region: user.region,
    }
  }),

  /** Update workspace preferences. */
  updateWorkspace: protectedProcedure
    .input(UpdateWorkspaceInput)
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {}
      if (input.workspaceName) data.name = input.workspaceName
      return prisma.user.update({
        where: { id: ctx.user.id },
        data,
      })
    }),

  // ─── Notification Preferences ─────────────────────────────────────────
  /** Notification preferences — lazily-created row backed by NotificationPreference. */
  notifications: protectedProcedure.query(async ({ ctx }) => {
    const row = await prisma.notificationPreference.findUnique({
      where: { userId: ctx.user.id },
    })
    if (!row) return DEFAULT_NOTIF
    return {
      emailOrders: row.emailOrders,
      emailMarketing: row.emailMarketing,
      emailSecurity: row.emailSecurity,
      emailBilling: row.emailBilling,
      pushEnabled: row.pushEnabled,
    }
  }),

  /** Update notification preferences (upserts the row). */
  updateNotifications: protectedProcedure
    .input(UpdateNotificationsInput)
    .mutation(async ({ ctx, input }) => {
      const merged = { ...DEFAULT_NOTIF, ...input }
      const row = await prisma.notificationPreference.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id, ...merged },
        update: input,
      })
      return {
        emailOrders: row.emailOrders,
        emailMarketing: row.emailMarketing,
        emailSecurity: row.emailSecurity,
        emailBilling: row.emailBilling,
        pushEnabled: row.pushEnabled,
      }
    }),

  // ─── Per-Site Settings ────────────────────────────────────────────────
  /**
   * Site-level operational settings (domains / payments / shipping / tax /
   * storefront). Returns the parsed `SiteSettings` shape with defaults
   * applied so the form on /sites/[id]/settings always has values to bind to.
   */
  siteSettings: protectedProcedure.input(SiteIdInput).query(async ({ ctx, input }) => {
    await assertSiteOwnership(ctx.user.id, input.siteId)
    const site = await prisma.site.findUniqueOrThrow({
      where: { id: input.siteId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        status: true,
        settings: true,
      },
    })
    const parsed = SiteSettings.safeParse(site.settings ?? {})
    return {
      site: {
        id: site.id,
        name: site.name,
        subdomain: site.subdomain,
        customDomain: site.customDomain,
        status: site.status,
      },
      settings: parsed.success ? parsed.data : {},
    }
  }),

  /** Replace the site's `settings` JSON with the given shape (full overwrite). */
  updateSiteSettings: protectedProcedure
    .input(UpdateSiteSettingsInput)
    .mutation(async ({ ctx, input }) => {
      await assertSiteOwnership(ctx.user.id, input.siteId)
      const site = await prisma.site.update({
        where: { id: input.siteId },
        data: { settings: input.settings as object },
        select: { id: true, settings: true },
      })
      return site
    }),

  /**
   * Update or remove the custom domain. Pass `null` to unset.
   * The actual DNS / SSL provisioning happens out-of-band — for now we just
   * persist the value so the rest of the platform can react to it.
   */
  updateCustomDomain: protectedProcedure
    .input(UpdateCustomDomainInput)
    .mutation(async ({ ctx, input }) => {
      await assertSiteOwnership(ctx.user.id, input.siteId)
      // Light-weight conflict check: another site already claimed this host.
      if (input.customDomain) {
        const existing = await prisma.site.findUnique({
          where: { customDomain: input.customDomain },
          select: { id: true, userId: true },
        })
        if (existing && existing.id !== input.siteId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This domain is already linked to another site.',
          })
        }
      }
      return prisma.site.update({
        where: { id: input.siteId },
        data: { customDomain: input.customDomain },
        select: { id: true, customDomain: true },
      })
    }),
})

/**
 * `plugins.*` tRPC router — user-facing plugin install / configure / uninstall.
 *
 * @owner W2 (Sprint 3)
 */

import { z } from 'zod'

import { type Prisma, prisma } from '../db.js'
import { protectedProcedure, router } from './trpc.js'

const MARKETPLACE_PLUGINS = [
  {
    pluginId: 'analytics-ga4',
    name: 'Google Analytics 4',
    description: 'Connect GA4 to track visitors, conversions and events on your Forgely site.',
    category: 'analytics',
    icon: '📊',
    verified: true,
    free: true,
  },
  {
    pluginId: 'chat-crisp',
    name: 'Crisp Live Chat',
    description: 'Add a live chat widget for real-time customer support.',
    category: 'support',
    icon: '💬',
    verified: true,
    free: true,
  },
  {
    pluginId: 'reviews-trustpilot',
    name: 'Trustpilot Reviews',
    description: 'Display Trustpilot review scores and badges on product pages.',
    category: 'social-proof',
    icon: '⭐',
    verified: true,
    free: false,
  },
  {
    pluginId: 'shipping-sf',
    name: 'SF Express Shipping',
    description: 'Real-time SF Express shipping rates and tracking integration.',
    category: 'shipping',
    icon: '🚚',
    verified: true,
    free: false,
  },
  {
    pluginId: 'payment-wechat',
    name: 'WeChat Pay',
    description: 'Accept WeChat Pay payments directly on your storefront.',
    category: 'payments',
    icon: '💳',
    verified: true,
    free: true,
  },
  {
    pluginId: 'seo-schema',
    name: 'Rich Schema Markup',
    description: 'Auto-generate JSON-LD structured data for better search rankings.',
    category: 'seo',
    icon: '🔍',
    verified: true,
    free: true,
  },
  {
    pluginId: 'email-mailchimp',
    name: 'Mailchimp Email',
    description: 'Sync customer data and automate email campaigns with Mailchimp.',
    category: 'marketing',
    icon: '📧',
    verified: true,
    free: false,
  },
  {
    pluginId: 'loyalty-smile',
    name: 'Smile.io Loyalty',
    description: 'Reward repeat customers with points, referrals and VIP tiers.',
    category: 'marketing',
    icon: '🎁',
    verified: false,
    free: false,
  },
] as const

const InstallInput = z.object({
  siteId: z.string().min(1),
  pluginId: z.string().min(1),
  config: z.record(z.unknown()).optional(),
})

const UpdateConfigInput = z.object({
  siteId: z.string().min(1),
  pluginId: z.string().min(1),
  config: z.record(z.unknown()),
})

const ToggleInput = z.object({
  siteId: z.string().min(1),
  pluginId: z.string().min(1),
  enabled: z.boolean(),
})

const UninstallInput = z.object({
  siteId: z.string().min(1),
  pluginId: z.string().min(1),
})

const ListInstalledInput = z.object({
  siteId: z.string().min(1),
})

const InstallationsInput = z.object({
  pluginId: z.string().min(1),
})

export const pluginsRouter = router({
  /** Browse the app marketplace (static catalog for now). */
  marketplace: protectedProcedure.query(async () => {
    return MARKETPLACE_PLUGINS.map((p) => ({ ...p }))
  }),

  /** List plugins installed on a specific site. */
  installed: protectedProcedure.input(ListInstalledInput).query(async ({ input }) => {
    const rows = await prisma.installedPlugin.findMany({
      where: { siteId: input.siteId },
      orderBy: { installedAt: 'desc' },
    })
    return rows.map((r) => {
      const meta = MARKETPLACE_PLUGINS.find((p) => p.pluginId === r.pluginId)
      return {
        ...r,
        name: meta?.name ?? r.pluginId,
        description: meta?.description ?? '',
        icon: meta?.icon ?? '🔌',
        category: meta?.category ?? 'other',
      }
    })
  }),

  /**
   * Aggregate view used by the marketplace page: for the given plugin, returns
   * every site the calling user owns and whether the plugin is currently
   * installed on that site. Lets the marketplace card render per-site
   * Install / Manage / Uninstall actions in one modal.
   */
  installations: protectedProcedure.input(InstallationsInput).query(async ({ ctx, input }) => {
    const sites = await prisma.site.findMany({
      where: { userId: ctx.user.id, deletedAt: null },
      select: { id: true, name: true, subdomain: true, status: true },
      orderBy: { updatedAt: 'desc' },
    })
    const installs = await prisma.installedPlugin.findMany({
      where: {
        pluginId: input.pluginId,
        siteId: { in: sites.map((s) => s.id) },
      },
      select: {
        siteId: true,
        enabled: true,
        installedAt: true,
        config: true,
      },
    })
    const bySite = new Map(installs.map((i) => [i.siteId, i]))
    return sites.map((s) => {
      const inst = bySite.get(s.id)
      return {
        site: s,
        installed: !!inst,
        enabled: inst?.enabled ?? false,
        installedAt: inst?.installedAt ?? null,
        config: (inst?.config as Record<string, unknown> | null) ?? null,
      }
    })
  }),

  /** Install a plugin on a site. */
  install: protectedProcedure.input(InstallInput).mutation(async ({ input }) => {
    return prisma.installedPlugin.create({
      data: {
        siteId: input.siteId,
        pluginId: input.pluginId,
        version: '1.0.0',
        config: (input.config ?? {}) as unknown as Prisma.InputJsonValue,
        enabled: true,
      },
    })
  }),

  /** Update plugin configuration. */
  updateConfig: protectedProcedure.input(UpdateConfigInput).mutation(async ({ input }) => {
    return prisma.installedPlugin.update({
      where: {
        siteId_pluginId: {
          siteId: input.siteId,
          pluginId: input.pluginId,
        },
      },
      data: { config: input.config as unknown as Prisma.InputJsonValue },
    })
  }),

  /** Toggle plugin enabled/disabled. */
  toggle: protectedProcedure.input(ToggleInput).mutation(async ({ input }) => {
    return prisma.installedPlugin.update({
      where: {
        siteId_pluginId: {
          siteId: input.siteId,
          pluginId: input.pluginId,
        },
      },
      data: { enabled: input.enabled },
    })
  }),

  /** Uninstall a plugin from a site. */
  uninstall: protectedProcedure.input(UninstallInput).mutation(async ({ input }) => {
    return prisma.installedPlugin.delete({
      where: {
        siteId_pluginId: {
          siteId: input.siteId,
          pluginId: input.pluginId,
        },
      },
    })
  }),
})

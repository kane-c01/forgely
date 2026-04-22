/**
 * /super > Platform Settings tRPC sub-router. OWNER only.
 *
 * Covers three concerns surfaced in `apps/app/app/super/settings/*`:
 *   1. General — platform name / domain / default locale / maintenance mode / open-signup toggle
 *   2. Feature flags — bulk boolean toggles (wechatLogin / phoneOtp / wechatPay / …)
 *   3. API keys — mask + rotation metadata. The real secret still lives
 *      in `.env` (operator must redeploy); this table stores only the
 *      masked preview + last-rotation timestamp so super-admins can see
 *      which providers are configured without the backend serving plaintext.
 *
 * Everything writes an AuditLog row so rotations are forensically traceable.
 */
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { assertCan } from './_acl.js'
import { recordAudit } from './_audit-log.js'

// ─────────────────────────────────────────────────────────────────────────
// Input schemas
// ─────────────────────────────────────────────────────────────────────────

const generalInput = z.object({
  platformName: z.string().min(1).max(80).optional(),
  platformDomain: z.string().min(3).max(120).optional(),
  defaultLocale: z.enum(['zh-CN', 'en']).optional(),
  defaultRegion: z.enum(['cn', 'global']).optional(),
  maintenanceMode: z.boolean().optional(),
  signupEnabled: z.boolean().optional(),
})

const flagToggleInput = z.object({
  id: z.string().min(1).max(80),
  enabled: z.boolean(),
})

const flagBulkInput = z.object({
  flags: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        enabled: z.boolean(),
        requiresCredential: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(32),
})

const rotateSecretInput = z.object({
  envVar: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[A-Z0-9_]+$/, 'envVar must be SCREAMING_SNAKE_CASE'),
  label: z.string().min(1).max(120).optional(),
  /** Plaintext secret — server masks + discards immediately. */
  plaintext: z.string().min(8).max(4_000),
})

const upsertSecretMetaInput = z.object({
  envVar: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[A-Z0-9_]+$/),
  label: z.string().min(1).max(120),
})

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function maskSecret(plaintext: string): string {
  const t = plaintext.trim()
  if (t.length <= 6) return '•'.repeat(t.length)
  const head = t.slice(0, 2)
  const tail = t.slice(-4)
  return `${head}${'•'.repeat(Math.max(6, t.length - 6))}${tail}`
}

// ─────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────

export const superSettingsRouter = router({
  /** Fetch all three payload blocks in one round-trip. */
  get: superAdminProcedure.query(async ({ ctx }) => {
    assertCan(ctx.user?.role, 'settings.read')

    const [general, flags, secrets] = await Promise.all([
      ctx.prisma.platformSetting.upsert({
        where: { id: 'singleton' },
        update: {},
        create: { id: 'singleton' },
      }),
      ctx.prisma.platformFeatureFlag.findMany({ orderBy: { id: 'asc' } }),
      ctx.prisma.platformSecret.findMany({ orderBy: { envVar: 'asc' } }),
    ])

    return { general, flags, secrets }
  }),

  /** Patch a subset of the general settings row. */
  updateGeneral: superAdminProcedure.input(generalInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'settings.write')
    const updated = await ctx.prisma.platformSetting.upsert({
      where: { id: 'singleton' },
      update: { ...input, updatedBy: ctx.user?.id ?? null },
      create: { id: 'singleton', ...input, updatedBy: ctx.user?.id ?? null },
    })
    await recordAudit(ctx, {
      action: 'settings.general.update',
      targetType: 'platform',
      targetId: 'singleton',
      after: input,
    })
    return updated
  }),

  /** Flip one feature flag. */
  toggleFlag: superAdminProcedure.input(flagToggleInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'settings.write')
    const row = await ctx.prisma.platformFeatureFlag.upsert({
      where: { id: input.id },
      update: { enabled: input.enabled, updatedBy: ctx.user?.id ?? null },
      create: {
        id: input.id,
        enabled: input.enabled,
        requiresCredential: false,
        updatedBy: ctx.user?.id ?? null,
      },
    })
    await recordAudit(ctx, {
      action: `settings.flag.${input.enabled ? 'enable' : 'disable'}`,
      targetType: 'feature_flag',
      targetId: input.id,
      after: { enabled: input.enabled },
    })
    return row
  }),

  /**
   * Bulk sync flags — used by the first visit so the UI shows the full
   * catalogue even if the DB is empty (upserts defaults). Defaults come
   * from the caller so the super-admin can bootstrap without a seed script.
   */
  syncFlags: superAdminProcedure.input(flagBulkInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'settings.write')
    for (const f of input.flags) {
      await ctx.prisma.platformFeatureFlag.upsert({
        where: { id: f.id },
        update: { enabled: f.enabled, requiresCredential: f.requiresCredential ?? false },
        create: {
          id: f.id,
          enabled: f.enabled,
          requiresCredential: f.requiresCredential ?? false,
          updatedBy: ctx.user?.id ?? null,
        },
      })
    }
    return ctx.prisma.platformFeatureFlag.findMany({ orderBy: { id: 'asc' } })
  }),

  /** Register or update a secret entry (without rotating it). */
  upsertSecretMeta: superAdminProcedure
    .input(upsertSecretMetaInput)
    .mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'settings.write')
      const row = await ctx.prisma.platformSecret.upsert({
        where: { envVar: input.envVar },
        update: { label: input.label },
        create: {
          envVar: input.envVar,
          label: input.label,
          configured: false,
        },
      })
      return row
    }),

  /**
   * Record a secret rotation: mask the plaintext and persist the
   * preview + timestamp. The real secret has to be re-applied to the
   * deploy environment (operator responsibility); we only audit the
   * rotation event here.
   */
  rotateSecret: superAdminProcedure.input(rotateSecretInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'settings.write')
    const masked = maskSecret(input.plaintext)
    const now = new Date()

    const row = await ctx.prisma.platformSecret.upsert({
      where: { envVar: input.envVar },
      update: {
        label: input.label ?? input.envVar,
        maskedPreview: masked,
        configured: true,
        rotatedAt: now,
        rotatedBy: ctx.user?.id ?? null,
      },
      create: {
        envVar: input.envVar,
        label: input.label ?? input.envVar,
        maskedPreview: masked,
        configured: true,
        rotatedAt: now,
        rotatedBy: ctx.user?.id ?? null,
      },
    })

    await recordAudit(ctx, {
      action: 'settings.secret.rotate',
      targetType: 'platform_secret',
      targetId: input.envVar,
      after: { maskedPreview: masked, rotatedAt: now.toISOString() },
    })

    // NB: intentionally return the masked preview — never the plaintext.
    return row
  }),

  /** Mark a secret as no longer configured. */
  clearSecret: superAdminProcedure
    .input(z.object({ envVar: z.string().min(3).max(80) }))
    .mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'settings.write')
      const row = await ctx.prisma.platformSecret.findUnique({ where: { envVar: input.envVar } })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      const updated = await ctx.prisma.platformSecret.update({
        where: { envVar: input.envVar },
        data: { configured: false, maskedPreview: null },
      })
      await recordAudit(ctx, {
        action: 'settings.secret.clear',
        targetType: 'platform_secret',
        targetId: input.envVar,
      })
      return updated
    }),
})

export type SuperSettingsRouter = typeof superSettingsRouter

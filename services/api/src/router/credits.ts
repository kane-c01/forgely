/**
 * `credits.*` tRPC router.
 *
 * Read-only on the public surface; debit happens via internal service calls
 * (the AI orchestration layer + worker queue), not from the browser.
 *
 * @owner W3 (T24)
 */

import { z } from 'zod';

import {
  AI_RATE_PER_MIN_BY_PLAN,
  consumeCredits,
  consumeRateLimit,
  getOrCreateWallet,
  listTransactions,
  planSlug,
} from '../credits/index.js';

import { protectedProcedure, router, superAdminProcedure } from './trpc.js';

const ConsumeInternalInput = z.object({
  amount: z.number().int().positive().max(1000),
  description: z.string().min(1).max(256),
  metadata: z.record(z.unknown()).optional(),
});

const HistoryInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
  type: z
    .enum([
      'purchase',
      'subscription',
      'consumption',
      'refund',
      'gift',
      'promotion',
      'reservation_release',
      'adjustment',
    ])
    .optional(),
});

export const creditsRouter = router({
  /** Current spendable + reserved balance for the signed-in user. */
  balance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getOrCreateWallet(ctx.user.id);
    return {
      balance: wallet.balance,
      reserved: wallet.reserved,
      lifetimeEarned: wallet.lifetimeEarned,
      lifetimeSpent: wallet.lifetimeSpent,
      dailySpentToday: wallet.dailySpentToday,
    };
  }),

  /** Paginated ledger view (newest first). */
  history: protectedProcedure
    .input(HistoryInput)
    .query(async ({ input, ctx }) => {
      return listTransactions({ userId: ctx.user.id, ...input });
    }),

  /**
   * Internal-only debit endpoint.
   * Restricted to super_admin so external callers can't burn user credits;
   * AI services should call `consumeCredits` from `@forgely/api/credits`
   * directly, not via tRPC.
   */
  consumeInternal: superAdminProcedure
    .input(ConsumeInternalInput.extend({ userId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return consumeCredits(input);
    }),

  /**
   * Hit-test the AI rate-limit bucket. Used by the AI Copilot UI to disable
   * the input field before the request would be rejected server-side.
   */
  checkAiRateLimit: protectedProcedure.mutation(async ({ ctx }) => {
    const plan = planSlug(ctx.user.plan);
    const max = AI_RATE_PER_MIN_BY_PLAN[plan];
    const result = await consumeRateLimit({
      bucketKey: `ai:${ctx.user.id}`,
      windowMs: 60_000,
      max,
    });
    return { ...result, max, plan };
  }),
});

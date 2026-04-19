/**
 * Synchronous credit debit (one-shot operations).
 *
 * For long-running operations (generation pipeline) prefer `reserve()` from
 * ./reserve.ts so we can release on failure.
 *
 * @owner W3 (T24)
 */

import type { Prisma, PrismaClient } from '@prisma/client';

import { Prisma as PrismaNS, prisma as defaultPrisma } from '../db.js';
import { ForgelyError, errors } from '../errors.js';

import {
  assertWithinDailyCap,
  assertWithinPerOperation,
  planSlug,
  utcDayStart,
} from './limits.js';
import {
  getOrCreateWallet,
  resetDailyCounterIfNewDay,
} from './wallet.js';

type Tx = PrismaClient | Prisma.TransactionClient;

export interface ConsumeCreditsInput {
  userId: string;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ConsumeCreditsResult {
  balance: number;
  transactionId: string;
}

/**
 * Atomic debit + ledger row + daily-cap counter update, in one transaction.
 *
 * Throws:
 *   - VALIDATION_ERROR / CREDIT_OPERATION_TOO_LARGE on bad input
 *   - DAILY_CREDIT_LIMIT_EXCEEDED if today's spend cap would be passed
 *   - INSUFFICIENT_CREDITS if balance < amount
 */
export const consumeCredits = async (
  input: ConsumeCreditsInput,
  client: Tx = defaultPrisma,
): Promise<ConsumeCreditsResult> => {
  assertWithinPerOperation(input.amount);

  const run = async (tx: Tx): Promise<ConsumeCreditsResult> => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { plan: true },
    });
    if (!user) throw errors.notFound('User');

    const initialWallet = await getOrCreateWallet(input.userId, tx);
    const wallet = await resetDailyCounterIfNewDay(initialWallet, tx);

    assertWithinDailyCap({
      amount: input.amount,
      spentToday: wallet.dailySpentToday,
      plan: planSlug(user.plan),
    });

    if (wallet.balance < input.amount) {
      throw errors.insufficientCredits(input.amount, wallet.balance);
    }

    const updated = await tx.userCredits.update({
      where: { userId: input.userId },
      data: {
        balance: { decrement: input.amount },
        lifetimeSpent: { increment: input.amount },
        dailySpentToday: { increment: input.amount },
        dailySpendDate: wallet.dailySpendDate ?? utcDayStart(),
        version: { increment: 1 },
      },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: 'consumption',
        amount: -input.amount,
        balance: updated.balance,
        description: input.description,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? PrismaNS.JsonNull,
      },
    });

    return { balance: updated.balance, transactionId: transaction.id };
  };

  const root = client as PrismaClient;
  if (typeof root.$transaction === 'function') {
    return root.$transaction((tx) => run(tx));
  }
  return run(client);
};

/**
 * `consumeCredits` wrapped in a "best-effort" guard: if the underlying
 * Prisma error isn't a domain `ForgelyError`, surface a generic INTERNAL_ERROR
 * with the original cause so middleware can map it cleanly.
 */
export const consumeCreditsSafe = async (
  input: ConsumeCreditsInput,
  client?: Tx,
): Promise<ConsumeCreditsResult> => {
  try {
    return await consumeCredits(input, client);
  } catch (err) {
    if (err instanceof ForgelyError) throw err;
    throw new ForgelyError(
      'INTERNAL_ERROR',
      'Could not deduct credits. No charge has been made.',
      500,
      { cause: err instanceof Error ? err.message : String(err) },
    );
  }
};

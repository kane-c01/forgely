/**
 * Credit wallet — atomic balance reads and grants.
 *
 * Read paths:
 *   - `getOrCreateWallet(userId)`  — lazy-init for new users
 *   - `getBalance(userId)`         — cheap fast-path
 *   - `listTransactions(userId)`   — ledger pagination
 *
 * Mutating writes:
 *   - `creditWallet(...)`   — purchase / subscription / gift / promotion / refund
 *   - `adjustWallet(...)`   — superadmin-only manual fix (writes 'adjustment' tx)
 *
 * `consume` (debit) and `reserve/commit/release` live in their own files.
 *
 * @owner W3 (T24)
 */

import type { Prisma, PrismaClient } from '@prisma/client';

import { Prisma as PrismaNS, prisma as defaultPrisma } from '../db.js';
import type { CreditTxType, UserCredits } from '../db.js';

import { sameUtcDay, utcDayStart } from './limits.js';

type Tx = PrismaClient | Prisma.TransactionClient;

/** Lazily create the per-user wallet row if it doesn't exist yet. */
export const getOrCreateWallet = async (
  userId: string,
  client: Tx = defaultPrisma,
): Promise<UserCredits> => {
  const existing = await client.userCredits.findUnique({ where: { userId } });
  if (existing) return existing;
  return client.userCredits.create({ data: { userId } });
};

export const getBalance = async (
  userId: string,
  client: Tx = defaultPrisma,
): Promise<{ balance: number; reserved: number }> => {
  const wallet = await getOrCreateWallet(userId, client);
  return { balance: wallet.balance, reserved: wallet.reserved };
};

export interface ListTransactionsArgs {
  userId: string;
  limit?: number;
  /** Pagination cursor — pass the prior page's last `id`. */
  cursor?: string;
  type?: CreditTxType;
}

export const listTransactions = async (
  args: ListTransactionsArgs,
  client: Tx = defaultPrisma,
) => {
  const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
  const rows = await client.creditTransaction.findMany({
    where: {
      userId: args.userId,
      ...(args.type ? { type: args.type } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
  });
  const nextCursor = rows.length > limit ? rows[limit]?.id ?? null : null;
  return { items: rows.slice(0, limit), nextCursor };
};

export interface CreditWalletInput {
  userId: string;
  amount: number;
  type: Extract<
    CreditTxType,
    'purchase' | 'subscription' | 'gift' | 'promotion' | 'refund' | 'adjustment'
  >;
  description: string;
  metadata?: Record<string, unknown>;
  stripeEventId?: string;
  stripeChargeId?: string;
}

/**
 * Add credits to a user's wallet inside a transaction. Ledger row is mandatory.
 * Returns the new balance.
 */
export const creditWallet = async (
  input: CreditWalletInput,
  client: Tx = defaultPrisma,
): Promise<{ balance: number; transactionId: string }> => {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('creditWallet: amount must be a positive integer');
  }

  const run = async (tx: Tx) => {
    const wallet = await getOrCreateWallet(input.userId, tx);
    const updated = await tx.userCredits.update({
      where: { userId: input.userId },
      data: {
        balance: { increment: input.amount },
        lifetimeEarned: { increment: input.amount },
        version: { increment: 1 },
      },
    });
    const transaction = await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        balance: updated.balance,
        description: input.description,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? PrismaNS.JsonNull,
        stripeEventId: input.stripeEventId ?? null,
        stripeChargeId: input.stripeChargeId ?? null,
      },
    });
    void wallet;
    return { balance: updated.balance, transactionId: transaction.id };
  };

  const root = client as PrismaClient;
  if (typeof root.$transaction === 'function') {
    return root.$transaction((tx) => run(tx));
  }
  return run(client);
};

/**
 * Reset the per-day spend counter when crossing midnight UTC. Caller passes
 * the wallet they already loaded inside the active transaction to avoid an
 * extra round-trip.
 */
export const resetDailyCounterIfNewDay = async (
  wallet: UserCredits,
  client: Tx,
  now: Date = new Date(),
): Promise<UserCredits> => {
  if (sameUtcDay(wallet.dailySpendDate, now)) return wallet;
  return client.userCredits.update({
    where: { userId: wallet.userId },
    data: {
      dailySpendDate: utcDayStart(now),
      dailySpentToday: 0,
    },
  });
};

/**
 * Pre-debit reservations for long-running operations (generation pipeline).
 *
 *   reserve(userId, amount)         → balance -= amount, reserved += amount
 *   commit(reservationId)            → reserved -= amount, lifetimeSpent += amount
 *   release(reservationId, reason)   → reserved -= amount, balance += amount + tx
 *
 * Reservation lifecycle: reserved → committed | released | expired.
 * `expireOverdueReservations` is a periodic worker that releases anything
 * stuck past its TTL (default 30 min, see CREDIT_LIMITS).
 *
 * @owner W3 (T24)
 */

import type { Prisma, PrismaClient } from '@prisma/client';

import { Prisma as PrismaNS, prisma as defaultPrisma } from '../db.js';
import type { CreditReservation, CreditReservationState } from '../db.js';
import { ForgelyError, errors } from '../errors.js';

import {
  RESERVATION_TTL_MS,
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

export interface ReserveCreditsInput {
  userId: string;
  amount: number;
  description: string;
  /** Optional override (ms); falls back to RESERVATION_TTL_MS. */
  ttlMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ReservedCredits {
  reservationId: string;
  expiresAt: Date;
  /** Wallet balance AFTER the pre-debit (still spendable for other ops). */
  balance: number;
  /** Total currently held in reserve across all in-flight ops. */
  reserved: number;
}

const txClient = (client: Tx): PrismaClient | null => {
  const root = client as PrismaClient;
  return typeof root.$transaction === 'function' ? root : null;
};

/** Reserve credits before a long-running op begins. Throws on insufficient balance / cap. */
export const reserveCredits = async (
  input: ReserveCreditsInput,
  client: Tx = defaultPrisma,
): Promise<ReservedCredits> => {
  assertWithinPerOperation(input.amount);

  const run = async (tx: Tx): Promise<ReservedCredits> => {
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

    const expiresAt = new Date(Date.now() + (input.ttlMs ?? RESERVATION_TTL_MS));

    const reservation = await tx.creditReservation.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        state: 'reserved',
        description: input.description,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? PrismaNS.JsonNull,
        expiresAt,
      },
    });

    const updated = await tx.userCredits.update({
      where: { userId: input.userId },
      data: {
        balance: { decrement: input.amount },
        reserved: { increment: input.amount },
        version: { increment: 1 },
      },
    });

    return {
      reservationId: reservation.id,
      expiresAt,
      balance: updated.balance,
      reserved: updated.reserved,
    };
  };

  const tx = txClient(client);
  return tx ? tx.$transaction((tx2) => run(tx2)) : run(client);
};

const ALREADY_RESOLVED: ReadonlyArray<CreditReservationState> = [
  'committed',
  'released',
  'expired',
];

const loadReservation = async (
  reservationId: string,
  client: Tx,
): Promise<CreditReservation> => {
  const reservation = await client.creditReservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) {
    throw new ForgelyError(
      'RESERVATION_NOT_FOUND',
      'Reservation not found.',
      404,
      { reservationId },
    );
  }
  return reservation;
};

const assertReservedState = (reservation: CreditReservation) => {
  if (
    ALREADY_RESOLVED.includes(reservation.state as CreditReservationState)
  ) {
    throw new ForgelyError(
      'RESERVATION_ALREADY_RESOLVED',
      'Reservation has already been resolved.',
      409,
      { reservationId: reservation.id, state: reservation.state },
    );
  }
};

/** Finalise a reservation as actually spent. */
export const commitReservation = async (
  reservationId: string,
  client: Tx = defaultPrisma,
): Promise<{ balance: number; reserved: number; transactionId: string }> => {
  const run = async (tx: Tx) => {
    const reservation = await loadReservation(reservationId, tx);
    assertReservedState(reservation);

    const updated = await tx.userCredits.update({
      where: { userId: reservation.userId },
      data: {
        reserved: { decrement: reservation.amount },
        lifetimeSpent: { increment: reservation.amount },
        dailySpentToday: { increment: reservation.amount },
        dailySpendDate:
          (await tx.userCredits.findUnique({ where: { userId: reservation.userId } }))
            ?.dailySpendDate ?? utcDayStart(),
        version: { increment: 1 },
      },
    });

    await tx.creditReservation.update({
      where: { id: reservation.id },
      data: { state: 'committed', resolvedAt: new Date() },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId: reservation.userId,
        type: 'consumption',
        amount: -reservation.amount,
        balance: updated.balance,
        description: reservation.description,
        reservationId: reservation.id,
        metadata: PrismaNS.JsonNull,
      },
    });

    return {
      balance: updated.balance,
      reserved: updated.reserved,
      transactionId: transaction.id,
    };
  };

  const tx = txClient(client);
  return tx ? tx.$transaction((tx2) => run(tx2)) : run(client);
};

/** Release a reservation back to spendable balance (cancellation / failure). */
export const releaseReservation = async (
  reservationId: string,
  reason: string = 'Reservation released',
  client: Tx = defaultPrisma,
): Promise<{ balance: number; reserved: number; transactionId: string }> => {
  const run = async (tx: Tx) => {
    const reservation = await loadReservation(reservationId, tx);
    assertReservedState(reservation);

    const updated = await tx.userCredits.update({
      where: { userId: reservation.userId },
      data: {
        balance: { increment: reservation.amount },
        reserved: { decrement: reservation.amount },
        version: { increment: 1 },
      },
    });

    await tx.creditReservation.update({
      where: { id: reservation.id },
      data: { state: 'released', resolvedAt: new Date() },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId: reservation.userId,
        type: 'reservation_release',
        amount: 0,
        balance: updated.balance,
        description: reason,
        reservationId: reservation.id,
        metadata: PrismaNS.JsonNull,
      },
    });

    return {
      balance: updated.balance,
      reserved: updated.reserved,
      transactionId: transaction.id,
    };
  };

  const tx = txClient(client);
  return tx ? tx.$transaction((tx2) => run(tx2)) : run(client);
};

/**
 * Run an async operation under a credit reservation. On success the
 * reservation is committed (credits truly spent); on throw it's released and
 * the original error is rethrown.
 */
export const runWithReservation = async <T>(
  reserve: ReserveCreditsInput,
  fn: (reservation: ReservedCredits) => Promise<T>,
  client: Tx = defaultPrisma,
): Promise<T> => {
  const reservation = await reserveCredits(reserve, client);
  try {
    const result = await fn(reservation);
    await commitReservation(reservation.reservationId, client);
    return result;
  } catch (err) {
    await releaseReservation(
      reservation.reservationId,
      err instanceof Error ? err.message.slice(0, 256) : 'Operation failed',
      client,
    ).catch(() => undefined);
    throw err;
  }
};

/** Cron-friendly cleanup. Returns count of reservations released. */
export const expireOverdueReservations = async (
  client: Tx = defaultPrisma,
): Promise<number> => {
  const overdue = await client.creditReservation.findMany({
    where: { state: 'reserved', expiresAt: { lte: new Date() } },
    select: { id: true },
    take: 200,
  });
  let released = 0;
  for (const row of overdue) {
    try {
      await releaseReservation(row.id, 'Reservation expired', client);
      released += 1;
    } catch {
      /* swallow — race with concurrent commit/release */
    }
  }
  return released;
};

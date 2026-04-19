/**
 * Audit-log helpers, scoped to auth events for now. T26 (super-admin)
 * will broaden these into a generic `audit.record(…)`.
 *
 * @owner W3 (T06)
 */

import { Prisma, prisma } from '../db.js';
import type { LoginOutcome } from '../db.js';

export interface LoginEventInput {
  userId?: string | null;
  email: string;
  outcome: LoginOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const recordLoginEvent = async (
  input: LoginEventInput,
): Promise<void> => {
  await prisma.loginEvent
    .create({
      data: {
        userId: input.userId ?? null,
        email: input.email.toLowerCase(),
        outcome: input.outcome,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
    .catch(() => undefined);
};

export interface AuthAuditInput {
  actorId: string;
  action:
    | 'auth.signup'
    | 'auth.signin'
    | 'auth.signout'
    | 'auth.signout_all'
    | 'auth.password_reset_request'
    | 'auth.password_reset_complete'
    | 'auth.email_verified';
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const toJsonInput = (
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =>
  value === undefined || value === null
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);

export const recordAuthAudit = async (input: AuthAuditInput): Promise<void> => {
  await prisma.auditLog
    .create({
      data: {
        actorType: 'user',
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType ?? 'user',
        targetId: input.targetId ?? input.actorId,
        before: toJsonInput(input.before),
        after: toJsonInput(input.after),
        reason: input.reason ?? null,
        ipAddress: input.ipAddress ?? '',
        userAgent: input.userAgent ?? '',
      },
    })
    .catch(() => undefined);
};

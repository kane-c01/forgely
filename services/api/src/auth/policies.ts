/**
 * RBAC policy helpers.
 *
 * The policy surface is intentionally tiny — three guard functions used
 * by both tRPC middleware and any standalone handler:
 *
 *   - `requireUser(ctx)`            → asserts a signed-in user
 *   - `requireRole(ctx, ...roles)`  → asserts one of the listed roles
 *   - `requireSuperAdmin(ctx)`      → super_admin only
 *
 * @owner W3 (T06)
 */

import type { User } from '@prisma/client';

import { errors } from '../errors.js';
import type { UserRole } from '../db.js';

export interface AuthLikeContext {
  user: User | null;
  session: { id: string; userId: string } | null;
}

export const isAuthenticated = (ctx: AuthLikeContext): ctx is AuthLikeContext & { user: User } =>
  ctx.user !== null && ctx.session !== null;

export const requireUser = (ctx: AuthLikeContext): User => {
  if (!isAuthenticated(ctx)) {
    throw errors.unauthorized();
  }
  return ctx.user;
};

export const requireRole = (
  ctx: AuthLikeContext,
  ...allowed: UserRole[]
): User => {
  const user = requireUser(ctx);
  const role = user.role as UserRole;
  if (!allowed.includes(role)) {
    throw errors.forbidden();
  }
  return user;
};

export const requireSuperAdmin = (ctx: AuthLikeContext): User =>
  requireRole(ctx, 'super_admin');

export const isSuperAdmin = (user: Pick<User, 'role'> | null | undefined): boolean =>
  user?.role === 'super_admin';

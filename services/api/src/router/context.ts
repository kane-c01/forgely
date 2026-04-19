/**
 * tRPC request context.
 *
 * Resolves the caller from either the opaque session cookie OR a Bearer
 * JWT (in that order — the cookie wins because it can be revoked instantly).
 *
 * Usage from apps/app (Next.js Route Handler):
 *
 *   import { createContext } from '@forgely/api/router';
 *   const handler = (req: Request) =>
 *     fetchRequestHandler({
 *       endpoint: '/api/trpc',
 *       req,
 *       router: appRouter,
 *       createContext: () => createContext({ req }),
 *     });
 *
 * @owner W3 (T06)
 */

import type { User } from '@prisma/client';

import { validateSession, verifyJwt } from '../auth/index.js';
import { prisma } from '../db.js';

export interface CreateContextOptions {
  req?: Request;
  /** Optional: NextAuth integration may pass an already-resolved session. */
  preauthorizedUserId?: string;
}

export interface AuthContext {
  user: User | null;
  session: { id: string; userId: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  prisma: typeof prisma;
}

const COOKIE_NAME = 'forgely_session';

const parseCookies = (header: string | null | undefined): Map<string, string> => {
  const map = new Map<string, string>();
  if (!header) return map;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) map.set(key, decodeURIComponent(value));
  }
  return map;
};

const extractIp = (req?: Request): string | null => {
  if (!req) return null;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return req.headers.get('x-real-ip') ?? null;
};

export const createContext = async (
  options: CreateContextOptions = {},
): Promise<AuthContext> => {
  const req = options.req;
  const ipAddress = extractIp(req);
  const userAgent = req?.headers.get('user-agent') ?? null;

  let user: User | null = null;
  let session: AuthContext['session'] = null;

  if (options.preauthorizedUserId) {
    user = await prisma.user.findUnique({ where: { id: options.preauthorizedUserId } });
    if (user) {
      session = { id: 'preauthorized', userId: user.id };
    }
  } else if (req) {
    const cookies = parseCookies(req.headers.get('cookie'));
    const sessionToken = cookies.get(COOKIE_NAME);

    if (sessionToken) {
      const result = await validateSession(sessionToken);
      if (result) {
        user = result.user;
        session = result.session;
      }
    }

    if (!user) {
      const auth = req.headers.get('authorization');
      if (auth?.toLowerCase().startsWith('bearer ')) {
        const token = auth.slice(7).trim();
        try {
          const payload = await verifyJwt(token);
          const fetched = await prisma.user.findUnique({ where: { id: payload.sub } });
          if (fetched && !fetched.deletedAt) {
            user = fetched;
            session = { id: payload.sid, userId: fetched.id };
          }
        } catch {
          /* ignored — anonymous request */
        }
      }
    }
  }

  return {
    user,
    session,
    ipAddress,
    userAgent,
    prisma,
  };
};

export const SESSION_COOKIE_NAME = COOKIE_NAME;

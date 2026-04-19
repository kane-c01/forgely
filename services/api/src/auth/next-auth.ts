/**
 * Auth.js v5 (NextAuth) wiring helpers — designed to keep apps/app's
 * `app/api/auth/[...nextauth]/route.ts` to ~10 lines.
 *
 * apps/app usage:
 *
 * ```ts
 * // apps/app/lib/auth.ts
 * import NextAuth from 'next-auth';
 * import { buildNextAuthConfig } from '@forgely/api/auth';
 *
 * export const { handlers, auth, signIn, signOut } = NextAuth(
 *   buildNextAuthConfig(),
 * );
 * ```
 *
 * The Prisma adapter is hand-rolled (no `@auth/prisma-adapter`) so we
 * avoid forcing a peer-dep clash in this MVP — the surface area we need
 * (User / Account / Session / VerificationToken) is small.
 *
 * @owner W3 (T06 follow-up for W6)
 */

import type { NextAuthConfig, User as NextAuthUser } from 'next-auth'
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from '@auth/core/adapters'

import { prisma } from '../db.js'

import { signinWithPassword } from './login.js'
import { recordAudit } from './audit.js'

/**
 * Hand-rolled Auth.js Prisma Adapter (subset).
 * Implements only the methods actually called during the
 * "Credentials + Google OAuth + email magic link" subset Forgely uses.
 */
export const prismaAdapter = (): Adapter => {
  const toAdapterUser = (user: {
    id: string
    email: string
    emailVerifiedAt: Date | null
    name: string | null
    avatarUrl: string | null
  }): AdapterUser => ({
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt,
    name: user.name,
    image: user.avatarUrl,
  })

  return {
    async createUser(data) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name ?? null,
          avatarUrl: data.image ?? null,
          emailVerifiedAt: data.emailVerified ?? null,
          credits: { create: { balance: 500, lifetimeEarned: 500 } },
        },
      })
      return toAdapterUser(user)
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } })
      return user ? toAdapterUser(user) : null
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      return user ? toAdapterUser(user) : null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      })
      return account ? toAdapterUser(account.user) : null
    },

    async updateUser(data) {
      const updated = await prisma.user.update({
        where: { id: data.id! },
        data: {
          email: data.email ?? undefined,
          name: data.name ?? undefined,
          avatarUrl: data.image ?? undefined,
          emailVerifiedAt: data.emailVerified ?? undefined,
        },
      })
      return toAdapterUser(updated)
    },

    async deleteUser(id) {
      await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
    },

    async linkAccount(data) {
      const created = await prisma.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token ?? null,
          access_token: data.access_token ?? null,
          expires_at: data.expires_at ?? null,
          token_type: data.token_type ?? null,
          scope: data.scope ?? null,
          id_token: data.id_token ?? null,
          session_state: typeof data.session_state === 'string' ? data.session_state : null,
        },
      })
      return created as unknown as AdapterAccount
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      })
    },

    async createSession(data) {
      const created = await prisma.session.create({
        data: {
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires,
        },
      })
      return {
        sessionToken: created.sessionToken,
        userId: created.userId,
        expires: created.expires,
      } satisfies AdapterSession
    },

    async getSessionAndUser(sessionToken) {
      const row = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })
      if (!row) return null
      return {
        session: {
          sessionToken: row.sessionToken,
          userId: row.userId,
          expires: row.expires,
        } satisfies AdapterSession,
        user: toAdapterUser(row.user),
      }
    },

    async updateSession({ sessionToken, expires }) {
      const row = await prisma.session.update({
        where: { sessionToken },
        data: { expires: expires ?? undefined },
      })
      return {
        sessionToken: row.sessionToken,
        userId: row.userId,
        expires: row.expires,
      } satisfies AdapterSession
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({ where: { sessionToken } }).catch(() => undefined)
    },

    async createVerificationToken(data) {
      return prisma.verificationToken.create({ data })
    },

    async useVerificationToken({ identifier, token }) {
      try {
        return await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        })
      } catch {
        return null
      }
    },
  }
}

export interface BuildNextAuthConfigOptions {
  /** Override the default Credentials provider id (defaults to 'credentials'). */
  credentialsId?: string
  /** Provide additional providers (Google, Github, …) — caller supplies them. */
  extraProviders?: NextAuthConfig['providers']
  /** Custom callback hooks merged on top of the defaults. */
  callbacks?: NextAuthConfig['callbacks']
}

/**
 * Build a ready-to-use Auth.js v5 config: Prisma adapter + Email/Password
 * Credentials provider that delegates to `signinWithPassword`. The caller
 * passes `extraProviders` for OAuth (Google, etc.) so we don't impose the
 * peer dep here.
 */
export const buildNextAuthConfig = (options: BuildNextAuthConfigOptions = {}): NextAuthConfig => {
  // We avoid statically importing 'next-auth/providers/credentials' so this
  // package stays usable from non-Next contexts (workers, scripts, tests).
  // The provider object's shape is well-known and stable across Auth.js v5.
  const credentialsProvider = {
    id: options.credentialsId ?? 'credentials',
    name: 'Email + Password',
    type: 'credentials' as const,
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(raw: Record<string, unknown> | undefined): Promise<NextAuthUser | null> {
      const email = String(raw?.email ?? '')
        .trim()
        .toLowerCase()
      const password = String(raw?.password ?? '')
      if (!email || !password) return null
      try {
        const result = await signinWithPassword({ email, password })
        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name ?? undefined,
          image: result.user.avatarUrl ?? undefined,
        }
      } catch {
        // Authorize must return null on failure — never throw to the user.
        return null
      }
    },
  }

  return {
    adapter: prismaAdapter(),
    session: { strategy: 'jwt' },
    secret: process.env.AUTH_SECRET,
    providers: [credentialsProvider, ...(options.extraProviders ?? [])],
    pages: {
      signIn: '/login',
      newUser: '/welcome',
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) token.userId = user.id
        return token
      },
      async session({ session, token }) {
        if (token.userId) {
          ;(session.user as { id?: string }).id = token.userId as string
        }
        return session
      },
      ...options.callbacks,
    },
    events: {
      async signIn({ user }) {
        if (user.id) {
          await recordAudit({
            actorId: user.id,
            action: 'auth.signin',
            actorType: 'user',
            reason: 'NextAuth session created',
          })
        }
      },
    },
  }
}

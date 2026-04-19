/**
 * Forgely apps/app — tRPC client.
 *
 * Two helpers ship from this file:
 *
 *   - `trpc` — a typed React Query–powered client (`trpc.sites.list.useQuery({})`)
 *     used inside React components.
 *   - `vanillaTrpc` — a plain (non-React) client useful from server
 *     components or one-off scripts.
 *
 * The actual handler that responds to these calls is mounted at
 * `app/api/trpc/[trpc]/route.ts` (see file in same package).
 *
 * @see services/api/src/router/index.ts → `appRouter`
 */
import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query'
import {
  createTRPCProxyClient,
  httpBatchLink,
  type CreateTRPCProxyClient,
  type TRPCLink,
} from '@trpc/client'
import type { AnyRouter } from '@trpc/server'
import superjson from 'superjson'
import type { AppRouter } from '@forgely/api/router'

// Explicit annotation is required because the inferred type reaches
// into private @trpc declarations that don't survive `declaration: true`.
export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return `http://localhost:${process.env.PORT ?? 3001}`
}

export const trpcLinks: TRPCLink<AnyRouter>[] = [
  httpBatchLink({
    url: `${getBaseUrl()}/api/trpc`,
    fetch(url, options) {
      return fetch(url, { ...options, credentials: 'include' })
    },
  }),
]

/** Vanilla (non-React) tRPC proxy — for server components or scripts. */
export const vanillaTrpc: CreateTRPCProxyClient<AppRouter> = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: trpcLinks,
})

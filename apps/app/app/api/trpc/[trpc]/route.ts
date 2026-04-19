/**
 * tRPC HTTP route handler — exposes the full @forgely/api appRouter.
 *
 * Cookie-based session resolution: reads `forgely_session` cookie via
 * `createContext` (services/api). The handler runs on Node.js because
 * Prisma + argon2 + Anthropic SDK aren't Edge-compatible.
 *
 * @owner W1 — login UX wiring
 */
import { createContext } from '@forgely/api/router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@forgely/api/router'

export const runtime = 'nodejs'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError: ({ path, error }) => {
      console.error(`[trpc] ${path ?? '<no-path>'}: ${error.message}`)
    },
  })

export { handler as GET, handler as POST }

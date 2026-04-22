/**
 * Public surface of `@forgely/api/router`.
 *
 * apps/app mounts this exact `appRouter` from `app/api/trpc/[trpc]/route.ts`.
 * Routers added in later Tasks (sites/products/orders/...) plug in below
 * without any other apps having to know about them.
 *
 * @owner W3 (T06)
 */

import {
  brandKitsRouter,
  cmsRouter,
  copilotRouter,
  customersRouter,
  generationRouter,
  mediaRouter,
  ordersRouter,
  productsRouter,
  sitesRouter,
} from '../routers/index.js'
import { superRouter } from '../routers/super/index.js'
import { authRouter } from './auth.js'
import { billingRouter } from './billing.js'
import { cnAuthRouter } from './cn-auth.js'
import { complianceRouter } from './compliance.js'
import { conversationRouter } from './conversation.js'
import { copilotOpsRouter } from './copilot-ops.js'
import { creditsRouter } from './credits.js'
import { seoRouter } from './seo.js'
import { router } from './trpc.js'

/**
 * Root tRPC router — mounted under `/api/trpc/[trpc]` in apps/app.
 *
 * Top-level namespaces are intentionally split between the platform-wide
 * concerns (auth, billing, credits, …) which live in `src/router/` and
 * tenant-scoped surfaces (sites, products, orders, …) which live in
 * `src/routers/`. We export them all from one router so apps/app can do:
 *
 *   trpc.sites.list, trpc.copilot.chat, trpc.conversation.start, …
 */
export const appRouter = router({
  // Platform / cross-tenant
  auth: authRouter,
  cnAuth: cnAuthRouter,
  conversation: conversationRouter,
  credits: creditsRouter,
  billing: billingRouter,
  compliance: complianceRouter,
  seo: seoRouter,
  // Tenant-scoped (W3 routers/*)
  sites: sitesRouter,
  products: productsRouter,
  orders: ordersRouter,
  customers: customersRouter,
  media: mediaRouter,
  brandKits: brandKitsRouter,
  cms: cmsRouter,
  generation: generationRouter,
  copilot: copilotRouter,
  copilotOps: copilotOpsRouter,
  // Super-admin / platform ops — RBAC re-enforced per procedure.
  super: superRouter,
})

export { appRouter as default }

export type AppRouter = typeof appRouter

export { publicProcedure, protectedProcedure, superAdminProcedure, router, trpc } from './trpc.js'

export { createContext, SESSION_COOKIE_NAME } from './context.js'
export type { AuthContext, CreateContextOptions } from './context.js'

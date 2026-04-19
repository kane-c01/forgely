/**
 * Public surface of `@forgely/api/router`.
 *
 * apps/app mounts this exact `appRouter` from `app/api/trpc/[trpc]/route.ts`.
 * Routers added in later Tasks (sites/products/orders/...) plug in below
 * without any other apps having to know about them.
 *
 * @owner W3 (T06)
 */

import { authRouter } from './auth.js';
import { billingRouter } from './billing.js';
import { creditsRouter } from './credits.js';
import { router } from './trpc.js';

export const appRouter = router({
  auth: authRouter,
  credits: creditsRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;

export {
  publicProcedure,
  protectedProcedure,
  superAdminProcedure,
  router,
  trpc,
} from './trpc.js';

export { createContext, SESSION_COOKIE_NAME } from './context.js';
export type { AuthContext, CreateContextOptions } from './context.js';

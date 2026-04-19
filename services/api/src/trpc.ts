/**
 * Compatibility re-export of the tRPC primitives so all routers in
 * `src/routers/**` (including W7's `routers/super`) can `import { router,
 * publicProcedure, protectedProcedure, superAdminProcedure } from '../../trpc'`
 * without caring about the actual file layout.
 *
 * The real implementation lives in `src/router/trpc.ts` (T06).
 *
 * @owner W3
 */

export {
  router,
  trpc,
  publicProcedure,
  protectedProcedure,
  superAdminProcedure,
} from './router/trpc.js'

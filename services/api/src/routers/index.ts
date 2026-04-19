/**
 * Aggregator for every tenant-scoped tRPC router under `src/routers/**`.
 *
 * The root `appRouter` lives in `src/router/index.ts` (T06) — it imports
 * this `tenantRouters` map and merges it with the auth / billing / credits
 * surfaces. Keeping the W3-owned routers grouped here keeps churn
 * localised when W6 / W7 add new top-level namespaces.
 *
 * @owner W3
 */

import { router } from '../router/trpc.js'

import { brandKitsRouter } from './brand-kits.js'
import { cmsRouter } from './cms.js'
import { customersRouter } from './customers.js'
import { generationRouter } from './generation.js'
import { mediaRouter } from './media.js'
import { ordersRouter } from './orders.js'
import { productsRouter } from './products.js'
import { sitesRouter } from './sites.js'

export const tenantRouters = router({
  sites: sitesRouter,
  products: productsRouter,
  orders: ordersRouter,
  customers: customersRouter,
  media: mediaRouter,
  brandKits: brandKitsRouter,
  cms: cmsRouter,
  generation: generationRouter,
})

export type TenantRouters = typeof tenantRouters

export {
  brandKitsRouter,
  cmsRouter,
  customersRouter,
  generationRouter,
  mediaRouter,
  ordersRouter,
  productsRouter,
  sitesRouter,
}

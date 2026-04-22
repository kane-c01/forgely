/**
 * Thin abstraction over the Medusa v2 SDK so MVP routers can compile and
 * test without a running Medusa backend.
 *
 * The real implementation lands when the Medusa service is wired in.
 * Until then this stub exposes deterministic shapes so apps/app + storefront
 * can render UI states.
 *
 * @owner W3 (backend API for T18/T19, W6)
 */

export interface MedusaProductSummary {
  id: string
  title: string
  handle: string
  status: 'draft' | 'published'
  thumbnail: string | null
  variantsCount: number
  inventoryQuantity: number
  priceUsd: number
  updatedAt: Date
}

export interface MedusaOrderSummary {
  id: string
  displayId: number
  email: string
  totalUsd: number
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  fulfillmentStatus: 'not_fulfilled' | 'fulfilled' | 'shipped' | 'delivered'
  paymentStatus: 'awaiting' | 'captured' | 'refunded'
  createdAt: Date
}

export interface MedusaCustomerSummary {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  ordersCount: number
  lifetimeValueUsd: number
  createdAt: Date
}

export interface MedusaList<T> {
  items: T[]
  total: number
  nextCursor: string | null
}

const TODO_PRODUCT: MedusaProductSummary = {
  id: 'prod_pending_medusa',
  title: '— Medusa adapter not yet wired —',
  handle: 'pending',
  status: 'draft',
  thumbnail: null,
  variantsCount: 0,
  inventoryQuantity: 0,
  priceUsd: 0,
  updatedAt: new Date(),
}

/**
 * In-memory overrides keyed by product id so that `updateProduct` — invoked
 * by the Copilot `update_product` runner — can be observed by subsequent
 * `getProduct` calls in the same server process. Keeps the demo-loop honest
 * without a real Medusa backend.
 */
const productOverrides = new Map<string, Partial<MedusaProductSummary>>()

const TODO_ORDER: MedusaOrderSummary = {
  id: 'order_pending_medusa',
  displayId: 0,
  email: 'demo@forgely.app',
  totalUsd: 0,
  status: 'pending',
  fulfillmentStatus: 'not_fulfilled',
  paymentStatus: 'awaiting',
  createdAt: new Date(),
}

const TODO_CUSTOMER: MedusaCustomerSummary = {
  id: 'cus_pending_medusa',
  email: 'demo@forgely.app',
  firstName: null,
  lastName: null,
  ordersCount: 0,
  lifetimeValueUsd: 0,
  createdAt: new Date(),
}

interface QueryArgs {
  salesChannelId: string
  limit: number
  cursor?: string
  search?: string
}

const empty = <T>(): MedusaList<T> => ({ items: [], total: 0, nextCursor: null })

/**
 * MVP-time stub: returns one synthetic row so the dashboard can render an
 * "empty state" that's clearly labelled as pending integration.
 */
export const medusa = {
  async listProducts(args: QueryArgs): Promise<MedusaList<MedusaProductSummary>> {
    if (!args.salesChannelId) return empty()
    return {
      items: [TODO_PRODUCT],
      total: 1,
      nextCursor: null,
    }
  },

  async listOrders(args: QueryArgs): Promise<MedusaList<MedusaOrderSummary>> {
    if (!args.salesChannelId) return empty()
    return {
      items: [TODO_ORDER],
      total: 1,
      nextCursor: null,
    }
  },

  async listCustomers(args: QueryArgs): Promise<MedusaList<MedusaCustomerSummary>> {
    if (!args.salesChannelId) return empty()
    return {
      items: [TODO_CUSTOMER],
      total: 1,
      nextCursor: null,
    }
  },

  async getProduct(id: string): Promise<MedusaProductSummary | null> {
    const base = { ...TODO_PRODUCT, id }
    const override = productOverrides.get(id)
    return override ? { ...base, ...override, updatedAt: new Date() } : base
  },

  async getOrder(_id: string): Promise<MedusaOrderSummary | null> {
    return TODO_ORDER
  },

  async getCustomer(_id: string): Promise<MedusaCustomerSummary | null> {
    return TODO_CUSTOMER
  },

  async refundOrder(
    orderId: string,
    amountUsd: number,
  ): Promise<{ orderId: string; refundedUsd: number }> {
    return { orderId, refundedUsd: amountUsd }
  },

  /**
   * Merge `patch` into the in-memory override for `id`. Returns the
   * effective product snapshot so callers can echo it back to the UI.
   *
   * This is a stub of the Medusa v2 `product.update` workflow; when the
   * real Medusa adapter lands the body of this method swaps for a
   * `sdk.admin.product.update(id, patch)` call.
   */
  async updateProduct(
    id: string,
    patch: Partial<MedusaProductSummary>,
  ): Promise<MedusaProductSummary> {
    const prev = productOverrides.get(id) ?? {}
    const next = { ...prev, ...patch }
    productOverrides.set(id, next)
    return { ...TODO_PRODUCT, id, ...next, updatedAt: new Date() }
  },
}

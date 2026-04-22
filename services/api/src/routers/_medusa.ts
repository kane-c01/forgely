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

  async getProduct(_id: string): Promise<MedusaProductSummary | null> {
    return TODO_PRODUCT
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

  /** W5 Copilot `update_product` 支持：改 title / handle / price / status 等。 */
  async updateProduct(
    productId: string,
    patch: Record<string, unknown>,
  ): Promise<{ productId: string; patchedFields: string[] }> {
    return {
      productId,
      patchedFields: Object.keys(patch),
    }
  },

  /** W5 Copilot `mark_fulfilled` 支持。 */
  async fulfillOrder(orderId: string): Promise<{ orderId: string; fulfillmentStatus: string }> {
    return { orderId, fulfillmentStatus: 'fulfilled' }
  },

  /** W5 Copilot `tag_customer` 支持。 */
  async tagCustomer(
    customerId: string,
    tags: string[],
  ): Promise<{ customerId: string; tags: string[] }> {
    return { customerId, tags }
  },

  /** W5 Copilot `send_customer_message`。 */
  async sendCustomerMessage(
    customerId: string,
    _body: string,
  ): Promise<{ customerId: string; messageId: string }> {
    return { customerId, messageId: `msg_${Date.now()}` }
  },
}

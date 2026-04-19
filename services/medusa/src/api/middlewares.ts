import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from '@medusajs/framework/http'

/**
 * Multi-tenant middleware: injects `sales_channel_id` into the request
 * based on the `x-forgely-tenant` header or query param.
 *
 * All store API calls MUST include a tenant identifier to scope data.
 */
function tenantIsolation(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const salesChannelId =
    (req.headers['x-forgely-sales-channel'] as string) ?? (req.query.sales_channel_id as string)

  if (salesChannelId) {
    ;(req as unknown as Record<string, unknown>).forgelySalesChannelId = salesChannelId
    req.filterableFields = {
      ...(req.filterableFields ?? {}),
      sales_channel_id: salesChannelId,
    } as typeof req.filterableFields
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: '/store/*',
      middlewares: [tenantIsolation],
    },
  ],
})

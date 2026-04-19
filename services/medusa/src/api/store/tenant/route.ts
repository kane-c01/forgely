import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

/**
 * GET /store/tenant
 *
 * Returns the current tenant context based on the x-forgely-sales-channel header.
 * Used by the storefront to verify which tenant it's scoped to.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const salesChannelId = (req as unknown as Record<string, unknown>).forgelySalesChannelId as
    | string
    | undefined

  if (!salesChannelId) {
    return res.status(400).json({
      error: 'Missing x-forgely-sales-channel header',
    })
  }

  const tenantModule = req.scope.resolve('forgelyTenantModuleService') as {
    findBySalesChannel: (id: string) => Promise<unknown>
  }

  const tenant = await tenantModule.findBySalesChannel(salesChannelId)

  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found for the given sales channel',
    })
  }

  return res.json({ tenant })
}

import { MedusaService } from '@medusajs/framework/utils'
import { ForgelyAsset } from './models/forgely-asset'

class ForgelyAssetModuleService extends MedusaService({
  ForgelyAsset,
}) {
  async listByTenant(tenantId: string, type?: string) {
    const filters: Record<string, unknown> = { tenant_id: tenantId }
    if (type) filters.type = type
    return this.listForgelyAssets(filters)
  }

  async listBySite(siteId: string, type?: string) {
    const filters: Record<string, unknown> = { site_id: siteId }
    if (type) filters.type = type
    return this.listForgelyAssets(filters)
  }
}

export default ForgelyAssetModuleService

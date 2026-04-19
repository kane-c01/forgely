import { MedusaService } from '@medusajs/framework/utils'
import { ForgelyTenant } from './models/forgely-tenant'

type ForgelyTenantDTO = {
  id: string
  forgely_user_id: string
  sales_channel_id: string
  plan: string
  credits_balance: number
  credits_monthly: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string
  custom_domain: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

class ForgelyTenantModuleService extends MedusaService({
  ForgelyTenant,
}) {
  async findByUserId(forgelyUserId: string): Promise<ForgelyTenantDTO | null> {
    const [tenant] = await this.listForgelyTenants({
      forgely_user_id: forgelyUserId,
    })
    return (tenant as ForgelyTenantDTO) ?? null
  }

  async findBySalesChannel(salesChannelId: string): Promise<ForgelyTenantDTO | null> {
    const [tenant] = await this.listForgelyTenants({
      sales_channel_id: salesChannelId,
    })
    return (tenant as ForgelyTenantDTO) ?? null
  }

  async deductCredits(tenantId: string, amount: number): Promise<ForgelyTenantDTO> {
    const tenant = await this.retrieveForgelyTenant(tenantId)
    const current = (tenant as ForgelyTenantDTO).credits_balance
    if (current < amount) {
      throw new Error(`Insufficient credits: have ${current}, need ${amount}`)
    }
    const updated = await this.updateForgelyTenants({
      id: tenantId,
      credits_balance: current - amount,
    })
    return updated as unknown as ForgelyTenantDTO
  }

  async addCredits(tenantId: string, amount: number): Promise<ForgelyTenantDTO> {
    const tenant = await this.retrieveForgelyTenant(tenantId)
    const current = (tenant as ForgelyTenantDTO).credits_balance
    const updated = await this.updateForgelyTenants({
      id: tenantId,
      credits_balance: current + amount,
    })
    return updated as unknown as ForgelyTenantDTO
  }
}

export default ForgelyTenantModuleService

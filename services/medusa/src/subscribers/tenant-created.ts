import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

/**
 * When a Forgely user is provisioned (via core API), this subscriber
 * automatically creates a corresponding Medusa Sales Channel for tenant isolation.
 *
 * The core API should emit `forgely.tenant.created` with { tenant_id, user_id, name }.
 */
export default async function tenantCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ tenant_id: string; user_id: string; name: string }>) {
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const data = event.data

  const salesChannel = await salesChannelService.createSalesChannels({
    name: `Forgely Tenant: ${data.name}`,
    description: `Auto-created sales channel for Forgely user ${data.user_id}`,
    is_disabled: false,
  })

  const tenantModule = container.resolve('forgelyTenantModuleService') as {
    updateForgelyTenants: (data: Record<string, unknown>) => Promise<unknown>
  }

  await tenantModule.updateForgelyTenants({
    id: data.tenant_id,
    sales_channel_id: salesChannel.id,
  })
}

export const config: SubscriberConfig = {
  event: 'forgely.tenant.created',
}

import { Module } from '@medusajs/framework/utils'
import ForgelyTenantModuleService from './service'

export const FORGELY_TENANT_MODULE = 'forgelyTenantModuleService'

export default Module(FORGELY_TENANT_MODULE, {
  service: ForgelyTenantModuleService,
})

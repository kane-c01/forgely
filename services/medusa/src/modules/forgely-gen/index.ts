import { Module } from '@medusajs/framework/utils'
import ForgelyGenModuleService from './service'

export const FORGELY_GEN_MODULE = 'forgelyGenModuleService'

export default Module(FORGELY_GEN_MODULE, {
  service: ForgelyGenModuleService,
})

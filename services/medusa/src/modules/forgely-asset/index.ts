import { Module } from '@medusajs/framework/utils'
import ForgelyAssetModuleService from './service'

export const FORGELY_ASSET_MODULE = 'forgelyAssetModuleService'

export default Module(FORGELY_ASSET_MODULE, {
  service: ForgelyAssetModuleService,
})

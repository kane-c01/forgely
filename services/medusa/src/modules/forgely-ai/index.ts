import { Module } from '@medusajs/framework/utils'
import ForgelyAiModuleService from './service'

export const FORGELY_AI_MODULE = 'forgelyAiModuleService'

export default Module(FORGELY_AI_MODULE, {
  service: ForgelyAiModuleService,
})

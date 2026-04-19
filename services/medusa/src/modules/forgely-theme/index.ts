import { Module } from '@medusajs/framework/utils'
import ForgelyThemeModuleService from './service'

export const FORGELY_THEME_MODULE = 'forgelyThemeModuleService'

export default Module(FORGELY_THEME_MODULE, {
  service: ForgelyThemeModuleService,
})

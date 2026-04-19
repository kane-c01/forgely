import { MedusaService } from '@medusajs/framework/utils'
import { ForgelyTheme, ForgelyThemeVersion } from './models/forgely-theme'

class ForgelyThemeModuleService extends MedusaService({
  ForgelyTheme,
  ForgelyThemeVersion,
}) {
  async getActiveTheme(siteId: string) {
    const [theme] = await this.listForgelyThemes({
      site_id: siteId,
      published: true,
    })
    return theme ?? null
  }

  async publishVersion(themeId: string, dsl: Record<string, unknown>, changeSummary?: string) {
    const theme = (await this.retrieveForgelyTheme(themeId)) as { version: number }
    const nextVersion = theme.version + 1

    await this.createForgelyThemeVersions({
      theme_id: themeId,
      version: nextVersion,
      dsl,
      change_summary: changeSummary ?? null,
    })

    await this.updateForgelyThemes({
      id: themeId,
      version: nextVersion,
      dsl,
      published: true,
      published_at: new Date(),
    })

    return this.retrieveForgelyTheme(themeId)
  }
}

export default ForgelyThemeModuleService

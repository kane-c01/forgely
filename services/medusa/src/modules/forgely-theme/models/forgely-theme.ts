import { model } from '@medusajs/framework/utils'

export const ForgelyTheme = model.define('forgely_theme', {
  id: model.id().primaryKey(),
  tenant_id: model.text().index('idx_theme_tenant'),
  site_id: model.text().index('idx_theme_site'),
  version: model.number().default(1),
  visual_dna_id: model.text().nullable(),
  product_moment_id: model.text().nullable(),
  dsl: model.json(),
  published: model.boolean().default(false),
  published_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

export const ForgelyThemeVersion = model.define('forgely_theme_version', {
  id: model.id().primaryKey(),
  theme_id: model.text().index('idx_themeversion_theme'),
  version: model.number(),
  dsl: model.json(),
  change_summary: model.text().nullable(),
  created_by: model.text().nullable(),
  metadata: model.json().nullable(),
})

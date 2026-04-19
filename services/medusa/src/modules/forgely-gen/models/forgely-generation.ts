import { model } from '@medusajs/framework/utils'

export const ForgelyGeneration = model.define('forgely_generation', {
  id: model.id().primaryKey(),
  tenant_id: model.text().index('idx_gen_tenant'),
  site_id: model.text().nullable().index('idx_gen_site'),
  status: model
    .enum([
      'queued',
      'analyzing',
      'directing',
      'planning',
      'generating_assets',
      'compiling',
      'deploying',
      'completed',
      'failed',
      'cancelled',
    ])
    .default('queued'),
  source_url: model.text().nullable(),
  source_description: model.text().nullable(),
  visual_dna_id: model.text().nullable(),
  product_moment_id: model.text().nullable(),
  credits_consumed: model.number().default(0),
  error_message: model.text().nullable(),
  started_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

export const ForgelyGenerationStep = model.define('forgely_generation_step', {
  id: model.id().primaryKey(),
  generation_id: model.text().index('idx_genstep_gen'),
  step_index: model.number(),
  agent_name: model.text(),
  status: model.enum(['pending', 'running', 'completed', 'failed', 'skipped']).default('pending'),
  credits_consumed: model.number().default(0),
  input_snapshot: model.json().nullable(),
  output_snapshot: model.json().nullable(),
  error_message: model.text().nullable(),
  started_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
})

import { model } from '@medusajs/framework/utils'

export const ForgelyAiConversation = model.define('forgely_ai_conversation', {
  id: model.id().primaryKey(),
  tenant_id: model.text().index('idx_aiconv_tenant'),
  site_id: model.text().nullable().index('idx_aiconv_site'),
  title: model.text().nullable(),
  model_provider: model.text().default('anthropic'),
  model_name: model.text().default('claude-sonnet-4-20250514'),
  total_input_tokens: model.number().default(0),
  total_output_tokens: model.number().default(0),
  total_credits_consumed: model.number().default(0),
  metadata: model.json().nullable(),
})

export const ForgelyAiMessage = model.define('forgely_ai_message', {
  id: model.id().primaryKey(),
  conversation_id: model.text().index('idx_aimsg_conv'),
  role: model.enum(['user', 'assistant', 'system', 'tool']),
  content: model.text(),
  tool_calls: model.json().nullable(),
  tool_results: model.json().nullable(),
  input_tokens: model.number().default(0),
  output_tokens: model.number().default(0),
  credits_consumed: model.number().default(0),
  metadata: model.json().nullable(),
})

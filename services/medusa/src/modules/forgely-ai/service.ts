import { MedusaService } from '@medusajs/framework/utils'
import { ForgelyAiConversation, ForgelyAiMessage } from './models/forgely-ai-conversation'

class ForgelyAiModuleService extends MedusaService({
  ForgelyAiConversation,
  ForgelyAiMessage,
}) {
  async listConversations(tenantId: string, siteId?: string) {
    const filters: Record<string, unknown> = { tenant_id: tenantId }
    if (siteId) filters.site_id = siteId
    return this.listForgelyAiConversations(filters, {
      order: { created_at: 'DESC' },
    })
  }

  async appendMessage(
    conversationId: string,
    message: {
      role: 'user' | 'assistant' | 'system' | 'tool'
      content: string
      tool_calls?: unknown
      tool_results?: unknown
      input_tokens?: number
      output_tokens?: number
      credits_consumed?: number
    },
  ) {
    const msg = await this.createForgelyAiMessages({
      conversation_id: conversationId,
      ...message,
    })

    if (message.input_tokens || message.output_tokens || message.credits_consumed) {
      const conv = (await this.retrieveForgelyAiConversation(conversationId)) as {
        total_input_tokens: number
        total_output_tokens: number
        total_credits_consumed: number
      }
      await this.updateForgelyAiConversations({
        id: conversationId,
        total_input_tokens: conv.total_input_tokens + (message.input_tokens ?? 0),
        total_output_tokens: conv.total_output_tokens + (message.output_tokens ?? 0),
        total_credits_consumed: conv.total_credits_consumed + (message.credits_consumed ?? 0),
      })
    }

    return msg
  }
}

export default ForgelyAiModuleService

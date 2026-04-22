/**
 * AI Copilot — local types.
 *
 * Mirrors the design in docs/MASTER.md §24.
 *
 * Tool calls follow the OpenAI / Anthropic JSON-tool-call shape: the
 * assistant emits `pendingToolCalls`, we render a card per call, the
 * user confirms each one, and we surface the tool result back to the
 * assistant on the next turn.
 *
 * Everything in this MVP is mocked — no real LLM is called. The
 * `dispatch()` function in `<CopilotProvider>` simulates a fake assistant
 * latency so the UX is honest without any external API key.
 */

export type CopilotPageContext =
  | { kind: 'dashboard' }
  | { kind: 'product'; productId: string; productTitle: string }
  | { kind: 'product-list'; siteId: string }
  | { kind: 'order'; orderId: string; orderNumber: string }
  | { kind: 'order-list'; siteId: string }
  | { kind: 'customer'; customerId: string; customerName: string }
  | { kind: 'customer-list'; siteId: string }
  | { kind: 'media'; siteId: string }
  | { kind: 'brand-kit'; brandKitId: string }
  | { kind: 'editor'; siteId: string; selectedBlockId?: string; selectedBlockType?: string }
  | { kind: 'global' }

export type ToolName =
  // query
  | 'query_sales'
  | 'query_orders'
  | 'query_customers'
  | 'query_inventory'
  | 'query_analytics'
  | 'query_seo_performance'
  // products
  | 'update_product'
  | 'create_product'
  | 'rewrite_copy'
  | 'bulk_update_products'
  | 'suggest_pricing'
  // theme
  | 'modify_theme_block'
  | 'add_theme_block'
  | 'remove_theme_block'
  | 'change_colors'
  | 'change_fonts'
  // media
  | 'generate_image'
  | 'generate_video'
  | 'generate_3d_model'
  | 'regenerate_hero_moment'
  // marketing
  | 'create_discount'
  | 'send_campaign'
  | 'schedule_email'
  // customers
  | 'send_customer_message'
  | 'issue_refund'
  | 'tag_customer'
  // analytics
  | 'compare_periods'
  | 'forecast_revenue'
  | 'identify_trends'
  // compliance
  | 'run_compliance_check'
  | 'apply_compliance_fix'
  // seo
  | 'run_seo_audit'
  | 'submit_sitemap'
  // super-admin
  | 'super_ban_user'
  | 'super_unban_user'
  | 'freeze_site'
  | 'unfreeze_site'
  | 'approve_refund'
  | 'deny_refund'

export interface ToolCall {
  id: string
  name: ToolName
  arguments: Record<string, unknown>
  /** True if the tool mutates state — must be confirmed before running. */
  destructive: boolean
  estimatedCredits?: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'done'
  result?: string
}

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls?: ToolCall[]
  createdAt: string
}

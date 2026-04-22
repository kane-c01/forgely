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

/** Locale supported by the Copilot reply engine. Default is `zh-CN`. */
export type CopilotLocale = 'zh-CN' | 'en'

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
  | { kind: 'compliance'; siteId: string }
  | { kind: 'seo'; siteId: string }
  // Super-admin surfaces
  | { kind: 'super-overview' }
  | { kind: 'super-users' }
  | { kind: 'super-user'; userId: string; userEmail: string }
  | { kind: 'super-finance' }
  | { kind: 'super-audit' }
  | { kind: 'super-team' }
  | { kind: 'super-marketing' }
  | { kind: 'super-plugins' }
  | { kind: 'super-health' }
  | { kind: 'super-ai-ops' }
  | { kind: 'super-sites' }
  | { kind: 'super-content' }
  | { kind: 'super-analytics' }
  | { kind: 'super-support' }
  | { kind: 'super-settings' }
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
  | 'generate_photos'
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
  // orders / customers
  | 'send_customer_message'
  | 'issue_refund'
  | 'tag_customer'
  | 'mark_fulfilled'
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
  | 'research_keyword'
  // super admin — users
  | 'super_query_user'
  | 'super_ban_user'
  | 'super_unban_user'
  | 'super_credit_adjustment'
  | 'super_login_as_user'
  // super admin — finance
  | 'approve_refund'
  | 'deny_refund'
  | 'super_force_refund'
  | 'super_export_finance'
  // super admin — sites
  | 'super_freeze_site'
  | 'super_unfreeze_site'
  // super admin — plugins
  | 'approve_plugin'
  | 'reject_plugin'
  // super admin — marketing
  | 'super_send_announcement'
  | 'launch_email_campaign'
  // super admin — metrics / audit (read-only query tools)
  | 'super_query_mrr'
  | 'super_query_dau'
  | 'super_query_ai_cost'
  | 'super_query_audit'

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

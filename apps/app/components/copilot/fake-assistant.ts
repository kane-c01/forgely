/**
 * Fake assistant that returns context-aware canned answers.
 *
 * The intent is to *demonstrate the UX of Tool Use* — confirmation
 * cards, destructive flags, credit estimates — without paying for an
 * actual model call. Rules are a small DSL: keyword match → reply.
 *
 * When the real W1 Copilot Agent ships (T16/T17 area), drop this file
 * in favour of a tRPC stream of `assistant.message.delta` events.
 */
import type { CopilotPageContext, ToolCall, ToolName } from './types'

interface AssistantReply {
  text: string
  toolCalls?: Omit<ToolCall, 'id' | 'status'>[]
}

const tc = (
  name: ToolName,
  args: Record<string, unknown>,
  destructive = false,
  estimatedCredits?: number,
): Omit<ToolCall, 'id' | 'status'> => ({
  name,
  arguments: args,
  destructive,
  estimatedCredits,
})

function contextLine(ctx: CopilotPageContext): string {
  switch (ctx.kind) {
    case 'product':
      return `I can see you're on **${ctx.productTitle}**.`
    case 'product-list':
      return "I can see your product list."
    case 'order':
      return `Looking at order **${ctx.orderNumber}**.`
    case 'order-list':
      return "Browsing your orders."
    case 'customer':
      return `Customer profile: **${ctx.customerName}**.`
    case 'customer-list':
      return "Across your customer list."
    case 'media':
      return "Your media library is open."
    case 'brand-kit':
      return "Reading your Brand Kit."
    case 'editor':
      return ctx.selectedBlockId
        ? `Editor — currently selected: **${ctx.selectedBlockType ?? 'block'}**.`
        : "Theme Editor — no block selected yet."
    case 'dashboard':
      return "Dashboard overview is loaded."
    case 'global':
      return ''
  }
}

export function fakeAssistant(input: string, ctx: CopilotPageContext): AssistantReply {
  const t = input.toLowerCase()
  const ctxLine = contextLine(ctx)
  const prefix = ctxLine ? `${ctxLine}\n\n` : ''

  // ----- pricing
  if (t.includes('price') || t.includes('pricing')) {
    return {
      text:
        prefix +
        "I'd suggest moving Primary Essentials Blend to **$26** based on competitor median + your AOV. Confirm and I'll update the listing on your draft.",
      toolCalls: [
        tc(
          'suggest_pricing',
          { productId: 'p_001', target: 2600, basis: 'competitor-median+AOV' },
          false,
        ),
        tc(
          'update_product',
          { productId: 'p_001', priceCents: 2600 },
          true,
        ),
      ],
    }
  }

  // ----- copy / rewrite
  if (t.includes('rewrite') || t.includes('copy') || t.includes('headline')) {
    return {
      text:
        prefix +
        "Here are 3 headlines I'd test. Pick one and I'll swap it on the draft.",
      toolCalls: [
        tc(
          'rewrite_copy',
          {
            target: ctx.kind === 'product' ? 'product.title' : 'theme.hero.headline',
            options: [
              'A morning worth waking up for.',
              'Pulled at dawn. In your hands by Friday.',
              'Single origin. Single intent.',
            ],
          },
          true,
        ),
      ],
    }
  }

  // ----- generate / regenerate hero / video
  if (t.includes('regenerate') || t.includes('hero') || t.includes('video')) {
    return {
      text:
        prefix +
        "I'll regenerate the hero video with **warmer lighting** and 2 alternates. This will use credits.",
      toolCalls: [
        tc(
          'regenerate_hero_moment',
          { siteId: 'qiao-coffee', moment: 'Liquid Bath', lighting: 'warmer', count: 3 },
          true,
          150,
        ),
      ],
    }
  }

  // ----- colors
  if (t.includes('color') || t.includes('warmer') || t.includes('cooler')) {
    return {
      text:
        prefix +
        "I'll shift the palette toward **warmer ember + amber** and bump contrast +6%. Preview will update live.",
      toolCalls: [
        tc(
          'change_colors',
          { primary: '#C74A0A', accent: '#FFD166', shift: '+warm' },
          true,
        ),
      ],
    }
  }

  // ----- analytics / sales
  if (t.includes('sales') || t.includes('revenue') || t.includes('how am i doing')) {
    return {
      text:
        prefix +
        "Last 30 days you ran **$2,847** across **23 orders** at **3.2% conversion** (↑ vs prior 30 days). Primary Essentials is your top SKU, doing **23% above** the rest of catalog.",
      toolCalls: [
        tc('query_sales', { range: '30d' }, false),
        tc('compare_periods', { current: '30d', baseline: 'previous_30d' }, false),
      ],
    }
  }

  // ----- discount
  if (t.includes('discount') || t.includes('coupon')) {
    return {
      text: prefix + "I'll create a 15% off code valid for 7 days, capped at 200 redemptions.",
      toolCalls: [
        tc(
          'create_discount',
          { code: 'WARMUP15', percent: 15, expiresInDays: 7, maxRedemptions: 200 },
          true,
        ),
      ],
    }
  }

  // ----- refund
  if (t.includes('refund')) {
    return {
      text: prefix + "I can issue a full refund and tag the customer for follow-up.",
      toolCalls: [
        tc('issue_refund', { orderId: 'o_2037', reason: 'damaged-shipment' }, true),
        tc('tag_customer', { customerId: 'c_001', tag: 'recovery' }, true),
      ],
    }
  }

  // default
  return {
    text:
      prefix +
      "I can analyze sales, rewrite copy, generate images / videos, edit theme blocks, create discounts, message customers, and more. Try **'how are sales this month?'** or **'rewrite the hero headline'**.",
  }
}

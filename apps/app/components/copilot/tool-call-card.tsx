'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

import type { ToolCall } from './types'

interface ToolCallCardProps {
  call: ToolCall
  onConfirm: () => void
  onCancel: () => void
}

const TOOL_LABEL: Record<string, string> = {
  query_sales: 'Query sales',
  query_orders: 'Query orders',
  query_customers: 'Query customers',
  query_inventory: 'Query inventory',
  query_analytics: 'Query analytics',
  query_seo_performance: 'Query SEO',
  update_product: 'Update product',
  create_product: 'Create product',
  rewrite_copy: 'Rewrite copy',
  bulk_update_products: 'Bulk update products',
  suggest_pricing: 'Suggest pricing',
  modify_theme_block: 'Modify theme block',
  add_theme_block: 'Add theme block',
  remove_theme_block: 'Remove theme block',
  change_colors: 'Change colors',
  change_fonts: 'Change fonts',
  generate_image: 'Generate image',
  generate_video: 'Generate video',
  generate_3d_model: 'Generate 3D model',
  regenerate_hero_moment: 'Regenerate hero moment',
  create_discount: 'Create discount',
  send_campaign: 'Send campaign',
  schedule_email: 'Schedule email',
  send_customer_message: 'Message customer',
  issue_refund: 'Issue refund',
  tag_customer: 'Tag customer',
  compare_periods: 'Compare periods',
  forecast_revenue: 'Forecast revenue',
  identify_trends: 'Identify trends',
}

export function ToolCallCard({ call, onConfirm, onCancel }: ToolCallCardProps) {
  const statusTone =
    call.status === 'done'
      ? 'success'
      : call.status === 'cancelled'
        ? 'neutral'
        : call.status === 'confirmed'
          ? 'forge'
          : call.destructive
            ? 'warning'
            : 'info'

  return (
    <div
      className={cn(
        'rounded-lg border bg-bg-deep p-3 text-small',
        call.destructive ? 'border-forge-orange/30' : 'border-border-strong',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-text-primary">
          <span className="grid h-6 w-6 place-items-center rounded bg-bg-elevated text-forge-amber">
            <Icon.Robot size={12} />
          </span>
          <span className="font-mono text-caption uppercase tracking-[0.12em]">
            {TOOL_LABEL[call.name] ?? call.name}
          </span>
          {call.destructive ? (
            <Badge tone="warning" className="!text-[10px] tracking-[0.16em]">
              writes
            </Badge>
          ) : (
            <Badge tone="info" className="!text-[10px] tracking-[0.16em]">
              read
            </Badge>
          )}
        </div>
        <Badge tone={statusTone} dot={call.status === 'pending' || call.status === 'confirmed'}>
          {call.status}
        </Badge>
      </div>

      <pre className="mt-2 overflow-x-auto rounded bg-bg-void/60 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-text-secondary">
{JSON.stringify(call.arguments, null, 2)}
      </pre>

      {call.estimatedCredits ? (
        <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-caption text-forge-amber">
          <Icon.Sparkle size={12} /> ~{call.estimatedCredits} credits
        </p>
      ) : null}

      {call.result ? (
        <p className="mt-2 rounded bg-success/10 px-2 py-1.5 text-caption text-success">
          {call.result}
        </p>
      ) : null}

      {call.status === 'pending' ? (
        <div className="mt-3 flex items-center gap-2">
          {call.destructive ? (
            <>
              <Button size="xs" onClick={onConfirm}>
                <Icon.Check size={12} /> Confirm
              </Button>
              <Button size="xs" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="xs" variant="secondary" onClick={onConfirm}>
              Run
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

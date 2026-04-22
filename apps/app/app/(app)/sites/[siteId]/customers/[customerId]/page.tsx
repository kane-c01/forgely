'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { CustomerDetailCopilotBridge } from '@/components/copilot/bridges'
import { OrderStatusBadge } from '@/components/orders/order-status'
import { AIQuickActions } from '@/components/products/ai-quick-actions'
import { PageHeader } from '@/components/shell/page-header'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icons'
import { getCustomer, ordersForCustomer } from '@/lib/mocks'
import { formatCurrency, formatDate, relativeTime } from '@/lib/format'

export default function CustomerDetailPage({
  params,
}: {
  params: { siteId: string; customerId: string }
}) {
  const customer = getCustomer(params.customerId)
  useCopilotContext(
    customer
      ? { kind: 'customer', customerId: customer.id, customerName: customer.name }
      : { kind: 'global' },
  )
  if (!customer) return notFound()
  const customerOrders = ordersForCustomer(customer.id)

  const aov = customer.orderCount > 0 ? customer.totalSpentCents / customer.orderCount : 0

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <CustomerDetailCopilotBridge
        siteId={params.siteId}
        customerId={customer.id}
        customerName={customer.name}
      />
      <div className="text-caption text-text-muted flex items-center gap-2 font-mono">
        <Link href={`/sites/${params.siteId}/customers`} className="hover:text-text-primary">
          Customers
        </Link>
        <Icon.ChevronRight size={12} />
        <span className="text-text-secondary">{customer.name}</span>
      </div>

      <PageHeader
        eyebrow="Customer profile"
        title={customer.name}
        description={customer.email}
        meta={
          <>
            <span>joined</span>
            <span className="text-text-secondary">{formatDate(customer.joinedAt)}</span>
            {customer.tags.map((t) => (
              <Badge key={t} tone={t === 'VIP' ? 'forge' : 'outline'} dot={t === 'VIP'}>
                {t}
              </Badge>
            ))}
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Send size={14} /> Email
            </Button>
            <Button>
              <Icon.Plus size={14} /> Create order
            </Button>
          </>
        }
      />

      <AIQuickActions
        actions={[
          {
            emoji: '✨',
            label: 'Forecast LTV',
            prompt: `Forecast lifetime value for ${customer.name}.`,
          },
          {
            emoji: '🎟',
            label: 'Send VIP discount',
            prompt: `Send a 20% off code to ${customer.name} valid for 14 days.`,
          },
          {
            emoji: '🏷',
            label: 'Tag as wholesale',
            prompt: `Tag ${customer.name} as wholesale and apply tier-2 pricing.`,
          },
          {
            emoji: '📨',
            label: 'Draft re-engagement email',
            prompt: `Draft a friendly re-engagement email for ${customer.name}.`,
          },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Lifetime value" value={formatCurrency(customer.totalSpentCents)} accent />
        <KpiTile label="Orders" value={String(customer.orderCount)} />
        <KpiTile label="Avg. order value" value={formatCurrency(aov)} />
        <KpiTile
          label="Last order"
          value={customer.lastOrderAt ? relativeTime(customer.lastOrderAt) : '—'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order history</CardTitle>
              <span className="text-caption text-text-muted font-mono">
                {customerOrders.length} order{customerOrders.length === 1 ? '' : 's'}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {customerOrders.length === 0 ? (
                <p className="text-small text-text-muted px-5 py-8 text-center">No orders yet.</p>
              ) : (
                <ul className="divide-border-subtle divide-y">
                  {customerOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/sites/${params.siteId}/orders/${o.id}`}
                        className="hover:bg-bg-elevated/60 flex items-center justify-between gap-3 px-5 py-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-caption text-text-muted font-mono">{o.number}</span>
                          <span className="text-small text-text-primary">
                            {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <OrderStatusBadge status={o.status} />
                          <span className="text-text-primary font-mono tabular-nums">
                            {formatCurrency(o.totalCents)}
                          </span>
                          <span className="text-caption text-text-muted font-mono">
                            {relativeTime(o.createdAt)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={customer.name} />
                <div>
                  <p className="text-small text-text-primary font-medium">{customer.name}</p>
                  <p className="text-caption text-text-muted font-mono">{customer.email}</p>
                  {customer.phone ? (
                    <p className="text-caption text-text-muted font-mono">{customer.phone}</p>
                  ) : null}
                </div>
              </div>
              <div className="text-caption grid grid-cols-2 gap-2">
                <Button size="xs" variant="secondary">
                  <Icon.Send size={12} /> Email
                </Button>
                <Button size="xs" variant="secondary">
                  <Icon.Tag size={12} /> Tag
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-small text-text-secondary">
                Marketing-friendly · last touched {relativeTime(customer.joinedAt)}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border-subtle bg-bg-surface rounded-lg border p-4">
      <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">{label}</p>
      <p
        className={
          'font-display text-h2 mt-2 tabular-nums leading-none ' +
          (accent ? 'text-forge-amber' : 'text-text-primary')
        }
      >
        {value}
      </p>
    </div>
  )
}

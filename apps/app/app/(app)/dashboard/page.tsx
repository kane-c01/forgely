'use client'

import Link from 'next/link'

import { useCopilot, useCopilotContext } from '@/components/copilot/copilot-provider'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Sparkline } from '@/components/dashboard/sparkline'
import { useGreeting } from '@/components/dashboard/use-greeting'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { defaultSite, orders, products, revenueSeries30d } from '@/lib/mocks'
import { formatCurrency, formatNumber, formatPercent, relativeTime } from '@/lib/format'

export default function DashboardPage() {
  useCopilotContext({ kind: 'dashboard' })
  const { greeting, time, date } = useGreeting('Alex')
  const copilot = useCopilot()
  const site = defaultSite

  const pendingShipments = orders.filter((o) => o.status === 'paid' || o.status === 'pending').length
  const lowStock = products.filter((p) => p.status === 'active' && p.inventory <= 10).length
  const totalRevenueCents = revenueSeries30d.reduce((a, b) => a + b, 0)
  const last7 = revenueSeries30d.slice(-7).reduce((a, b) => a + b, 0)
  const prev7 = revenueSeries30d.slice(-14, -7).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      {/* Greeting bar */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
            {site.name} · {site.domain}
          </p>
          <h1 className="mt-1 font-display text-h1 text-text-primary">{greeting}.</h1>
        </div>
        {time && date ? (
          <div className="flex items-center gap-3 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
            <span>{date}</span>
            <span className="text-text-subtle">·</span>
            <span className="tabular-nums text-text-secondary">{time}</span>
            <Badge tone="success" dot>
              live
            </Badge>
          </div>
        ) : null}
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Revenue · 30d"
          value={formatCurrency(totalRevenueCents)}
          delta={0.123}
          accent
        />
        <KpiCard
          label="Orders · 30d"
          value={formatNumber(site.metrics.orders30d)}
          delta={0.081}
        />
        <KpiCard
          label="Conversion"
          value={formatPercent(site.metrics.conversion)}
          delta={-0.003}
          deltaInverted
        />
        <KpiCard
          label="Visitors · 30d"
          value={formatNumber(site.metrics.visitors30d)}
          delta={0.152}
        />
      </section>

      {/* Hero chart */}
      <section className="rounded-lg border border-border-subtle bg-bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div>
            <p className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
              Revenue · last 30 days
            </p>
            <p className="mt-1 font-display text-h2 text-text-primary tabular-nums">
              {formatCurrency(totalRevenueCents)}
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-caption text-text-muted">
            <span>last 7d</span>
            <span className="rounded bg-bg-elevated px-2 py-0.5 tabular-nums text-forge-amber">
              {formatCurrency(last7)}
            </span>
            <span
              className={
                last7 >= prev7
                  ? 'inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-success'
                  : 'inline-flex items-center gap-1 rounded bg-error/15 px-2 py-0.5 text-error'
              }
            >
              {last7 >= prev7 ? <Icon.ArrowUp size={10} /> : <Icon.ArrowDown size={10} />}
              {(((last7 - prev7) / prev7) * 100).toFixed(1)}% vs prior
            </span>
          </div>
        </div>
        <div className="h-[220px] px-2 pb-3">
          <Sparkline data={revenueSeries30d} width={1200} height={220} showAxis />
        </div>
      </section>

      {/* Two-column: Needs attention + AI suggests */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Needs attention */}
        <div className="rounded-lg border border-border-subtle bg-bg-surface lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <h3 className="inline-flex items-center gap-2 font-heading text-h3 text-text-primary">
              <Icon.Bell size={16} className="text-forge-amber" /> Needs attention
            </h3>
            <Badge tone="warning">
              {pendingShipments + lowStock} items
            </Badge>
          </div>
          <ul className="divide-y divide-border-subtle">
            <li className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-forge-orange/15 text-forge-amber">
                  <Icon.Cart size={16} />
                </span>
                <span className="text-small text-text-primary">
                  <strong className="font-medium">{pendingShipments}</strong> orders pending shipment
                </span>
              </span>
              <Link
                href={`/sites/${site.id}/orders`}
                className="font-mono text-caption uppercase tracking-[0.12em] text-forge-amber hover:underline"
              >
                Open orders →
              </Link>
            </li>
            <li className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-warning/15 text-warning">
                  <Icon.Box size={16} />
                </span>
                <span className="text-small text-text-primary">
                  <strong className="font-medium">{lowStock}</strong> low-stock items
                </span>
              </span>
              <Link
                href={`/sites/${site.id}/products`}
                className="font-mono text-caption uppercase tracking-[0.12em] text-forge-amber hover:underline"
              >
                Restock →
              </Link>
            </li>
            <li className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-info/15 text-info">
                  <Icon.Sparkle size={16} />
                </span>
                <span className="text-small text-text-primary">
                  Hero video draft ready · awaiting your review
                </span>
              </span>
              <Link
                href={`/sites/${site.id}/editor`}
                className="font-mono text-caption uppercase tracking-[0.12em] text-forge-amber hover:underline"
              >
                Review →
              </Link>
            </li>
          </ul>
        </div>

        {/* AI suggests */}
        <div className="relative overflow-hidden rounded-lg border border-forge-orange/30 bg-gradient-to-br from-forge-orange/10 via-bg-surface to-bg-surface p-5 lg:col-span-2">
          <span className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-forge-orange/15 blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-forge-orange/15 px-2 py-0.5 font-mono text-caption uppercase tracking-[0.18em] text-forge-amber">
              <Icon.Sparkle size={12} /> Copilot suggests
            </span>
            <p className="text-body text-text-primary">
              Your <strong className="text-forge-amber">Primary Essentials Blend</strong> converts <strong className="text-forge-amber">23% above</strong> catalog average. Want me to bump its ad budget and pin it to your Hero block?
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  copilot.setOpen(true)
                  void copilot.send('Bump Primary Essentials ad budget and pin it to the Hero block.')
                }}
              >
                <Icon.Sparkle size={12} /> Yes, plan it
              </Button>
              <Button size="sm" variant="ghost">
                Not now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent orders + top products */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-bg-surface">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <h3 className="font-heading text-h3 text-text-primary">Recent orders</h3>
            <Link
              href={`/sites/${site.id}/orders`}
              className="font-mono text-caption uppercase tracking-[0.12em] text-forge-amber hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-border-subtle">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/sites/${site.id}/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-bg-elevated/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-caption text-text-muted">{o.number}</span>
                    <span className="text-small text-text-primary">{o.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusToneFor(o.status)} dot>
                      {o.status}
                    </Badge>
                    <span className="font-mono text-caption tabular-nums text-text-secondary">
                      {formatCurrency(o.totalCents)}
                    </span>
                    <span className="font-mono text-caption text-text-muted">
                      {relativeTime(o.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-surface">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <h3 className="font-heading text-h3 text-text-primary">Top products</h3>
            <Link
              href={`/sites/${site.id}/products`}
              className="font-mono text-caption uppercase tracking-[0.12em] text-forge-amber hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-border-subtle">
            {products.filter((p) => p.status === 'active').slice(0, 5).map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/sites/${site.id}/products/${p.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-bg-elevated/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded bg-bg-deep text-h3">{p.images[0]}</span>
                    <div className="flex flex-col">
                      <span className="text-small text-text-primary">{p.title}</span>
                      <span className="font-mono text-caption text-text-muted">
                        rank #{i + 1} · {formatCurrency(p.priceCents)}
                      </span>
                    </div>
                  </div>
                  {p.hot ? <Badge tone="forge" dot>hot</Badge> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function statusToneFor(status: string): 'success' | 'forge' | 'warning' | 'info' | 'neutral' | 'error' {
  switch (status) {
    case 'paid':
    case 'fulfilled':
    case 'delivered':
      return 'success'
    case 'shipped':
      return 'info'
    case 'pending':
      return 'warning'
    case 'refunded':
    case 'cancelled':
      return 'error'
    default:
      return 'neutral'
  }
}

'use client'

import Link from 'next/link'

import { useCopilot, useCopilotContext } from '@/components/copilot/copilot-provider'
import { DashboardCopilotBridge } from '@/components/copilot/bridges'
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

  const pendingShipments = orders.filter(
    (o) => o.status === 'paid' || o.status === 'pending',
  ).length
  const lowStock = products.filter((p) => p.status === 'active' && p.inventory <= 10).length
  const totalRevenueCents = revenueSeries30d.reduce((a, b) => a + b, 0)
  const last7 = revenueSeries30d.slice(-7).reduce((a, b) => a + b, 0)
  const prev7 = revenueSeries30d.slice(-14, -7).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <DashboardCopilotBridge />
      {/* Greeting bar */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
            {site.name} · {site.domain}
          </p>
          <h1 className="font-display text-h1 text-text-primary mt-1">{greeting}.</h1>
        </div>
        {time && date ? (
          <div className="text-caption text-text-muted flex items-center gap-3 font-mono uppercase tracking-[0.18em]">
            <span>{date}</span>
            <span className="text-text-subtle">·</span>
            <span className="text-text-secondary tabular-nums">{time}</span>
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
        <KpiCard label="Orders · 30d" value={formatNumber(site.metrics.orders30d)} delta={0.081} />
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
      <section className="border-border-subtle bg-bg-surface rounded-lg border">
        <div className="border-border-subtle flex items-center justify-between gap-4 border-b px-5 py-4">
          <div>
            <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
              Revenue · last 30 days
            </p>
            <p className="font-display text-h2 text-text-primary mt-1 tabular-nums">
              {formatCurrency(totalRevenueCents)}
            </p>
          </div>
          <div className="text-caption text-text-muted flex items-center gap-3 font-mono">
            <span>last 7d</span>
            <span className="bg-bg-elevated text-forge-amber rounded px-2 py-0.5 tabular-nums">
              {formatCurrency(last7)}
            </span>
            <span
              className={
                last7 >= prev7
                  ? 'bg-success/15 text-success inline-flex items-center gap-1 rounded px-2 py-0.5'
                  : 'bg-error/15 text-error inline-flex items-center gap-1 rounded px-2 py-0.5'
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
        <div className="border-border-subtle bg-bg-surface rounded-lg border lg:col-span-3">
          <div className="border-border-subtle flex items-center justify-between border-b px-5 py-4">
            <h3 className="font-heading text-h3 text-text-primary inline-flex items-center gap-2">
              <Icon.Bell size={16} className="text-forge-amber" /> Needs attention
            </h3>
            <Badge tone="warning">{pendingShipments + lowStock} items</Badge>
          </div>
          <ul className="divide-border-subtle divide-y">
            <li className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="bg-forge-orange/15 text-forge-amber grid h-8 w-8 place-items-center rounded-md">
                  <Icon.Cart size={16} />
                </span>
                <span className="text-small text-text-primary">
                  <strong className="font-medium">{pendingShipments}</strong> orders pending
                  shipment
                </span>
              </span>
              <Link
                href={`/sites/${site.id}/orders`}
                className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em] hover:underline"
              >
                Open orders →
              </Link>
            </li>
            <li className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="bg-warning/15 text-warning grid h-8 w-8 place-items-center rounded-md">
                  <Icon.Box size={16} />
                </span>
                <span className="text-small text-text-primary">
                  <strong className="font-medium">{lowStock}</strong> low-stock items
                </span>
              </span>
              <Link
                href={`/sites/${site.id}/products`}
                className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em] hover:underline"
              >
                Restock →
              </Link>
            </li>
            <li className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="bg-info/15 text-info grid h-8 w-8 place-items-center rounded-md">
                  <Icon.Sparkle size={16} />
                </span>
                <span className="text-small text-text-primary">
                  Hero video draft ready · awaiting your review
                </span>
              </span>
              <Link
                href={`/sites/${site.id}/editor`}
                className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em] hover:underline"
              >
                Review →
              </Link>
            </li>
          </ul>
        </div>

        {/* AI suggests */}
        <div className="border-forge-orange/30 from-forge-orange/10 via-bg-surface to-bg-surface relative overflow-hidden rounded-lg border bg-gradient-to-br p-5 lg:col-span-2">
          <span className="bg-forge-orange/15 absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <span className="bg-forge-orange/15 text-caption text-forge-amber inline-flex items-center gap-1.5 self-start rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.18em]">
              <Icon.Sparkle size={12} /> Copilot suggests
            </span>
            <p className="text-body text-text-primary">
              Your <strong className="text-forge-amber">Primary Essentials Blend</strong> converts{' '}
              <strong className="text-forge-amber">23% above</strong> catalog average. Want me to
              bump its ad budget and pin it to your Hero block?
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  copilot.setOpen(true)
                  void copilot.send(
                    'Bump Primary Essentials ad budget and pin it to the Hero block.',
                  )
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
        <div className="border-border-subtle bg-bg-surface rounded-lg border">
          <div className="border-border-subtle flex items-center justify-between border-b px-5 py-4">
            <h3 className="font-heading text-h3 text-text-primary">Recent orders</h3>
            <Link
              href={`/sites/${site.id}/orders`}
              className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em] hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-border-subtle divide-y">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/sites/${site.id}/orders/${o.id}`}
                  className="hover:bg-bg-elevated/60 flex items-center justify-between gap-3 px-5 py-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-caption text-text-muted font-mono">{o.number}</span>
                    <span className="text-small text-text-primary">{o.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusToneFor(o.status)} dot>
                      {o.status}
                    </Badge>
                    <span className="text-caption text-text-secondary font-mono tabular-nums">
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
        </div>

        <div className="border-border-subtle bg-bg-surface rounded-lg border">
          <div className="border-border-subtle flex items-center justify-between border-b px-5 py-4">
            <h3 className="font-heading text-h3 text-text-primary">Top products</h3>
            <Link
              href={`/sites/${site.id}/products`}
              className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em] hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-border-subtle divide-y">
            {products
              .filter((p) => p.status === 'active')
              .slice(0, 5)
              .map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/sites/${site.id}/products/${p.id}`}
                    className="hover:bg-bg-elevated/60 flex items-center justify-between gap-3 px-5 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-bg-deep text-h3 grid h-9 w-9 place-items-center rounded">
                        {p.images[0]}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-small text-text-primary">{p.title}</span>
                        <span className="text-caption text-text-muted font-mono">
                          rank #{i + 1} · {formatCurrency(p.priceCents)}
                        </span>
                      </div>
                    </div>
                    {p.hot ? (
                      <Badge tone="forge" dot>
                        hot
                      </Badge>
                    ) : null}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function statusToneFor(
  status: string,
): 'success' | 'forge' | 'warning' | 'info' | 'neutral' | 'error' {
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

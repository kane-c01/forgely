'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { useT } from '@/lib/i18n'
import { OrderStatusBadge } from '@/components/orders/order-status'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { selectDataSource } from '@/lib/data-source'
import { orders as ALL_ORDERS } from '@/lib/mocks'
import { formatCurrency, relativeTime } from '@/lib/format'
import { trpc } from '@/lib/trpc'
import type { Order, OrderStatus } from '@/lib/types'

interface MedusaOrderSummary {
  id: string
  displayId: number
  email: string
  totalUsd: number
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  fulfillmentStatus: 'not_fulfilled' | 'fulfilled' | 'shipped' | 'delivered'
  paymentStatus: 'awaiting' | 'captured' | 'refunded'
  createdAt: string | Date
}

function adaptMedusaOrder(o: MedusaOrderSummary, siteId: string): Order {
  const status: OrderStatus =
    o.status === 'refunded'
      ? 'refunded'
      : o.fulfillmentStatus === 'delivered'
        ? 'delivered'
        : o.fulfillmentStatus === 'shipped'
          ? 'shipped'
          : o.fulfillmentStatus === 'fulfilled'
            ? 'fulfilled'
            : o.paymentStatus === 'captured'
              ? 'paid'
              : 'pending'
  return {
    id: o.id,
    siteId,
    number: `#${o.displayId || o.id.slice(-4)}`,
    customerId: '',
    customerName: o.email,
    status,
    totalCents: Math.round(o.totalUsd * 100),
    itemCount: 0,
    paymentMethod: 'stripe',
    shippingTo: { city: '—', country: '—' },
    items: [],
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt).toISOString(),
  }
}

export default function OrdersPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'order-list', siteId: params.siteId })
  const t = useT()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [query, setQuery] = useState('')

  const FILTERS: Array<{ value: 'all' | OrderStatus; label: string }> = [
    { value: 'all', label: t.orders.all },
    { value: 'pending', label: t.orders.pending },
    { value: 'paid', label: t.orders.paid },
    { value: 'fulfilled', label: t.orders.fulfilled },
    { value: 'shipped', label: t.orders.shipped },
    { value: 'delivered', label: t.orders.delivered },
    { value: 'refunded', label: t.orders.refunded },
  ]

  const trpcQuery = trpc.orders.list.useQuery({ siteId: params.siteId }, { retry: false })

  const trpcRows = useMemo(() => {
    const items = (trpcQuery.data as { items?: MedusaOrderSummary[] } | undefined)?.items
    if (!items || items.length === 0) return undefined
    const real = items.filter((it) => !it.id.startsWith('order_pending_medusa'))
    if (real.length === 0) return undefined
    return real.map((it) => adaptMedusaOrder(it, params.siteId))
  }, [trpcQuery.data, params.siteId])

  const fallbackRows = useMemo(
    () => ALL_ORDERS.filter((o) => o.siteId === params.siteId),
    [params.siteId],
  )

  const ds = selectDataSource(
    {
      data: trpcRows,
      isLoading: trpcQuery.isLoading,
      isError: trpcQuery.isError,
      error: trpcQuery.error,
    },
    fallbackRows,
  )

  const all = ds.data
  const rows = useMemo(() => {
    return all
      .filter((o) => (filter === 'all' ? true : o.status === filter))
      .filter((o) =>
        query.trim().length === 0
          ? true
          : `${o.number} ${o.customerName} ${o.shippingTo.city}`
              .toLowerCase()
              .includes(query.toLowerCase()),
      )
  }, [filter, query, all])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: all.length }
    for (const o of all) m[o.status] = (m[o.status] ?? 0) + 1
    return m
  }, [all])

  const total = useMemo(() => rows.reduce((s, o) => s + o.totalCents, 0), [rows])

  const columns: DataTableColumn<Order>[] = [
    {
      key: 'number',
      header: t.orders.colOrder,
      width: '110px',
      render: (o) => <span className="text-text-primary font-mono">{o.number}</span>,
    },
    {
      key: 'customer',
      header: t.orders.colCustomer,
      render: (o) => (
        <div className="flex flex-col">
          <span className="text-text-primary">{o.customerName}</span>
          <span className="text-caption text-text-muted font-mono">
            {o.shippingTo.city}, {o.shippingTo.country}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: t.orders.colStatus,
      width: '140px',
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: 'items',
      header: t.orders.colItems,
      width: '90px',
      align: 'right',
      render: (o) => (
        <span className="text-caption text-text-secondary font-mono tabular-nums">
          {o.itemCount}
        </span>
      ),
    },
    {
      key: 'total',
      header: t.orders.colTotal,
      width: '140px',
      align: 'right',
      render: (o) => (
        <span className="text-text-primary font-mono tabular-nums">
          {formatCurrency(o.totalCents)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t.orders.colPlaced,
      width: '120px',
      align: 'right',
      render: (o) => (
        <span className="text-caption text-text-muted font-mono">{relativeTime(o.createdAt)}</span>
      ),
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow={t.orders.eyebrow}
        title={t.orders.title}
        description={t.orders.description}
        meta={
          ds.source === 'mock' ? (
            <Badge tone="outline">{t.orders.demoData}</Badge>
          ) : (
            <Badge tone="success" dot>
              {t.orders.liveData}
            </Badge>
          )
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Download size={14} /> {t.orders.exportCsv}
            </Button>
            <Button>
              <Icon.Plus size={14} /> {t.orders.manualOrder}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
                <span className="text-caption text-text-muted font-mono">
                  · {counts[f.value] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon.Search
              size={14}
              className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.orders.searchOrders}
              className="w-72 pl-8"
            />
          </div>
          <Button size="md" variant="ghost">
            <Icon.Filter size={14} /> {t.orders.filter}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        onRowClick={(o) => router.push(`/sites/${params.siteId}/orders/${o.id}`)}
        empty={
          <div className="text-text-muted flex flex-col items-center gap-2">
            <Icon.Cart size={28} />
            <p>{t.orders.noMatch}</p>
          </div>
        }
      />

      <div className="text-caption text-text-muted flex items-center justify-end gap-3 font-mono">
        <span>
          {t.orders.showing} {rows.length} {t.orders.ordersCount}
        </span>
        <span className="text-text-subtle">·</span>
        <span className="text-text-secondary tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

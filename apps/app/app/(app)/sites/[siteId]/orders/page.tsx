'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { OrderStatusBadge } from '@/components/orders/order-status'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { orders as ALL_ORDERS } from '@/lib/mocks'
import { formatCurrency, relativeTime } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

const FILTERS: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'refunded', label: 'Refunded' },
]

export default function OrdersPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'order-list', siteId: params.siteId })
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    return ALL_ORDERS.filter((o) => o.siteId === params.siteId)
      .filter((o) => (filter === 'all' ? true : o.status === filter))
      .filter((o) =>
        query.trim().length === 0
          ? true
          : `${o.number} ${o.customerName} ${o.shippingTo.city}`.toLowerCase().includes(query.toLowerCase()),
      )
  }, [filter, query, params.siteId])

  const counts = useMemo(() => {
    const all = ALL_ORDERS.filter((o) => o.siteId === params.siteId)
    const m: Record<string, number> = { all: all.length }
    for (const o of all) m[o.status] = (m[o.status] ?? 0) + 1
    return m
  }, [params.siteId])

  const total = useMemo(() => rows.reduce((s, o) => s + o.totalCents, 0), [rows])

  const columns: DataTableColumn<Order>[] = [
    {
      key: 'number',
      header: 'Order',
      width: '110px',
      render: (o) => (
        <span className="font-mono text-text-primary">{o.number}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div className="flex flex-col">
          <span className="text-text-primary">{o.customerName}</span>
          <span className="font-mono text-caption text-text-muted">
            {o.shippingTo.city}, {o.shippingTo.country}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: 'items',
      header: 'Items',
      width: '90px',
      align: 'right',
      render: (o) => (
        <span className="font-mono text-caption tabular-nums text-text-secondary">
          {o.itemCount}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      width: '140px',
      align: 'right',
      render: (o) => (
        <span className="font-mono tabular-nums text-text-primary">
          {formatCurrency(o.totalCents)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Placed',
      width: '120px',
      align: 'right',
      render: (o) => (
        <span className="font-mono text-caption text-text-muted">
          {relativeTime(o.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        description="Track payments, fulfillments and shipments. Ask Copilot to compare periods or batch-update statuses."
        actions={
          <>
            <Button variant="ghost">
              <Icon.Download size={14} /> Export CSV
            </Button>
            <Button>
              <Icon.Plus size={14} /> Manual order
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
                <span className="font-mono text-caption text-text-muted">
                  · {counts[f.value] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, customers"
              className="w-72 pl-8"
            />
          </div>
          <Button size="md" variant="ghost">
            <Icon.Filter size={14} /> Filter
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        onRowClick={(o) => router.push(`/sites/${params.siteId}/orders/${o.id}`)}
        empty={
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <Icon.Cart size={28} />
            <p>No orders match these filters.</p>
          </div>
        }
      />

      <div className="flex items-center justify-end gap-3 font-mono text-caption text-text-muted">
        <span>Showing {rows.length} orders</span>
        <span className="text-text-subtle">·</span>
        <span className="tabular-nums text-text-secondary">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

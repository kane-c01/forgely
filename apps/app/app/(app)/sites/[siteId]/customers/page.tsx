'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { PageHeader } from '@/components/shell/page-header'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { selectDataSource } from '@/lib/data-source'
import { customers as ALL_CUSTOMERS } from '@/lib/mocks'
import { formatCurrency, relativeTime } from '@/lib/format'
import { trpc } from '@/lib/trpc'
import type { Customer } from '@/lib/types'

type Filter = 'all' | 'vip' | 'subscriber' | 'new'

function matchesFilter(c: Customer, f: Filter): boolean {
  if (f === 'all') return true
  if (f === 'vip') return c.tags.includes('VIP')
  if (f === 'subscriber') return c.tags.includes('Subscriber')
  return c.tags.includes('New')
}

/** Medusa customer summary → local UI `Customer` type. */
interface MedusaCustomerRow {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  ordersCount: number
  lifetimeValueUsd: number
  createdAt: string | Date
}

function adaptTrpcCustomer(row: MedusaCustomerRow, siteId: string): Customer {
  const name =
    [row.firstName, row.lastName].filter(Boolean).join(' ').trim() ||
    row.email.split('@')[0] ||
    row.email
  return {
    id: row.id,
    siteId,
    name,
    email: row.email,
    totalSpentCents: Math.round((row.lifetimeValueUsd ?? 0) * 100),
    orderCount: row.ordersCount,
    lastOrderAt: null,
    tags: [],
    joinedAt:
      typeof row.createdAt === 'string' ? row.createdAt : new Date(row.createdAt).toISOString(),
  }
}

export default function CustomersPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'customer-list', siteId: params.siteId })
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const listQuery = trpc.customers.list.useQuery(
    { siteId: params.siteId, limit: 100 },
    { retry: false },
  )

  const trpcRows = useMemo(() => {
    const items = (listQuery.data as { items?: MedusaCustomerRow[] } | undefined)?.items
    if (!items) return undefined
    return items.map((r) => adaptTrpcCustomer(r, params.siteId))
  }, [listQuery.data, params.siteId])

  const fallbackRows = useMemo(
    () => ALL_CUSTOMERS.filter((c) => c.siteId === params.siteId),
    [params.siteId],
  )

  const ds = selectDataSource(
    {
      data: trpcRows,
      isLoading: listQuery.isLoading,
      isError: listQuery.isError,
      error: listQuery.error,
    },
    fallbackRows,
  )

  const all = ds.data
  const rows = useMemo(() => {
    return all
      .filter((c) => matchesFilter(c, filter))
      .filter((c) =>
        query.trim().length === 0
          ? true
          : `${c.name} ${c.email} ${c.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
      )
  }, [filter, query, all])

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <div className="flex flex-col">
            <span className="text-text-primary font-medium">{c.name}</span>
            <span className="text-caption text-text-muted font-mono">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      width: '200px',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.tags.length === 0 ? (
            <span className="text-caption text-text-muted font-mono">—</span>
          ) : (
            c.tags.map((tag) => (
              <Badge key={tag} tone={tag === 'VIP' ? 'forge' : 'outline'}>
                {tag}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      width: '90px',
      align: 'right',
      render: (c) => (
        <span className="text-text-secondary font-mono tabular-nums">{c.orderCount}</span>
      ),
    },
    {
      key: 'spent',
      header: 'Lifetime value',
      width: '160px',
      align: 'right',
      render: (c) => (
        <span className="text-text-primary font-mono tabular-nums">
          {formatCurrency(c.totalSpentCents)}
        </span>
      ),
    },
    {
      key: 'last',
      header: 'Last order',
      width: '140px',
      align: 'right',
      render: (c) => (
        <span className="text-caption text-text-muted font-mono">
          {c.lastOrderAt ? relativeTime(c.lastOrderAt) : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Audience"
        title="Customers"
        description="Build relationships. Ask Copilot to forecast LTV, find lapsed buyers, or batch-send a thank-you email."
        meta={
          ds.source === 'mock' ? (
            <Badge tone="outline">demo data — connect Medusa to see real customers</Badge>
          ) : (
            <Badge tone="success" dot>
              live data
            </Badge>
          )
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Download size={14} /> Export CSV
            </Button>
            <Button>
              <Icon.Plus size={14} /> New customer
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All · {all.length}</TabsTrigger>
            <TabsTrigger value="vip">VIP</TabsTrigger>
            <TabsTrigger value="subscriber">Subscribers</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
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
              placeholder="Search by name, email or tag"
              className="w-72 pl-8"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        onRowClick={(c) => router.push(`/sites/${params.siteId}/customers/${c.id}`)}
        empty={
          <div className="text-text-muted flex flex-col items-center gap-2">
            <Icon.Users size={28} />
            <p>No customers match these filters.</p>
          </div>
        }
      />
    </div>
  )
}

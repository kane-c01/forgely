'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { useT } from '@/lib/i18n'
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

interface MedusaCustomerSummary {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  ordersCount: number
  lifetimeValueUsd: number
  createdAt: string | Date
}

function adaptMedusaCustomer(c: MedusaCustomerSummary, siteId: string): Customer {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
  return {
    id: c.id,
    siteId,
    name,
    email: c.email,
    totalSpentCents: Math.round(c.lifetimeValueUsd * 100),
    orderCount: c.ordersCount,
    lastOrderAt: null,
    tags: [],
    joinedAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
  }
}

export default function CustomersPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'customer-list', siteId: params.siteId })
  const t = useT()
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const trpcQuery = trpc.customers.list.useQuery({ siteId: params.siteId }, { retry: false })

  const trpcRows = useMemo(() => {
    const items = (trpcQuery.data as { items?: MedusaCustomerSummary[] } | undefined)?.items
    if (!items || items.length === 0) return undefined
    const real = items.filter((it) => !it.id.startsWith('cus_pending_medusa'))
    if (real.length === 0) return undefined
    return real.map((it) => adaptMedusaCustomer(it, params.siteId))
  }, [trpcQuery.data, params.siteId])

  const fallbackRows = useMemo(
    () => ALL_CUSTOMERS.filter((c) => c.siteId === params.siteId),
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
      header: t.customers.colCustomer,
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
      header: t.customers.colTags,
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
      header: t.customers.colOrders,
      width: '90px',
      align: 'right',
      render: (c) => (
        <span className="text-text-secondary font-mono tabular-nums">{c.orderCount}</span>
      ),
    },
    {
      key: 'spent',
      header: t.customers.colLifetimeValue,
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
      header: t.customers.colLastOrder,
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
        eyebrow={t.customers.eyebrow}
        title={t.customers.title}
        description={t.customers.description}
        meta={
          ds.source === 'mock' ? (
            <Badge tone="outline">{t.customers.demoData}</Badge>
          ) : (
            <Badge tone="success" dot>
              {t.customers.liveData}
            </Badge>
          )
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Download size={14} /> {t.customers.exportCsv}
            </Button>
            <Button>
              <Icon.Plus size={14} /> {t.customers.newCustomer}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">
              {t.customers.all} · {all.length}
            </TabsTrigger>
            <TabsTrigger value="vip">{t.customers.vip}</TabsTrigger>
            <TabsTrigger value="subscriber">{t.customers.subscribers}</TabsTrigger>
            <TabsTrigger value="new">{t.customers.new}</TabsTrigger>
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
              placeholder={t.customers.searchCustomers}
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
            <p>{t.customers.noMatch}</p>
          </div>
        }
      />
    </div>
  )
}

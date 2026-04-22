'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import {
  ProductInventoryBar,
  ProductPriceCell,
  ProductStatusCell,
  ProductTitleCell,
} from '@/components/products/product-row'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { selectDataSource } from '@/lib/data-source'
import { products as ALL_PRODUCTS } from '@/lib/mocks'
import { relativeTime } from '@/lib/format'
import { trpc } from '@/lib/trpc'
import type { Product } from '@/lib/types'

/** Medusa product summary → local UI `Product` type. */
interface MedusaProductRow {
  id: string
  title: string
  handle: string
  status: 'draft' | 'published'
  thumbnail: string | null
  variantsCount: number
  inventoryQuantity: number
  priceUsd: number
  updatedAt: string | Date
}

function adaptTrpcProduct(row: MedusaProductRow, siteId: string): Product {
  return {
    id: row.id,
    siteId,
    title: row.title,
    handle: row.handle,
    status: row.status === 'published' ? 'active' : 'draft',
    inventory: row.inventoryQuantity,
    priceCents: Math.round((row.priceUsd ?? 0) * 100),
    images: row.thumbnail ? [row.thumbnail] : ['📦'],
    collections: [],
    vendor: '',
    createdAt:
      typeof row.updatedAt === 'string' ? row.updatedAt : new Date(row.updatedAt).toISOString(),
  }
}

export default function ProductsPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'product-list', siteId: params.siteId })
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [query, setQuery] = useState('')

  const listQuery = trpc.products.list.useQuery(
    { siteId: params.siteId, limit: 100 },
    { retry: false },
  )

  const trpcRows = useMemo(() => {
    const items = (listQuery.data as { items?: MedusaProductRow[] } | undefined)?.items
    if (!items) return undefined
    return items.map((r) => adaptTrpcProduct(r, params.siteId))
  }, [listQuery.data, params.siteId])

  const fallbackRows = useMemo(
    () => ALL_PRODUCTS.filter((p) => p.siteId === params.siteId),
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
      .filter((p) => (filter === 'all' ? true : p.status === filter))
      .filter((p) =>
        query.trim().length === 0
          ? true
          : `${p.title} ${p.handle} ${p.vendor}`.toLowerCase().includes(query.toLowerCase()),
      )
  }, [filter, query, all])

  const counts = useMemo(() => {
    return {
      all: all.length,
      active: all.filter((p) => p.status === 'active').length,
      draft: all.filter((p) => p.status === 'draft').length,
      archived: all.filter((p) => p.status === 'archived').length,
    }
  }, [all])

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'title',
      header: 'Product',
      render: (p) => <ProductTitleCell product={p} siteId={params.siteId} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (p) => <ProductStatusCell product={p} />,
    },
    {
      key: 'inventory',
      header: 'Stock',
      width: '110px',
      align: 'right',
      render: (p) => <ProductInventoryBar inventory={p.inventory} />,
    },
    {
      key: 'price',
      header: 'Price',
      width: '160px',
      align: 'right',
      render: (p) => <ProductPriceCell product={p} />,
    },
    {
      key: 'collections',
      header: 'Collections',
      width: '180px',
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.collections.length === 0 ? (
            <span className="text-caption text-text-muted font-mono">—</span>
          ) : (
            p.collections.map((c) => (
              <Badge key={c} tone="outline">
                {c}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      width: '120px',
      align: 'right',
      render: (p) => (
        <span className="text-caption text-text-muted font-mono">{relativeTime(p.createdAt)}</span>
      ),
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage your catalog. Use Copilot to bulk-rewrite copy, regenerate hero images, or suggest pricing."
        meta={
          ds.source === 'mock' ? (
            <Badge tone="outline">demo data — connect Medusa to see real catalog</Badge>
          ) : (
            <Badge tone="success" dot>
              live data
            </Badge>
          )
        }
        actions={
          <>
            <Button variant="secondary">
              <Icon.Sparkle size={14} /> Generate w/ AI
            </Button>
            <Button>
              <Icon.Plus size={14} /> New product
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All · {counts.all}</TabsTrigger>
            <TabsTrigger value="active">Active · {counts.active}</TabsTrigger>
            <TabsTrigger value="draft">Draft · {counts.draft}</TabsTrigger>
            <TabsTrigger value="archived">Archived · {counts.archived}</TabsTrigger>
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
              placeholder="Search products"
              className="w-60 pl-8"
            />
          </div>
          <Button size="md" variant="ghost">
            <Icon.Filter size={14} /> Filter
          </Button>
          <Button size="md" variant="ghost">
            <Icon.Download size={14} /> Export
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => router.push(`/sites/${params.siteId}/products/${p.id}`)}
        empty={
          <div className="text-text-muted flex flex-col items-center gap-2">
            <Icon.Box size={28} />
            <p>No products match these filters.</p>
          </div>
        }
      />
    </div>
  )
}

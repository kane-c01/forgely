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
import { products as ALL_PRODUCTS } from '@/lib/mocks'
import { relativeTime } from '@/lib/format'
import type { Product } from '@/lib/types'

export default function ProductsPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'product-list', siteId: params.siteId })
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    return ALL_PRODUCTS.filter((p) => p.siteId === params.siteId)
      .filter((p) => (filter === 'all' ? true : p.status === filter))
      .filter((p) =>
        query.trim().length === 0
          ? true
          : `${p.title} ${p.handle} ${p.vendor}`.toLowerCase().includes(query.toLowerCase()),
      )
  }, [filter, query, params.siteId])

  const counts = useMemo(() => {
    const all = ALL_PRODUCTS.filter((p) => p.siteId === params.siteId)
    return {
      all: all.length,
      active: all.filter((p) => p.status === 'active').length,
      draft: all.filter((p) => p.status === 'draft').length,
      archived: all.filter((p) => p.status === 'archived').length,
    }
  }, [params.siteId])

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'title',
      header: 'Product',
      render: (p) => <ProductTitleCell product={p} siteId={params.siteId} />,
    },
    { key: 'status', header: 'Status', width: '120px', render: (p) => <ProductStatusCell product={p} /> },
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
            <span className="font-mono text-caption text-text-muted">—</span>
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
        <span className="font-mono text-caption text-text-muted">
          {relativeTime(p.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage your catalog. Use Copilot to bulk-rewrite copy, regenerate hero images, or suggest pricing."
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
            <Icon.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
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
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <Icon.Box size={28} />
            <p>No products match these filters.</p>
          </div>
        }
      />
    </div>
  )
}

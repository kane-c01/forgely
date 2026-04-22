'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { useT } from '@/lib/i18n'
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

interface MedusaProductSummary {
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

const PENDING_MEDUSA_PREFIXES = [
  'prod_pending_medusa',
  'order_pending_medusa',
  'cus_pending_medusa',
]
const isPendingMedusaRow = (id: string): boolean =>
  PENDING_MEDUSA_PREFIXES.some((p) => id.startsWith(p))

function adaptMedusaProduct(p: MedusaProductSummary, siteId: string): Product {
  return {
    id: p.id,
    siteId,
    title: p.title,
    handle: p.handle,
    status: p.status === 'published' ? 'active' : 'draft',
    inventory: p.inventoryQuantity,
    priceCents: Math.round(p.priceUsd * 100),
    images: p.thumbnail ? [p.thumbnail] : ['📦'],
    collections: [],
    vendor: '',
    createdAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date(p.updatedAt).toISOString(),
  }
}

export default function ProductsPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'product-list', siteId: params.siteId })
  const t = useT()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [query, setQuery] = useState('')

  const trpcQuery = trpc.products.list.useQuery({ siteId: params.siteId }, { retry: false })

  const trpcRows = useMemo(() => {
    const items = (trpcQuery.data as { items?: MedusaProductSummary[] } | undefined)?.items
    if (!items || items.length === 0) return undefined
    const real = items.filter((it) => !isPendingMedusaRow(it.id))
    if (real.length === 0) return undefined
    return real.map((it) => adaptMedusaProduct(it, params.siteId))
  }, [trpcQuery.data, params.siteId])

  const fallbackRows = useMemo(
    () => ALL_PRODUCTS.filter((p) => p.siteId === params.siteId),
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
      header: t.products.colProduct,
      render: (p) => <ProductTitleCell product={p} siteId={params.siteId} />,
    },
    {
      key: 'status',
      header: t.products.colStatus,
      width: '120px',
      render: (p) => <ProductStatusCell product={p} />,
    },
    {
      key: 'inventory',
      header: t.products.colStock,
      width: '110px',
      align: 'right',
      render: (p) => <ProductInventoryBar inventory={p.inventory} />,
    },
    {
      key: 'price',
      header: t.products.colPrice,
      width: '160px',
      align: 'right',
      render: (p) => <ProductPriceCell product={p} />,
    },
    {
      key: 'collections',
      header: t.products.colCollections,
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
      header: t.products.colAdded,
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
        eyebrow={t.products.eyebrow}
        title={t.products.title}
        description={t.products.description}
        meta={
          ds.source === 'mock' ? (
            <Badge tone="outline">{t.products.demoData}</Badge>
          ) : (
            <Badge tone="success" dot>
              {t.products.liveData}
            </Badge>
          )
        }
        actions={
          <>
            <Button variant="secondary">
              <Icon.Sparkle size={14} /> <>{t.products.generateAi}</>
            </Button>
            <Button>
              <Icon.Plus size={14} /> {t.products.newProduct}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">
              {t.products.all} · {counts.all}
            </TabsTrigger>
            <TabsTrigger value="active">
              {t.products.active} · {counts.active}
            </TabsTrigger>
            <TabsTrigger value="draft">
              {t.products.draft} · {counts.draft}
            </TabsTrigger>
            <TabsTrigger value="archived">
              {t.products.archived} · {counts.archived}
            </TabsTrigger>
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
              placeholder={t.products.searchProducts}
              className="w-60 pl-8"
            />
          </div>
          <Button size="md" variant="ghost">
            <Icon.Filter size={14} /> {t.products.filter}
          </Button>
          <Button size="md" variant="ghost">
            <Icon.Download size={14} /> {t.products.export}
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
            <p>{t.products.noMatch}</p>
          </div>
        }
      />
    </div>
  )
}

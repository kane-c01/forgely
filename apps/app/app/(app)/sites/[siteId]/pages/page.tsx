'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cmsPagesForSite, type CmsPage } from '@/lib/cms-mocks'
import { relativeTime } from '@/lib/format'

const STATUS_TONE = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
} as const

export default function PagesIndex({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'global' })
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | CmsPage['status']>('all')
  const [query, setQuery] = useState('')

  const all = useMemo(() => cmsPagesForSite(params.siteId), [params.siteId])
  const rows = useMemo(
    () =>
      all
        .filter((p) => (filter === 'all' ? true : p.status === filter))
        .filter((p) =>
          query.trim().length === 0
            ? true
            : `${p.title} ${p.slug} ${p.author}`.toLowerCase().includes(query.toLowerCase()),
        ),
    [all, filter, query],
  )

  const columns: DataTableColumn<CmsPage>[] = [
    {
      key: 'title',
      header: 'Page',
      render: (p) => (
        <Link
          href={`/sites/${params.siteId}/pages/${p.id}`}
          className="text-text-primary hover:text-forge-amber flex flex-col"
        >
          <span className="font-medium">{p.title}</span>
          <span className="text-caption text-text-muted font-mono">{p.slug}</span>
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (p) => (
        <Badge tone={STATUS_TONE[p.status]} dot={p.status !== 'archived'}>
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Summary',
      render: (p) => (
        <span className="text-small text-text-secondary line-clamp-1">{p.description ?? '—'}</span>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      width: '120px',
      render: (p) => <span className="text-caption text-text-muted font-mono">{p.author}</span>,
    },
    {
      key: 'updated',
      header: 'Updated',
      width: '140px',
      align: 'right',
      render: (p) => (
        <span className="text-caption text-text-muted font-mono">{relativeTime(p.updatedAt)}</span>
      ),
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="CMS pages"
        description="Long-form pages outside the storefront — About, Press, Policies, FAQ."
        actions={
          <>
            <Button variant="ghost">
              <Icon.Sparkle size={14} /> Generate w/ AI
            </Button>
            <Button>
              <Icon.Plus size={14} /> New page
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All · {all.length}</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Icon.Search
            size={14}
            className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug or author"
            className="w-72 pl-8"
          />
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(p) => p.id}
        onRowClick={(p) => router.push(`/sites/${params.siteId}/pages/${p.id}`)}
        empty={
          <div className="text-text-muted flex flex-col items-center gap-2">
            <Icon.Globe size={28} />
            <p>No pages match these filters.</p>
          </div>
        }
      />
    </div>
  )
}

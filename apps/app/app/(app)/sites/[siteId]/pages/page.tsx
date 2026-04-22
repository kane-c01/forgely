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
import { useT } from '@/lib/i18n'
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
  const t = useT()
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
      header: t.cmsPages.colPage,
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
      header: t.cmsPages.colStatus,
      width: '120px',
      render: (p) => (
        <Badge tone={STATUS_TONE[p.status]} dot={p.status !== 'archived'}>
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: t.cmsPages.colSummary,
      render: (p) => (
        <span className="text-small text-text-secondary line-clamp-1">{p.description ?? '—'}</span>
      ),
    },
    {
      key: 'author',
      header: t.cmsPages.colAuthor,
      width: '120px',
      render: (p) => <span className="text-caption text-text-muted font-mono">{p.author}</span>,
    },
    {
      key: 'updated',
      header: t.cmsPages.colUpdated,
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
        eyebrow={t.cmsPages.eyebrow}
        title={t.cmsPages.title}
        description={t.cmsPages.description}
        actions={
          <>
            <Button variant="ghost">
              <Icon.Sparkle size={14} /> {t.cmsPages.generateAi}
            </Button>
            <Button>
              <Icon.Plus size={14} /> {t.cmsPages.newPage}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">
              {t.cmsPages.all} · {all.length}
            </TabsTrigger>
            <TabsTrigger value="published">{t.cmsPages.published}</TabsTrigger>
            <TabsTrigger value="draft">{t.cmsPages.draft}</TabsTrigger>
            <TabsTrigger value="archived">{t.cmsPages.archived}</TabsTrigger>
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
            placeholder={t.cmsPages.searchPlaceholder}
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
            <p>{t.cmsPages.noMatch}</p>
          </div>
        }
      />
    </div>
  )
}

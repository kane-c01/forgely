'use client'

import { useMemo, useState } from 'react'

import {
  Badge,
  DataTable,
  SectionCard,
  StatCard,
  SuperButton,
  type DataTableColumn,
} from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import {
  formatCount,
  formatRelative,
  MOCK_NOW_UTC_MS,
  type ContentKind,
  type ContentLocale,
  type ContentStatus,
  type SuperContentRow,
} from '@/lib/super'

const STATUS_TONE: Record<ContentStatus, 'success' | 'warning' | 'neutral' | 'error'> = {
  published: 'success',
  scheduled: 'warning',
  draft: 'neutral',
  archived: 'error',
}

export function ContentClient({ items }: { items: SuperContentRow[] }) {
  const t = useT()
  const [kind, setKind] = useState<ContentKind | 'all'>('all')

  const kindLabel: Record<ContentKind, string> = {
    docs: t.super.content.docs,
    blog: t.super.content.blog,
    legal: t.super.content.legal,
    help: t.super.content.help,
  }
  const statusLabel: Record<ContentStatus, string> = {
    draft: t.super.content.statusDraft,
    published: t.super.content.statusPublished,
    scheduled: t.super.content.statusScheduled,
    archived: t.super.content.statusArchived,
  }
  const localeLabel: Record<ContentLocale, string> = {
    'zh-CN': t.super.content.localeZh,
    en: t.super.content.localeEn,
  }

  const filtered = useMemo(() => {
    if (kind === 'all') return items
    return items.filter((i) => i.kind === kind)
  }, [items, kind])

  const bilingual = items.filter((i) => i.localesAvailable.length >= 2).length
  const bilingualPercent = items.length > 0 ? Math.round((bilingual / items.length) * 100) : 0

  const columns: DataTableColumn<SuperContentRow>[] = [
    {
      key: 'title',
      header: t.super.content.colTitle,
      render: (r) => (
        <div className="min-w-0">
          <div className="text-small text-text-primary">{r.title}</div>
          <div className="text-caption text-text-muted font-mono">{r.path}</div>
        </div>
      ),
      sortAccessor: (r) => r.title,
    },
    {
      key: 'kind',
      header: t.super.common.filterAll,
      render: (r) => <Badge tone="forge">{kindLabel[r.kind]}</Badge>,
    },
    {
      key: 'locale',
      header: t.super.content.colLocale,
      render: (r) => (
        <div className="flex gap-1">
          {r.localesAvailable.map((l) => (
            <Badge key={l} tone={l === r.primaryLocale ? 'info' : 'neutral'}>
              {localeLabel[l]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: t.super.content.colStatus,
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{statusLabel[r.status]}</Badge>,
    },
    {
      key: 'author',
      header: t.super.content.colAuthor,
      render: (r) => <span className="text-small text-text-secondary">{r.author}</span>,
    },
    {
      key: 'updated',
      header: t.super.content.colUpdated,
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {formatRelative(r.updatedAt, MOCK_NOW_UTC_MS)}
        </span>
      ),
      sortAccessor: (r) => r.updatedAt,
    },
  ]

  const published = items.filter((i) => i.status === 'published').length
  const drafts = items.filter((i) => i.status === 'draft').length

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.super.content.totalPosts}
          value={formatCount(items.length)}
          accent="info"
        />
        <StatCard
          label={t.super.content.publishedPosts}
          value={formatCount(published)}
          accent="success"
        />
        <StatCard label={t.super.content.draftPosts} value={formatCount(drafts)} accent="data-4" />
        <StatCard
          label={t.super.content.translationsLabel}
          value={`${bilingualPercent}%`}
          accent="forge"
          hint={`${bilingual} / ${items.length}`}
        />
      </div>

      <SectionCard
        title={t.super.content.title}
        bodyClassName="p-0"
        action={
          <div className="flex flex-wrap items-center gap-1">
            {(['all', 'docs', 'blog', 'legal', 'help'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={
                  'text-caption border px-2.5 py-1 font-mono uppercase tracking-[0.16em] transition-colors ' +
                  (kind === id
                    ? 'border-forge-ember bg-forge-orange/15 text-forge-amber'
                    : 'border-border-subtle text-text-muted hover:text-text-primary')
                }
              >
                {id === 'all' ? t.super.common.filterAll : kindLabel[id]}
              </button>
            ))}
            <SuperButton size="sm" variant="primary">
              {t.super.content.newPost}
            </SuperButton>
          </div>
        }
      >
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          initialSort={{ key: 'updated', direction: 'desc' }}
          emptyState={t.super.content.emptyPlaceholder}
        />
      </SectionCard>
    </div>
  )
}

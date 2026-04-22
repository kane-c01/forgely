'use client'

import { useMemo, useState } from 'react'

import { useCopilot, useCopilotContext } from '@/components/copilot/copilot-provider'
import { useT } from '@/lib/i18n'
import { MediaCard } from '@/components/media/media-card'
import { MediaDetailDrawer } from '@/components/media/media-detail-drawer'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mediaAssets as ALL_ASSETS } from '@/lib/mocks'
import type { MediaAsset, MediaKind } from '@/lib/types'

export default function MediaPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'media', siteId: params.siteId })
  const copilot = useCopilot()
  const t = useT()

  const FILTERS: Array<{
    value: 'all' | MediaKind
    label: string
    icon: 'Image' | 'Brand' | 'Box'
  }> = [
    { value: 'all', label: t.media.all, icon: 'Image' },
    { value: 'logo', label: t.media.logos, icon: 'Brand' },
    { value: 'product-photo', label: t.media.product, icon: 'Box' },
    { value: 'lifestyle', label: t.media.lifestyle, icon: 'Image' },
    { value: 'video', label: t.media.video, icon: 'Image' },
    { value: '3d', label: t.media.threeD, icon: 'Box' },
    { value: 'icon', label: t.media.icons, icon: 'Image' },
  ]
  const [filter, setFilter] = useState<'all' | MediaKind>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MediaAsset | null>(null)

  const rows = useMemo(() => {
    return ALL_ASSETS.filter((a) => (a.siteId ? a.siteId === params.siteId : true))
      .filter((a) => (filter === 'all' ? true : a.kind === filter))
      .filter((a) =>
        query.trim().length === 0
          ? true
          : `${a.filename} ${a.prompt ?? ''}`.toLowerCase().includes(query.toLowerCase()),
      )
  }, [filter, query, params.siteId])

  const totalSize = useMemo(() => rows.reduce((s, a) => s + a.sizeKb, 0) / 1024, [rows])

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow={t.media.eyebrow}
        title={t.media.title}
        description={t.media.description}
        actions={
          <>
            <Button variant="ghost">
              <Icon.Upload size={14} /> {t.media.upload}
            </Button>
            <Button
              onClick={() => {
                copilot.setOpen(true)
                void copilot.send('Generate 3 hero photos for the homepage in warm tones.')
              }}
            >
              <Icon.Sparkle size={14} /> {t.media.generateAi}
            </Button>
          </>
        }
        meta={
          <>
            <span>
              {rows.length} {t.media.assets}
            </span>
            <span>·</span>
            <span className="text-text-secondary tabular-nums">{totalSize.toFixed(1)} MB</span>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
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
              placeholder={t.media.searchMedia}
              className="w-72 pl-8"
            />
          </div>
          <Badge tone="outline">{t.media.grid}</Badge>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Icon.Image size={28} />}
          title={t.media.noAssets}
          description={t.media.noAssetsDesc}
          action={
            <Button>
              <Icon.Upload size={14} /> {t.media.uploadFirst}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map((a) => (
            <MediaCard
              key={a.id}
              asset={a}
              selected={selected?.id === a.id}
              onClick={() => setSelected(a)}
            />
          ))}
        </div>
      )}

      <MediaDetailDrawer asset={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

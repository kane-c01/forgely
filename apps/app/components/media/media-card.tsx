'use client'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import type { MediaAsset } from '@/lib/types'

interface MediaCardProps {
  asset: MediaAsset
  selected?: boolean
  onClick?: () => void
}

const SOURCE_TONE = {
  uploaded: 'neutral',
  'ai-generated': 'forge',
  library: 'info',
} as const

export function MediaCard({ asset, selected, onClick }: MediaCardProps) {
  const t = useT()
  const isVideo = asset.kind === 'video' || asset.filename.endsWith('.mp4')
  const is3d = asset.kind === '3d' || asset.filename.endsWith('.glb')

  const sourceLabel =
    asset.source === 'ai-generated'
      ? `${t.mediaCard.aiPrefix} ${asset.generator}`
      : asset.source === 'uploaded'
        ? t.mediaCard.uploaded
        : t.mediaCard.library

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bg-bg-surface group flex flex-col overflow-hidden rounded-lg border text-left transition-all',
        selected
          ? 'border-forge-orange shadow-[0_0_0_1px_rgba(255,107,26,0.6),0_0_24px_rgba(255,107,26,0.18)]'
          : 'border-border-subtle hover:border-border-strong',
      )}
    >
      <div className="from-bg-elevated to-bg-deep relative flex aspect-square items-center justify-center bg-gradient-to-br text-[60px]">
        <span aria-hidden>{asset.url}</span>
        <Badge tone={SOURCE_TONE[asset.source]} className="absolute left-2 top-2 !text-[10px]">
          {sourceLabel}
        </Badge>
        {isVideo ? (
          <span className="text-text-secondary absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="bg-bg-void/60 text-text-primary grid h-12 w-12 place-items-center rounded-full backdrop-blur">
              ▶
            </span>
          </span>
        ) : null}
        {is3d ? (
          <Badge tone="info" className="absolute right-2 top-2 !text-[10px]">
            {t.mediaCard.glb}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-small text-text-primary truncate font-medium">{asset.filename}</p>
        <p className="text-caption text-text-muted flex items-center gap-2 font-mono">
          {asset.width > 0 ? (
            <span>
              {asset.width}×{asset.height}
            </span>
          ) : (
            <span>—</span>
          )}
          <span className="text-text-subtle">·</span>
          <span>{(asset.sizeKb / 1024).toFixed(1)} MB</span>
          {asset.uses > 0 ? (
            <>
              <span className="text-text-subtle">·</span>
              <span className="text-forge-amber inline-flex items-center gap-1">
                <Icon.Check size={10} /> {asset.uses}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </button>
  )
}

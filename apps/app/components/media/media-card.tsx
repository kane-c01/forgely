import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
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
  const isVideo = asset.kind === 'video' || asset.filename.endsWith('.mp4')
  const is3d = asset.kind === '3d' || asset.filename.endsWith('.glb')
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border bg-bg-surface text-left transition-all',
        selected
          ? 'border-forge-orange shadow-[0_0_0_1px_rgba(255,107,26,0.6),0_0_24px_rgba(255,107,26,0.18)]'
          : 'border-border-subtle hover:border-border-strong',
      )}
    >
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-bg-elevated to-bg-deep text-[60px]">
        <span aria-hidden>{asset.url}</span>
        <Badge tone={SOURCE_TONE[asset.source]} className="absolute left-2 top-2 !text-[10px]">
          {asset.source === 'ai-generated' ? `AI · ${asset.generator}` : asset.source}
        </Badge>
        {isVideo ? (
          <span className="absolute inset-0 flex items-center justify-center text-text-secondary opacity-0 transition-opacity group-hover:opacity-100">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-bg-void/60 text-text-primary backdrop-blur">
              ▶
            </span>
          </span>
        ) : null}
        {is3d ? (
          <Badge tone="info" className="absolute right-2 top-2 !text-[10px]">
            GLB
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-small font-medium text-text-primary">{asset.filename}</p>
        <p className="flex items-center gap-2 font-mono text-caption text-text-muted">
          {asset.width > 0 ? <span>{asset.width}×{asset.height}</span> : <span>—</span>}
          <span className="text-text-subtle">·</span>
          <span>{(asset.sizeKb / 1024).toFixed(1)} MB</span>
          {asset.uses > 0 ? (
            <>
              <span className="text-text-subtle">·</span>
              <span className="inline-flex items-center gap-1 text-forge-amber">
                <Icon.Check size={10} /> {asset.uses}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </button>
  )
}

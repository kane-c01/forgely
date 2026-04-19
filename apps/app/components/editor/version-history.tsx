'use client'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'

import { useEditor } from './editor-store'

export function VersionHistory() {
  const editor = useEditor()
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
        <Icon.History size={12} /> Version history
      </div>
      <ol className="flex flex-col gap-1">
        {editor.versions.map((v, i) => (
          <li
            key={v.id}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-small',
              i === 0 && 'border-forge-orange/40',
            )}
          >
            <div className="flex flex-col">
              <span className="text-text-primary">{v.label}</span>
              <span className="font-mono text-caption text-text-muted">
                {v.byline} · {relativeTime(v.createdAt)}
              </span>
            </div>
            <Badge tone={v.source === 'ai' ? 'forge' : v.source === 'autosave' ? 'outline' : 'neutral'}>
              {v.source}
            </Badge>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-caption text-text-muted">
        Past 30 days are restorable. Older snapshots can be deleted from Settings.
      </p>
    </div>
  )
}

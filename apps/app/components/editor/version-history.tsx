'use client'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import { useT } from '@/lib/i18n'

import { useEditor } from './editor-store'

export function VersionHistory() {
  const editor = useEditor()
  const t = useT()
  return (
    <div>
      <div className="text-caption text-text-muted mb-3 flex items-center gap-2 font-mono uppercase tracking-[0.12em]">
        <Icon.History size={12} /> {t.editor.versionHistory}
      </div>
      <ol className="flex flex-col gap-1">
        {editor.versions.map((v, i) => (
          <li
            key={v.id}
            className={cn(
              'border-border-subtle bg-bg-surface text-small flex items-center justify-between gap-2 rounded-md border px-3 py-2',
              i === 0 && 'border-forge-orange/40',
            )}
          >
            <div className="flex flex-col">
              <span className="text-text-primary">{v.label}</span>
              <span className="text-caption text-text-muted font-mono">
                {v.byline} · {relativeTime(v.createdAt)}
              </span>
            </div>
            <Badge
              tone={v.source === 'ai' ? 'forge' : v.source === 'autosave' ? 'outline' : 'neutral'}
            >
              {v.source}
            </Badge>
          </li>
        ))}
      </ol>
      <p className="text-caption text-text-muted mt-3">{t.editor.versionHistoryHint}</p>
    </div>
  )
}

'use client'

import { useState, type DragEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'

import { BLOCK_LIBRARY, useEditor } from './editor-store'

export function BlocksList() {
  const editor = useEditor()
  const t = useT()
  const [showLibrary, setShowLibrary] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const onDragStart = (e: DragEvent<HTMLLIElement>, blockId: string) => {
    setDragId(blockId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', blockId)
  }

  const onDragOver = (e: DragEvent<HTMLLIElement>, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== idx) setDragOverIdx(idx)
  }

  const onDrop = (e: DragEvent<HTMLLIElement>, targetIdx: number) => {
    e.preventDefault()
    if (!dragId) return
    editor.moveBlock(dragId, targetIdx)
    setDragId(null)
    setDragOverIdx(null)
  }

  const onDragEnd = () => {
    setDragId(null)
    setDragOverIdx(null)
  }

  return (
    <aside className="border-border-subtle bg-bg-deep flex h-full w-[280px] shrink-0 flex-col border-r">
      {/* Pages */}
      <div className="border-border-subtle border-b px-4 py-3">
        <p className="text-caption text-text-muted mb-2 font-mono uppercase tracking-[0.18em]">
          {t.editor.pages}
        </p>
        <ul className="flex flex-col gap-0.5">
          {editor.pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => editor.selectPage(p.id)}
                className={cn(
                  'text-small flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors',
                  p.id === editor.activePageId
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated/60 hover:text-text-primary',
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon.Globe size={12} className="text-text-muted" /> {p.name}
                </span>
                <span className="text-caption text-text-muted font-mono">{p.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Blocks */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
            {t.editor.blocks} · {editor.activePage.blocks.length}
          </p>
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            aria-label={t.editor.addBlock}
            className="text-text-secondary hover:bg-bg-elevated hover:text-forge-amber rounded-md p-1"
          >
            <Icon.Plus size={14} />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-3">
          {editor.activePage.blocks.map((b, i) => {
            const isFirst = i === 0
            const isLast = i === editor.activePage.blocks.length - 1
            const isActive = editor.selectedBlockId === b.id
            const isDragging = dragId === b.id
            const dropTarget = dragOverIdx === i && dragId && dragId !== b.id
            const hideOn = (b.props.hideOn as string[] | undefined) ?? []
            return (
              <li
                key={b.id}
                draggable
                onDragStart={(e) => onDragStart(e, b.id)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={(e) => onDrop(e, i)}
                onDragEnd={onDragEnd}
                className={cn(
                  'bg-bg-surface text-small group relative mb-1 flex items-center gap-2 rounded-md border px-2 py-2 transition-all',
                  isActive
                    ? 'border-forge-orange/40 bg-bg-elevated'
                    : 'border-border-subtle hover:border-border-strong',
                  isDragging && 'opacity-40',
                  dropTarget && 'border-forge-orange shadow-[0_-2px_0_-1px_#FF6B1A_inset]',
                )}
              >
                <span
                  aria-hidden
                  className="text-text-muted/60 group-hover:text-text-secondary cursor-grab transition-colors active:cursor-grabbing"
                >
                  <DragHandleIcon />
                </span>
                <button
                  type="button"
                  onClick={() => editor.selectBlock(b.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="bg-bg-deep text-caption grid h-6 w-6 place-items-center rounded">
                    {BLOCK_LIBRARY.find((x) => x.type === b.type)?.icon ?? '◆'}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-text-primary">
                      {BLOCK_LIBRARY.find((x) => x.type === b.type)?.label ?? b.type}
                    </span>
                    <span className="text-text-muted flex items-center gap-1.5 font-mono text-[10px]">
                      {!b.visible ? <span>{t.editor.hidden}</span> : null}
                      {hideOn.map((d) => (
                        <span
                          key={d}
                          title={`${t.editor.hideBlock} (${d})`}
                          className="border-border-strong text-text-subtle rounded border px-1"
                        >
                          ⌀{d[0]}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
                <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => editor.toggleBlockVisible(b.id)}
                    aria-label={b.visible ? t.editor.hideBlock : t.editor.showBlock}
                    className="text-text-muted hover:text-text-primary rounded p-1"
                  >
                    {b.visible ? <Icon.Eye size={12} /> : <Icon.EyeOff size={12} />}
                  </button>
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => editor.reorderBlock(b.id, 'up')}
                    aria-label={t.editor.moveUp}
                    className="text-text-muted hover:text-text-primary rounded p-1 disabled:opacity-30"
                  >
                    <Icon.ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => editor.reorderBlock(b.id, 'down')}
                    aria-label={t.editor.moveDown}
                    className="text-text-muted hover:text-text-primary rounded p-1 disabled:opacity-30"
                  >
                    <Icon.ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.duplicateBlock(b.id)}
                    aria-label={t.editor.duplicateBlock}
                    className="text-text-muted hover:text-forge-amber rounded p-1"
                  >
                    <Icon.Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.removeBlock(b.id)}
                    aria-label={t.editor.deleteBlock}
                    className="text-text-muted hover:text-error rounded p-1"
                  >
                    <Icon.Trash size={12} />
                  </button>
                </div>
              </li>
            )
          })}
          {showLibrary ? (
            <li className="border-border-strong bg-bg-deep mt-2 rounded-md border border-dashed p-2">
              <p className="text-caption text-text-muted mb-2 font-mono uppercase tracking-[0.12em]">
                {t.editor.addBlock}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_LIBRARY.map((b) => (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => {
                      editor.addBlock(b.type)
                      setShowLibrary(false)
                    }}
                    className="border-border-subtle bg-bg-surface text-caption text-text-primary hover:border-forge-orange/40 hover:text-forge-amber flex items-center gap-2 rounded border px-2 py-1.5 transition-colors"
                  >
                    <span>{b.icon}</span>
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            </li>
          ) : null}
        </ul>
        <Badge tone="outline" className="mx-3 mb-3 self-start">
          {t.editor.dragToReorder}
        </Badge>
      </div>
    </aside>
  )
}

function DragHandleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  )
}

'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

import { BLOCK_LIBRARY, useEditor } from './editor-store'

export function BlocksList() {
  const editor = useEditor()
  const [showLibrary, setShowLibrary] = useState(false)
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-border-subtle bg-bg-deep">
      {/* Pages */}
      <div className="border-b border-border-subtle px-4 py-3">
        <p className="mb-2 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">Pages</p>
        <ul className="flex flex-col gap-0.5">
          {editor.pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => editor.selectPage(p.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-small transition-colors',
                  p.id === editor.activePageId
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated/60 hover:text-text-primary',
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon.Globe size={12} className="text-text-muted" /> {p.name}
                </span>
                <span className="font-mono text-caption text-text-muted">{p.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Blocks */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
            Blocks · {editor.activePage.blocks.length}
          </p>
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            aria-label="Add block"
            className="rounded-md p-1 text-text-secondary hover:bg-bg-elevated hover:text-forge-amber"
          >
            <Icon.Plus size={14} />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-3">
          {editor.activePage.blocks.map((b, i) => {
            const isFirst = i === 0
            const isLast = i === editor.activePage.blocks.length - 1
            const isActive = editor.selectedBlockId === b.id
            return (
              <li
                key={b.id}
                className={cn(
                  'group mb-1 flex items-center gap-2 rounded-md border bg-bg-surface px-2 py-2 text-small transition-colors',
                  isActive ? 'border-forge-orange/40 bg-bg-elevated' : 'border-border-subtle hover:border-border-strong',
                )}
              >
                <button
                  type="button"
                  onClick={() => editor.selectBlock(b.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="grid h-6 w-6 place-items-center rounded bg-bg-deep text-caption">
                    {BLOCK_LIBRARY.find((x) => x.type === b.type)?.icon ?? '◆'}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-text-primary">
                      {BLOCK_LIBRARY.find((x) => x.type === b.type)?.label ?? b.type}
                    </span>
                    {!b.visible ? (
                      <span className="font-mono text-caption text-text-muted">hidden</span>
                    ) : null}
                  </span>
                </button>
                <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => editor.toggleBlockVisible(b.id)}
                    aria-label={b.visible ? 'Hide block' : 'Show block'}
                    className="rounded p-1 text-text-muted hover:text-text-primary"
                  >
                    {b.visible ? <Icon.Eye size={12} /> : <Icon.EyeOff size={12} />}
                  </button>
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => editor.reorderBlock(b.id, 'up')}
                    aria-label="Move up"
                    className="rounded p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                  >
                    <Icon.ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => editor.reorderBlock(b.id, 'down')}
                    aria-label="Move down"
                    className="rounded p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                  >
                    <Icon.ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.duplicateBlock(b.id)}
                    aria-label="Duplicate block"
                    className="rounded p-1 text-text-muted hover:text-forge-amber"
                  >
                    <Icon.Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.removeBlock(b.id)}
                    aria-label="Delete block"
                    className="rounded p-1 text-text-muted hover:text-error"
                  >
                    <Icon.Trash size={12} />
                  </button>
                </div>
              </li>
            )
          })}
          {showLibrary ? (
            <li className="mt-2 rounded-md border border-dashed border-border-strong bg-bg-deep p-2">
              <p className="mb-2 font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
                Add a block
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
                    className="flex items-center gap-2 rounded border border-border-subtle bg-bg-surface px-2 py-1.5 text-caption text-text-primary transition-colors hover:border-forge-orange/40 hover:text-forge-amber"
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
          drag = ↑↓
        </Badge>
      </div>
    </aside>
  )
}

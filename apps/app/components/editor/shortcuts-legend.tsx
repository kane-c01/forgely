'use client'

import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/icons'

interface Shortcut {
  keys: string[]
  label: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'Z'], label: 'Undo' },
  { keys: ['⌘', '⇧', 'Z'], label: 'Redo' },
  { keys: ['⌘', 'K'], label: 'Command palette' },
  { keys: ['⌘', 'J'], label: 'Open Copilot' },
  { keys: ['↑'], label: 'Move block up' },
  { keys: ['↓'], label: 'Move block down' },
  { keys: ['D'], label: 'Duplicate selected' },
  { keys: ['E'], label: 'Toggle visibility' },
  { keys: ['⌫'], label: 'Delete selected' },
  { keys: ['Esc'], label: 'Deselect block' },
]

/**
 * Compact "?" affordance in the editor toolbar that pops a key cheat
 * sheet on click. Closes on outside click and Escape.
 */
export function ShortcutsLegend() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Keyboard shortcuts"
        className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle bg-bg-elevated text-text-secondary transition-colors hover:border-forge-orange/40 hover:text-forge-amber"
      >
        <kbd className="font-mono text-caption">?</kbd>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[300px] rounded-lg border border-border-subtle bg-bg-surface p-3 shadow-[0_24px_48px_rgba(0,0,0,0.7)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
              <Icon.Sparkle size={12} /> Shortcuts
            </p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {SHORTCUTS.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-small text-text-primary hover:bg-bg-elevated"
              >
                <span>{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <kbd
                      key={`${k}-${i}`}
                      className="min-w-5 rounded border border-border-strong bg-bg-deep px-1 py-0.5 text-center font-mono text-[10px] text-text-muted"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-caption text-text-subtle">
            Tip: shortcuts pause when focus is in a text field.
          </p>
        </div>
      ) : null}
    </div>
  )
}

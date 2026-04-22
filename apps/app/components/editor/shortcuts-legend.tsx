'use client'

import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'

interface Shortcut {
  keys: string[]
  label: string
}

/**
 * Compact "?" affordance in the editor toolbar that pops a key cheat
 * sheet on click. Closes on outside click and Escape.
 */
export function ShortcutsLegend() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const shortcuts: Shortcut[] = [
    { keys: ['⌘', 'Z'], label: t.editor.undo },
    { keys: ['⌘', '⇧', 'Z'], label: t.editor.redo },
    { keys: ['⌘', 'K'], label: t.editor.commandPaletteSc },
    { keys: ['⌘', 'J'], label: t.editor.openCopilotSc },
    { keys: ['↑'], label: t.editor.moveBlockUp },
    { keys: ['↓'], label: t.editor.moveBlockDown },
    { keys: ['D'], label: t.editor.duplicateSelected },
    { keys: ['E'], label: t.editor.toggleVisibility },
    { keys: ['⌫'], label: t.editor.deleteSelected },
    { keys: ['Esc'], label: t.editor.deselectBlock },
  ]
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
        aria-label={t.editor.keyboardShortcuts}
        className="border-border-subtle bg-bg-elevated text-text-secondary hover:border-forge-orange/40 hover:text-forge-amber grid h-8 w-8 place-items-center rounded-md border transition-colors"
      >
        <kbd className="text-caption font-mono">?</kbd>
      </button>
      {open ? (
        <div className="border-border-subtle bg-bg-surface absolute right-0 top-[calc(100%+6px)] z-50 w-[300px] rounded-lg border p-3 shadow-[0_24px_48px_rgba(0,0,0,0.7)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-caption text-text-muted inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em]">
              <Icon.Sparkle size={12} /> {t.editor.shortcuts}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {shortcuts.map((s) => (
              <li
                key={s.label}
                className="text-small text-text-primary hover:bg-bg-elevated flex items-center justify-between gap-2 rounded-md px-2 py-1"
              >
                <span>{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <kbd
                      key={`${k}-${i}`}
                      className="border-border-strong bg-bg-deep text-text-muted min-w-5 rounded border px-1 py-0.5 text-center font-mono text-[10px]"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-caption text-text-subtle mt-2 font-mono">{t.editor.shortcutsTip}</p>
        </div>
      ) : null}
    </div>
  )
}

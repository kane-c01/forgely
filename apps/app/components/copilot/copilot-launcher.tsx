'use client'

import { Icon } from '@/components/ui/icons'
import { useCopilot } from './copilot-provider'

export function CopilotLauncher() {
  const { open, toggle } = useCopilot()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={open ? 'Close Copilot' : 'Open Copilot (⌘J)'}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-forge-orange/40 bg-bg-elevated/95 pl-2.5 pr-3.5 py-2 text-small text-text-primary shadow-[0_0_24px_rgba(255,107,26,0.18),0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur transition-all hover:border-forge-orange/80 hover:shadow-[0_0_36px_rgba(255,107,26,0.32),0_8px_24px_rgba(0,0,0,0.6)]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-forge-orange/15 text-forge-amber">
        <Icon.Sparkle size={14} />
      </span>
      <span className="font-mono text-caption uppercase tracking-[0.12em]">Copilot</span>
      <span className="font-mono text-[10px] text-text-muted">⌘J</span>
    </button>
  )
}

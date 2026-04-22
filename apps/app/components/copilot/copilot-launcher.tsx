'use client'

import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { useCopilot } from './copilot-provider'

export function CopilotLauncher() {
  const { open, toggle } = useCopilot()
  const t = useT()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={open ? t.copilotUi.closeCopilot : t.copilotUi.openCopilotHint}
      className="border-forge-orange/40 bg-bg-elevated/95 text-small text-text-primary hover:border-forge-orange/80 fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border py-2 pl-2.5 pr-3.5 shadow-[0_0_24px_rgba(255,107,26,0.18),0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur transition-all hover:shadow-[0_0_36px_rgba(255,107,26,0.32),0_8px_24px_rgba(0,0,0,0.6)]"
    >
      <span className="bg-forge-orange/15 text-forge-amber grid h-7 w-7 place-items-center rounded-full">
        <Icon.Sparkle size={14} />
      </span>
      <span className="text-caption font-mono uppercase tracking-[0.12em]">
        {t.copilotUi.copilotLabel}
      </span>
      <span className="text-text-muted font-mono text-[10px]">⌘J</span>
    </button>
  )
}

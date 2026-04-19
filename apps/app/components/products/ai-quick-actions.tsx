'use client'

import { useCopilot } from '@/components/copilot/copilot-provider'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'

interface QuickAction {
  label: string
  prompt: string
  emoji: string
}

interface AIQuickActionsProps {
  actions: QuickAction[]
  /** Heading shown above the row. */
  title?: string
}

/**
 * Bar of one-click "ask Copilot" actions used on product detail / order
 * detail / customer detail pages. Each tap opens the Copilot drawer and
 * pre-sends the prompt — Copilot then proposes Tool Use cards which the
 * user confirms.
 *
 * Keeps power-user actions contextual without bloating the toolbar.
 */
export function AIQuickActions({ actions, title = 'AI quick actions' }: AIQuickActionsProps) {
  const copilot = useCopilot()
  const dispatch = (prompt: string) => {
    copilot.setOpen(true)
    void copilot.send(prompt)
  }
  return (
    <div className="rounded-lg border border-forge-orange/25 bg-gradient-to-br from-forge-orange/8 via-bg-surface to-bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-forge-orange/15 text-forge-amber">
          <Icon.Sparkle size={14} />
        </span>
        <p className="font-mono text-caption uppercase tracking-[0.18em] text-forge-amber">{title}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            size="sm"
            variant="secondary"
            onClick={() => dispatch(a.prompt)}
          >
            <span aria-hidden>{a.emoji}</span> {a.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

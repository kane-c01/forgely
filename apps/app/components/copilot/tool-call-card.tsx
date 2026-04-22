'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'

import type { ToolCall } from './types'

interface ToolCallCardProps {
  call: ToolCall
  onConfirm: () => void
  onCancel: () => void
}

export function ToolCallCard({ call, onConfirm, onCancel }: ToolCallCardProps) {
  const t = useT()
  const toolLabels = t.copilotUi.toolLabels as Record<string, string>
  const statusTone =
    call.status === 'done'
      ? 'success'
      : call.status === 'cancelled'
        ? 'neutral'
        : call.status === 'confirmed'
          ? 'forge'
          : call.destructive
            ? 'warning'
            : 'info'

  return (
    <div
      className={cn(
        'bg-bg-deep text-small rounded-lg border p-3',
        call.destructive ? 'border-forge-orange/30' : 'border-border-strong',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-text-primary flex items-center gap-2">
          <span className="bg-bg-elevated text-forge-amber grid h-6 w-6 place-items-center rounded">
            <Icon.Robot size={12} />
          </span>
          <span className="text-caption font-mono uppercase tracking-[0.12em]">
            {toolLabels[call.name] ?? call.name}
          </span>
          {call.destructive ? (
            <Badge tone="warning" className="!text-[10px] tracking-[0.16em]">
              {t.copilotUi.writes}
            </Badge>
          ) : (
            <Badge tone="info" className="!text-[10px] tracking-[0.16em]">
              {t.copilotUi.read}
            </Badge>
          )}
        </div>
        <Badge tone={statusTone} dot={call.status === 'pending' || call.status === 'confirmed'}>
          {call.status}
        </Badge>
      </div>

      <pre className="bg-bg-void/60 text-text-secondary mt-2 overflow-x-auto rounded px-2 py-1.5 font-mono text-[11px] leading-relaxed">
        {JSON.stringify(call.arguments, null, 2)}
      </pre>

      {call.estimatedCredits ? (
        <p className="text-caption text-forge-amber mt-2 inline-flex items-center gap-1.5 font-mono">
          <Icon.Sparkle size={12} /> ~{call.estimatedCredits} {t.copilotUi.credits}
        </p>
      ) : null}

      {call.result ? (
        <p className="bg-success/10 text-caption text-success mt-2 rounded px-2 py-1.5">
          {call.result}
        </p>
      ) : null}

      {call.status === 'pending' ? (
        <div className="mt-3 flex items-center gap-2">
          {call.destructive ? (
            <>
              <Button size="xs" onClick={onConfirm}>
                <Icon.Check size={12} /> {t.copilotUi.confirm}
              </Button>
              <Button size="xs" variant="ghost" onClick={onCancel}>
                {t.copilotUi.cancel}
              </Button>
            </>
          ) : (
            <Button size="xs" variant="secondary" onClick={onConfirm}>
              {t.copilotUi.run}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

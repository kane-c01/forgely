import { Badge, SectionCard, StatusDot } from '@/components/super-ui'
import { formatRelative, getAlertTone, MOCK_NOW_UTC_MS } from '@/lib/super'
import type { SystemAlert } from '@/lib/super'

const TONE_TO_DOT = {
  info: 'live',
  warning: 'warning',
  error: 'error',
} as const

export function AlertsPanel({ alerts }: { alerts: SystemAlert[] }) {
  return (
    <SectionCard
      title={`Alerts (${alerts.length} active)`}
      action={
        <button
          type="button"
          className="font-mono text-caption uppercase tracking-[0.16em] text-text-muted hover:text-text-primary"
        >
          Acknowledge all
        </button>
      }
      bodyClassName="p-0"
    >
      <ul>
        {alerts.length === 0 && (
          <li className="px-5 py-6 text-center text-small text-text-muted">
            All clear — no active alerts.
          </li>
        )}
        {alerts.map((alert, idx) => {
          const tone = getAlertTone(alert.severity)
          return (
            <li
              key={alert.id}
              className={
                'flex items-start gap-3 px-5 py-3' +
                (idx === alerts.length - 1 ? '' : ' border-b border-border-subtle')
              }
            >
              <StatusDot tone={TONE_TO_DOT[tone]} pulse={tone === 'error'} className="mt-1.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge tone={tone}>{alert.severity}</Badge>
                  <span className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
                    {alert.source}
                  </span>
                </div>
                <p className="mt-1 truncate text-small text-text-primary">{alert.message}</p>
              </div>
              <span className="shrink-0 font-mono text-caption tabular-nums text-text-muted">
                {formatRelative(alert.occurredAt, MOCK_NOW_UTC_MS)}
              </span>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

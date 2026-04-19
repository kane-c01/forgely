import { getAuditActions, getAuditActors, getSuperSession, queryAudit } from '@/lib/super'
import { AuditClient } from './_components/AuditClient'

export const metadata = {
  title: 'Audit Log · Forgely Command',
}

export default async function SuperAuditPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return (
      <div className="grid h-[60vh] place-items-center text-center">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-error">
            Restricted
          </div>
          <p className="mt-2 max-w-md text-small text-text-muted">
            Audit Log requires ADMIN or OWNER role. Your current role is{' '}
            <span className="font-mono text-text-secondary">{session.role}</span>.
          </p>
        </div>
      </div>
    )
  }

  const result = queryAudit({ pageSize: 500 })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
            Compliance
          </div>
          <h1 className="font-display text-h2 text-text-primary">Audit Log</h1>
        </div>
        <p className="max-w-md text-small text-text-muted">
          Soft-deleted append-only log of every super-admin action and sensitive system event.
          docs/MASTER.md §20.6.
        </p>
      </header>

      <AuditClient result={result} actions={getAuditActions()} actors={getAuditActors()} />
    </div>
  )
}

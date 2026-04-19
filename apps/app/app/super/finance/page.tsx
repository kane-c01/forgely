import { getFinanceSnapshot, getSuperSession } from '@/lib/super'
import { FinanceClient } from './_components/FinanceClient'

export const metadata = {
  title: 'Finance · Forgely Command',
}

export default async function SuperFinancePage() {
  const session = await getSuperSession()
  if (session.role !== 'OWNER') {
    return (
      <div className="grid h-[60vh] place-items-center text-center">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-error">
            Restricted
          </div>
          <p className="mt-2 max-w-md text-small text-text-muted">
            Finance is owner-only (docs/MASTER.md §20.2). Your current role is{' '}
            <span className="font-mono text-text-secondary">{session.role}</span>.
          </p>
        </div>
      </div>
    )
  }

  const snapshot = getFinanceSnapshot()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
            Money
          </div>
          <h1 className="font-display text-h2 text-text-primary">Finance</h1>
        </div>
        <p className="max-w-md text-small text-text-muted">
          MRR/ARR overview, Stripe payout reconciliation, every credit movement and the refund
          queue. The ledger is append-only and reconciles every 5 minutes.
        </p>
      </header>

      <FinanceClient snapshot={snapshot} />
    </div>
  )
}

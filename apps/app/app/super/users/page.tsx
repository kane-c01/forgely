import { getUserDetail, getUserRows } from '@/lib/super'
import type { SuperUserDetail } from '@/lib/super'
import { UsersClient } from './_components/UsersClient'

export const metadata = {
  title: 'Users · Forgely Command',
}

export default function SuperUsersPage() {
  const rows = getUserRows()
  const details: Record<string, SuperUserDetail> = {}
  for (const row of rows) {
    const d = getUserDetail(row.id)
    if (d) details[row.id] = d
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
            Accounts
          </div>
          <h1 className="font-display text-h2 text-text-primary">Users</h1>
        </div>
        <p className="max-w-md text-small text-text-muted">
          Inspect, suspend or impersonate any account. Every action is appended to the
          audit log with the actor, target and reason.
        </p>
      </header>

      <UsersClient rows={rows} details={details} />
    </div>
  )
}

import {
  Badge,
  DataTable,
  SectionCard,
  StatusDot,
  SuperButton,
} from '@/components/super-ui'
import type { DataTableColumn } from '@/components/super-ui'
import {
  formatRelative,
  formatTimestamp,
  getSuperSession,
  getTeamMembers,
  MOCK_NOW_UTC_MS,
} from '@/lib/super'
import type { SuperRole, TeamMember } from '@/lib/super'

export const metadata = {
  title: 'Team · Forgely Command',
}

const ROLE_TONE: Record<SuperRole, 'forge' | 'info' | 'neutral'> = {
  OWNER: 'forge',
  ADMIN: 'info',
  SUPPORT: 'neutral',
}

const ROLE_DESC: Record<SuperRole, string> = {
  OWNER: 'Full access including finance and team. There can be only one.',
  ADMIN: 'Everything except finance and team management.',
  SUPPORT: 'Read-only access to users, sites and support tickets.',
}

export default async function SuperTeamPage() {
  const session = await getSuperSession()
  if (session.role !== 'OWNER') {
    return (
      <div className="grid h-[60vh] place-items-center text-center">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-error">
            Restricted
          </div>
          <p className="mt-2 max-w-md text-small text-text-muted">
            Team management is owner-only. Your current role is{' '}
            <span className="font-mono text-text-secondary">{session.role}</span>.
          </p>
        </div>
      </div>
    )
  }

  const members = getTeamMembers()
  const counts = members.reduce(
    (acc, m) => {
      acc[m.role] += 1
      if (!m.acceptedAt) acc.pending += 1
      if (!m.twoFactorEnabled) acc.no2fa += 1
      return acc
    },
    { OWNER: 0, ADMIN: 0, SUPPORT: 0, pending: 0, no2fa: 0 },
  )

  const columns: DataTableColumn<TeamMember>[] = [
    {
      key: 'member',
      header: 'Member',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center border border-border-strong bg-bg-elevated font-mono text-small text-forge-amber">
            {m.name
              .split(' ')
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')}
          </div>
          <div className="min-w-0">
            <div className="truncate text-small text-text-primary">{m.name}</div>
            <div className="truncate font-mono text-caption text-text-muted">{m.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) => <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>,
      sortAccessor: (m) => m.role,
    },
    {
      key: 'invited',
      header: 'Invited',
      render: (m) => (
        <span className="font-mono text-caption tabular-nums text-text-muted">
          {formatTimestamp(m.invitedAt)}
        </span>
      ),
      sortAccessor: (m) => m.invitedAt,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) =>
        m.acceptedAt ? (
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="ok" />
            <span className="text-small text-text-primary">Active</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="warning" pulse />
            <span className="text-small text-warning">Invitation pending</span>
          </span>
        ),
      sortAccessor: (m) => (m.acceptedAt ? 1 : 0),
    },
    {
      key: '2fa',
      header: '2FA',
      render: (m) =>
        m.twoFactorEnabled ? (
          <Badge tone="success">Enabled</Badge>
        ) : (
          <Badge tone="error">Required</Badge>
        ),
      sortAccessor: (m) => (m.twoFactorEnabled ? 1 : 0),
    },
    {
      key: 'lastSeen',
      header: 'Last seen',
      align: 'right',
      render: (m) => (
        <span className="font-mono text-caption tabular-nums text-text-muted">
          {m.lastSeenAt ? formatRelative(m.lastSeenAt, MOCK_NOW_UTC_MS) : 'never'}
        </span>
      ),
      sortAccessor: (m) => m.lastSeenAt ?? 0,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <div className="flex justify-end gap-2">
          <SuperButton size="sm" variant="ghost" disabled={m.role === 'OWNER'}>
            Change role
          </SuperButton>
          <SuperButton size="sm" variant="danger" disabled={m.role === 'OWNER'}>
            Remove
          </SuperButton>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
            Internal
          </div>
          <h1 className="font-display text-h2 text-text-primary">Team</h1>
        </div>
        <p className="max-w-md text-small text-text-muted">
          Three-tier role model from docs/MASTER.md §20.2. Promotions and removals are recorded in
          the audit log.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <RoleStat label="OWNER" count={counts.OWNER} accent="forge" desc={ROLE_DESC.OWNER} />
        <RoleStat label="ADMIN" count={counts.ADMIN} accent="info" desc={ROLE_DESC.ADMIN} />
        <RoleStat label="SUPPORT" count={counts.SUPPORT} accent="neutral" desc={ROLE_DESC.SUPPORT} />
        <RoleStat
          label="Pending"
          count={counts.pending}
          accent={counts.pending > 0 ? 'warning' : 'neutral'}
          desc="Invites not yet accepted"
        />
        <RoleStat
          label="No 2FA"
          count={counts.no2fa}
          accent={counts.no2fa > 0 ? 'error' : 'success'}
          desc="Required for ADMIN+"
        />
      </div>

      <SectionCard
        title={`Members · ${members.length}`}
        action={<SuperButton variant="primary">Invite member</SuperButton>}
        bodyClassName="p-0"
      >
        <DataTable rows={members} columns={columns} rowKey={(m) => m.id} initialSort={{ key: 'role', direction: 'asc' }} />
      </SectionCard>
    </div>
  )
}

function RoleStat({
  label,
  count,
  desc,
  accent,
}: {
  label: string
  count: number
  desc: string
  accent: 'forge' | 'info' | 'neutral' | 'warning' | 'error' | 'success'
}) {
  const ACC = {
    forge: 'text-forge-amber',
    info: 'text-info',
    neutral: 'text-text-secondary',
    warning: 'text-warning',
    error: 'text-error',
    success: 'text-success',
  } as const
  return (
    <div className="border border-border-subtle bg-bg-deep px-4 py-3">
      <div className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">
        {label}
      </div>
      <div className={`mt-1 font-mono text-h2 tabular-nums ${ACC[accent]}`}>{count}</div>
      <p className="mt-1 text-caption text-text-muted">{desc}</p>
    </div>
  )
}

'use client'

import { Badge, DataTable, StatusDot, SuperButton } from '@/components/super-ui'
import type { DataTableColumn } from '@/components/super-ui'
import { formatRelative, formatTimestamp, MOCK_NOW_UTC_MS } from '@/lib/super'
import type { SuperRole, TeamMember } from '@/lib/super'

interface Props {
  members: TeamMember[]
}

const ROLE_TONE: Record<SuperRole, 'forge' | 'info' | 'neutral'> = {
  OWNER: 'forge',
  ADMIN: 'info',
  SUPPORT: 'neutral',
}

/**
 * Team table — client island.
 *
 * The parent server page (`page.tsx`) does the auth check + reads the
 * mock list, then hands the rows to this client component. We keep the
 * column definitions here so React Server Components don't try to
 * serialise the `render` callbacks across the RSC boundary (which is
 * what was throwing the 500).
 */
export function TeamClient({ members }: Props) {
  const columns: DataTableColumn<TeamMember>[] = [
    {
      key: 'member',
      header: 'Member',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="border-border-strong bg-bg-elevated text-small text-forge-amber grid h-8 w-8 place-items-center border font-mono">
            {m.name
              .split(' ')
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')}
          </div>
          <div className="min-w-0">
            <div className="text-small text-text-primary truncate">{m.name}</div>
            <div className="text-caption text-text-muted truncate font-mono">{m.email}</div>
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
        <span className="text-caption text-text-muted font-mono tabular-nums">
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
        <span className="text-caption text-text-muted font-mono tabular-nums">
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
    <DataTable
      rows={members}
      columns={columns}
      rowKey={(m) => m.id}
      initialSort={{ key: 'role', direction: 'asc' }}
    />
  )
}

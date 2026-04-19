'use client'

import { useMemo, useState } from 'react'
import {
  Badge,
  DataTable,
  SectionCard,
  StatusDot,
  SuperButton,
} from '@/components/super-ui'
import type { DataTableColumn } from '@/components/super-ui'
import {
  formatCount,
  formatRelative,
  formatUsd,
  MOCK_NOW_UTC_MS,
} from '@/lib/super'
import type {
  SubscriptionPlan,
  SuperUserDetail,
  SuperUserRow,
  UserStatus,
} from '@/lib/super'
import { UserDetailDrawer } from './UserDetailDrawer'

const STATUS_TONE: Record<UserStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  suspended: 'error',
  pending: 'warning',
  banned: 'error',
}

const PLAN_TONE = {
  free: 'neutral',
  starter: 'info',
  pro: 'forge',
  business: 'forge',
} as const

const PLAN_OPTIONS: Array<'all' | SubscriptionPlan> = ['all', 'free', 'starter', 'pro', 'business']
const STATUS_OPTIONS: Array<'all' | UserStatus> = ['all', 'active', 'pending', 'suspended', 'banned']

export interface UsersClientProps {
  rows: SuperUserRow[]
  details: Record<string, SuperUserDetail>
}

export function UsersClient({ rows, details }: UsersClientProps) {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<(typeof PLAN_OPTIONS)[number]>('all')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('all')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (planFilter !== 'all' && row.plan !== planFilter) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (needle && !`${row.email} ${row.name} ${row.id}`.toLowerCase().includes(needle))
        return false
      return true
    })
  }, [rows, search, planFilter, statusFilter])

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1
        acc.byStatus[row.status] = (acc.byStatus[row.status] ?? 0) + 1
        acc.byPlan[row.plan] = (acc.byPlan[row.plan] ?? 0) + 1
        return acc
      },
      {
        total: 0,
        byStatus: {} as Record<UserStatus, number>,
        byPlan: {} as Record<SubscriptionPlan, number>,
      },
    )
  }, [rows])

  const columns: DataTableColumn<SuperUserRow>[] = [
    {
      key: 'user',
      header: 'User',
      width: '32%',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center border border-border-strong bg-bg-elevated font-mono text-caption text-forge-amber">
            {row.name
              .split(' ')
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')}
          </div>
          <div className="min-w-0">
            <div className="truncate text-small text-text-primary">{row.name}</div>
            <div className="truncate font-mono text-caption text-text-muted">{row.email}</div>
          </div>
        </div>
      ),
      sortAccessor: (row) => row.email,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot
            tone={
              STATUS_TONE[row.status] === 'error'
                ? 'error'
                : STATUS_TONE[row.status] === 'warning'
                  ? 'warning'
                  : 'ok'
            }
          />
          <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
        </span>
      ),
      sortAccessor: (row) => row.status,
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (row) => <Badge tone={PLAN_TONE[row.plan]}>{row.plan}</Badge>,
      sortAccessor: (row) => row.plan,
    },
    {
      key: 'sites',
      header: 'Sites',
      align: 'right',
      render: (row) => (
        <span className="font-mono tabular-nums">{row.sitesCount}</span>
      ),
      sortAccessor: (row) => row.sitesCount,
    },
    {
      key: 'credits',
      header: 'Credits',
      align: 'right',
      render: (row) => (
        <span className="font-mono tabular-nums text-forge-amber">
          {formatCount(row.creditsBalance)}
        </span>
      ),
      sortAccessor: (row) => row.creditsBalance,
    },
    {
      key: 'spend',
      header: 'LTV',
      align: 'right',
      render: (row) => (
        <span className="font-mono tabular-nums">{formatUsd(row.lifetimeSpendUsd)}</span>
      ),
      sortAccessor: (row) => row.lifetimeSpendUsd,
    },
    {
      key: 'lastSeen',
      header: 'Last seen',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-caption tabular-nums text-text-muted">
          {row.lastSeenAt ? formatRelative(row.lastSeenAt, MOCK_NOW_UTC_MS) : 'never'}
        </span>
      ),
      sortAccessor: (row) => row.lastSeenAt ?? 0,
    },
  ]

  function openRow(row: SuperUserRow) {
    setSelectedId(row.id)
    setDrawerOpen(true)
  }

  const selected = selectedId ? rows.find((r) => r.id === selectedId) : undefined
  const detail = selectedId ? details[selectedId] : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={formatCount(counts.total)} />
        <Stat label="Active" value={formatCount(counts.byStatus.active ?? 0)} accent="success" />
        <Stat
          label="Suspended"
          value={formatCount(counts.byStatus.suspended ?? 0)}
          accent="error"
        />
        <Stat label="Pro+" value={formatCount((counts.byPlan.pro ?? 0) + (counts.byPlan.business ?? 0))} accent="forge" />
      </div>

      <SectionCard
        title={`Users · ${filtered.length} of ${rows.length}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, name, id…"
              className="h-8 w-56 border border-border-subtle bg-bg-deep px-3 text-small text-text-primary placeholder:text-text-subtle focus:border-forge-amber focus:outline-none"
            />
            <Select
              label="plan"
              value={planFilter}
              onChange={(v) => setPlanFilter(v as typeof planFilter)}
              options={PLAN_OPTIONS.map((p) => ({ value: p, label: p }))}
            />
            <Select
              label="status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
            <SuperButton variant="ghost" onClick={() => { setSearch(''); setPlanFilter('all'); setStatusFilter('all') }}>
              Reset
            </SuperButton>
          </div>
        }
        bodyClassName="p-0"
      >
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={openRow}
          selectedRowId={selectedId}
          initialSort={{ key: 'lastSeen', direction: 'desc' }}
          emptyState={
            <span>
              No users match the current filters. <button className="underline" onClick={() => { setSearch(''); setPlanFilter('all'); setStatusFilter('all') }}>Reset</button>
            </span>
          }
        />
      </SectionCard>

      <UserDetailDrawer
        user={selected}
        detail={detail}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  accent = 'forge',
}: {
  label: string
  value: string
  accent?: 'forge' | 'success' | 'error' | 'info'
}) {
  const ACC = {
    forge: 'text-forge-amber',
    success: 'text-success',
    error: 'text-error',
    info: 'text-info',
  } as const
  return (
    <div className="border border-border-subtle bg-bg-deep px-4 py-3">
      <div className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">
        {label}
      </div>
      <div className={`mt-1 font-mono text-h3 tabular-nums ${ACC[accent]}`}>{value}</div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="flex items-center gap-1 font-mono text-caption uppercase tracking-[0.16em] text-text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 border border-border-subtle bg-bg-deep px-2 text-small text-text-primary focus:border-forge-amber focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

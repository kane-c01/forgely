'use client'

import { useMemo, useState } from 'react'
import {
  Badge,
  DataTable,
  SectionCard,
  SuperButton,
} from '@/components/super-ui'
import type { DataTableColumn } from '@/components/super-ui'
import {
  formatRelative,
  formatTimestamp,
  MOCK_NOW_UTC_MS,
} from '@/lib/super'
import type {
  AuditActorType,
  AuditLogEntry,
  AuditQueryResult,
} from '@/lib/super'

const ACTOR_TYPE_TONE: Record<AuditActorType, 'forge' | 'info' | 'neutral'> = {
  super_admin: 'forge',
  user: 'info',
  system: 'neutral',
}

const PAGE_SIZES = [25, 50, 100, 200] as const

export interface AuditClientProps {
  result: AuditQueryResult
  actions: readonly string[]
  actors: ReadonlyArray<{ id: string; label: string }>
}

export function AuditClient({ result, actions, actors }: AuditClientProps) {
  const [search, setSearch] = useState('')
  const [actor, setActor] = useState<string>('all')
  const [actorType, setActorType] = useState<'all' | AuditActorType>('all')
  const [action, setAction] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [pageSize, setPageSize] = useState<number>(50)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const fromTs = fromDate ? Date.parse(fromDate) : undefined
    const toTs = toDate ? Date.parse(toDate) + 86_400_000 : undefined
    return result.rows.filter((row) => {
      if (actor !== 'all' && row.actorId !== actor) return false
      if (actorType !== 'all' && row.actorType !== actorType) return false
      if (action !== 'all' && row.action !== action) return false
      if (fromTs && row.occurredAt < fromTs) return false
      if (toTs && row.occurredAt >= toTs) return false
      if (needle) {
        const hay = `${row.action} ${row.actorLabel} ${row.targetLabel ?? ''} ${row.reason ?? ''} ${row.targetId}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [result.rows, search, actor, actorType, action, fromDate, toDate])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'when',
      header: 'When',
      render: (r) => (
        <div>
          <div className="font-mono text-caption tabular-nums text-text-secondary">
            {formatTimestamp(r.occurredAt)}
          </div>
          <div className="font-mono text-caption tabular-nums text-text-muted">
            {formatRelative(r.occurredAt, MOCK_NOW_UTC_MS)}
          </div>
        </div>
      ),
      sortAccessor: (r) => r.occurredAt,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Badge tone={ACTOR_TYPE_TONE[r.actorType]}>{r.actorType}</Badge>
          <span className="text-small text-text-primary">{r.actorLabel}</span>
        </div>
      ),
      sortAccessor: (r) => r.actorLabel,
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <span className="font-mono text-small text-forge-amber">{r.action}</span>
      ),
      sortAccessor: (r) => r.action,
    },
    {
      key: 'target',
      header: 'Target',
      render: (r) => (
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.16em] text-text-muted">
            {r.targetType}
          </div>
          <div className="text-small text-text-primary">
            {r.targetLabel ?? r.targetId}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => (
        <span className="text-small text-text-secondary">{r.reason ?? '—'}</span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (r) => <span className="font-mono text-caption text-text-muted">{r.ipAddress}</span>,
    },
  ]

  function reset() {
    setSearch('')
    setActor('all')
    setActorType('all')
    setAction('all')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  function exportCsv() {
    const header = [
      'occurred_at',
      'actor_type',
      'actor_id',
      'actor_label',
      'action',
      'target_type',
      'target_id',
      'target_label',
      'reason',
      'ip_address',
      'user_agent',
    ]
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const lines = [header.join(',')]
    for (const r of filtered) {
      lines.push(
        [
          new Date(r.occurredAt).toISOString(),
          r.actorType,
          r.actorId,
          r.actorLabel,
          r.action,
          r.targetType,
          r.targetId,
          r.targetLabel ?? '',
          r.reason ?? '',
          r.ipAddress,
          r.userAgent,
        ]
          .map(escape)
          .join(','),
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Filters">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input label="Search" value={search} onChange={setSearch} placeholder="action / target / reason" />
          <Select label="Actor type" value={actorType} onChange={(v) => setActorType(v as 'all' | AuditActorType)}>
            <option value="all">all</option>
            <option value="super_admin">super_admin</option>
            <option value="user">user</option>
            <option value="system">system</option>
          </Select>
          <Select label="Actor" value={actor} onChange={setActor}>
            <option value="all">all</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
          <Select label="Action" value={action} onChange={setAction}>
            <option value="all">all</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Input label="From" type="date" value={fromDate} onChange={setFromDate} />
          <Input label="To" type="date" value={toDate} onChange={setToDate} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
            {filtered.length} match{filtered.length === 1 ? '' : 'es'} of{' '}
            {result.totalRows.toLocaleString()} total
          </span>
          <div className="flex gap-2">
            <SuperButton variant="ghost" onClick={reset}>
              Reset
            </SuperButton>
            <SuperButton variant="secondary" onClick={exportCsv}>
              Export CSV
            </SuperButton>
          </div>
        </div>
      </SectionCard>

      <DataTable rows={visible} columns={columns} rowKey={(r) => r.id} density="compact" />

      <Pagination
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(s) => {
          setPageSize(s)
          setPage(1)
        }}
      />
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-caption uppercase tracking-[0.16em] text-text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 border border-border-subtle bg-bg-deep px-3 text-small text-text-primary placeholder:text-text-subtle focus:border-forge-amber focus:outline-none"
      />
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-caption uppercase tracking-[0.16em] text-text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 border border-border-subtle bg-bg-deep px-2 text-small text-text-primary focus:border-forge-amber focus:outline-none"
      >
        {children}
      </select>
    </label>
  )
}

function Pagination({
  page,
  pageCount,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number
  pageCount: number
  pageSize: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
}) {
  return (
    <div className="flex items-center justify-between border border-border-subtle bg-bg-deep px-4 py-2">
      <div className="flex items-center gap-2 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
        Rows
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="h-7 border border-border-subtle bg-bg-deep px-2 text-small text-text-primary focus:border-forge-amber focus:outline-none"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <SuperButton size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </SuperButton>
        <span className="font-mono text-caption tabular-nums text-text-secondary">
          {page} / {pageCount}
        </span>
        <SuperButton
          size="sm"
          variant="ghost"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </SuperButton>
      </div>
    </div>
  )
}

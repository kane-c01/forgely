'use client'

import { useMemo, useState } from 'react'

import {
  Badge,
  DataTable,
  SectionCard,
  StatCard,
  StatusDot,
  SuperButton,
  type DataTableColumn,
  type StatusTone,
} from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import {
  formatCount,
  formatRelative,
  MOCK_NOW_UTC_MS,
  type SupportTicketRow,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/super'

type FilterId = 'all' | 'mine' | 'unassigned'

const PRIORITY_TONE: Record<TicketPriority, 'error' | 'warning' | 'forge' | 'neutral'> = {
  p1: 'error',
  p2: 'warning',
  p3: 'forge',
  p4: 'neutral',
}

const STATUS_TONE: Record<TicketStatus, 'success' | 'warning' | 'forge' | 'neutral' | 'info'> = {
  open: 'warning',
  in_progress: 'forge',
  waiting: 'info',
  resolved: 'success',
  closed: 'neutral',
}

const STATUS_DOT: Record<TicketStatus, StatusTone> = {
  open: 'warning',
  in_progress: 'live',
  waiting: 'idle',
  resolved: 'ok',
  closed: 'idle',
}

const CURRENT_SUPER_ID = 'sa_lin' // mock — in prod read from session

export function SupportClient({ tickets }: { tickets: SupportTicketRow[] }) {
  const t = useT()
  const [filter, setFilter] = useState<FilterId>('all')

  const priorityLabel: Record<TicketPriority, string> = {
    p1: t.super.support.priorityP1,
    p2: t.super.support.priorityP2,
    p3: t.super.support.priorityP3,
    p4: t.super.support.priorityP4,
  }
  const statusLabel: Record<TicketStatus, string> = {
    open: t.super.support.statusOpen,
    in_progress: t.super.support.statusInProgress,
    waiting: t.super.support.statusWaiting,
    resolved: t.super.support.statusResolved,
    closed: t.super.support.statusClosed,
  }
  const categoryLabel: Record<TicketCategory, string> = {
    billing: t.super.support.categoryBilling,
    generation: t.super.support.categoryGeneration,
    compliance: t.super.support.categoryCompliance,
    technical: t.super.support.categoryTechnical,
    other: t.super.support.categoryOther,
  }
  const filterLabel: Record<FilterId, string> = {
    all: t.super.support.filterAll,
    mine: t.super.support.filterMine,
    unassigned: t.super.support.filterUnassigned,
  }

  const filtered = useMemo(() => {
    return tickets.filter((tk) => {
      if (filter === 'mine') return tk.assignee === CURRENT_SUPER_ID
      if (filter === 'unassigned') return tk.assignee == null
      return true
    })
  }, [tickets, filter])

  const open = tickets.filter((tk) => tk.status === 'open').length
  const inProgress = tickets.filter((tk) => tk.status === 'in_progress').length
  const resolved = tickets.filter((tk) => tk.status === 'resolved').length
  const p1 = tickets.filter((tk) => tk.priority === 'p1').length
  const withResponse = tickets.filter((tk) => typeof tk.firstResponseMs === 'number')
  const avgResponseMs =
    withResponse.length > 0
      ? Math.round(
          withResponse.reduce((sum, tk) => sum + (tk.firstResponseMs ?? 0), 0) /
            withResponse.length,
        )
      : 0
  const avgResponseLabel = `${Math.round(avgResponseMs / 60000)} min`

  const columns: DataTableColumn<SupportTicketRow>[] = [
    {
      key: 'ticket',
      header: t.super.support.colTicket,
      render: (r) => (
        <div className="min-w-0">
          <div className="text-small text-text-primary">{r.subject}</div>
          <div className="text-caption text-text-muted font-mono">
            {r.id} · {r.requesterId}
          </div>
        </div>
      ),
      sortAccessor: (r) => r.subject,
    },
    {
      key: 'requester',
      header: t.super.support.colRequester,
      render: (r) => <span className="text-small text-text-secondary">{r.requesterLabel}</span>,
    },
    {
      key: 'category',
      header: t.super.support.colCategory,
      render: (r) => <Badge tone="neutral">{categoryLabel[r.category]}</Badge>,
    },
    {
      key: 'priority',
      header: t.super.support.colPriority,
      render: (r) => <Badge tone={PRIORITY_TONE[r.priority]}>{priorityLabel[r.priority]}</Badge>,
      sortAccessor: (r) => r.priority,
    },
    {
      key: 'assignee',
      header: t.super.support.colAssignee,
      render: (r) => (
        <span className="text-small text-text-secondary">
          {r.assignee ?? <span className="text-text-muted">—</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: t.super.support.colStatus,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot tone={STATUS_DOT[r.status]} />
          <Badge tone={STATUS_TONE[r.status]}>{statusLabel[r.status]}</Badge>
        </span>
      ),
    },
    {
      key: 'created',
      header: t.super.support.colCreatedAt,
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {formatRelative(r.createdAt, MOCK_NOW_UTC_MS)}
        </span>
      ),
      sortAccessor: (r) => r.createdAt,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t.super.support.newTickets}
          value={formatCount(open)}
          accent={open > 0 ? 'data-4' : 'success'}
        />
        <StatCard
          label={t.super.support.openTickets}
          value={formatCount(inProgress)}
          accent="forge"
        />
        <StatCard
          label={t.super.support.resolvedToday}
          value={formatCount(resolved)}
          accent="success"
        />
        <StatCard label={t.super.support.avgResponseTime} value={avgResponseLabel} accent="info" />
        <StatCard
          label={t.super.support.p1Tickets}
          value={formatCount(p1)}
          accent={p1 > 0 ? 'data-3' : 'forge'}
        />
      </div>

      <SectionCard
        title={t.super.support.title}
        bodyClassName="p-0"
        action={
          <div className="flex flex-wrap items-center gap-1">
            {(['all', 'mine', 'unassigned'] as FilterId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={
                  'text-caption border px-2.5 py-1 font-mono uppercase tracking-[0.16em] transition-colors ' +
                  (filter === id
                    ? 'border-forge-ember bg-forge-orange/15 text-forge-amber'
                    : 'border-border-subtle text-text-muted hover:text-text-primary')
                }
              >
                {filterLabel[id]}
              </button>
            ))}
            <SuperButton size="sm" variant="primary">
              {t.super.support.assignTicket}
            </SuperButton>
          </div>
        }
      >
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          initialSort={{ key: 'priority', direction: 'asc' }}
          emptyState={t.super.common.noData}
        />
      </SectionCard>
    </div>
  )
}

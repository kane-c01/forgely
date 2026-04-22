'use client'

import { useState } from 'react'
import {
  Badge,
  DataTable,
  SectionCard,
  StatCard,
  StatusDot,
  SuperButton,
} from '@/components/super-ui'
import type { DataTableColumn } from '@/components/super-ui'
import {
  formatCount,
  formatRelative,
  formatTimestamp,
  formatUsd,
  MOCK_NOW_UTC_MS,
} from '@/lib/super'
import type {
  CreditTransactionRow,
  FinanceSnapshot,
  RefundRow,
  RefundStatus,
  StripePayoutRow,
  StripePayoutStatus,
} from '@/lib/super'
import { trpc } from '@/lib/trpc'

type TabId = 'payouts' | 'credits' | 'refunds'

const PAYOUT_TONE: Record<StripePayoutStatus, 'success' | 'info' | 'warning' | 'error'> = {
  paid: 'success',
  in_transit: 'info',
  pending: 'warning',
  failed: 'error',
}

const CT_TONE: Record<
  CreditTransactionRow['type'],
  'forge' | 'success' | 'warning' | 'info' | 'error'
> = {
  consumption: 'forge',
  purchase: 'success',
  monthly_reset: 'info',
  refund: 'warning',
  grant: 'info',
}

const REFUND_TONE: Record<RefundStatus, 'warning' | 'info' | 'success' | 'error'> = {
  queued: 'warning',
  approved: 'info',
  completed: 'success',
  rejected: 'error',
}

export function FinanceClient({ snapshot: initialSnapshot }: { snapshot: FinanceSnapshot }) {
  const [tab, setTab] = useState<TabId>('payouts')

  const liveQuery = trpc.super.finance.overview.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  })
  // Live overview exposes mrr/arr/netRevenue30d/creditTransactions/refunds;
  // payouts still come from Stripe sync (stubbed — keep mock so the tab
  // doesn't go blank).
  const snapshot: FinanceSnapshot = liveQuery.data
    ? {
        ...initialSnapshot,
        ...liveQuery.data,
        payouts: liveQuery.data.payouts.length ? liveQuery.data.payouts : initialSnapshot.payouts,
      }
    : initialSnapshot

  const grossSpend = snapshot.creditTransactions
    .filter((tx) => tx.type === 'consumption')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="MRR"
          value={formatUsd(snapshot.mrr)}
          delta={{ value: '12.3%', direction: 'up' }}
          accent="forge"
          hint="vs last month"
        />
        <StatCard
          label="ARR"
          value={formatUsd(snapshot.arr)}
          delta={{ value: '180.1%', direction: 'up' }}
          accent="forge"
          hint="projected"
        />
        <StatCard
          label="Net rev · 30d"
          value={formatUsd(snapshot.netRevenue30d)}
          delta={{ value: '4.2%', direction: 'up' }}
          accent="success"
          hint="after refunds"
        />
        <StatCard
          label="Refunds pending"
          value={formatCount(snapshot.refundsPending)}
          delta={{ value: '3', direction: 'up' }}
          accent="data-3"
          hint="aged >24h needs review"
        />
      </div>

      <SectionCard title="Ledger" bodyClassName="p-0">
        <div className="border-border-subtle flex border-b">
          <Tab id="payouts" current={tab} onSelect={setTab}>
            Stripe payouts ({snapshot.payouts.length})
          </Tab>
          <Tab id="credits" current={tab} onSelect={setTab}>
            Credit transactions ({snapshot.creditTransactions.length})
          </Tab>
          <Tab id="refunds" current={tab} onSelect={setTab}>
            Refunds ({snapshot.refunds.length})
          </Tab>
          <div className="text-caption text-text-muted ml-auto flex items-center gap-3 px-4 font-mono uppercase tracking-[0.16em]">
            Spend ledger {formatCount(grossSpend)} credits · 30d
          </div>
        </div>

        {tab === 'payouts' && <PayoutsTable rows={snapshot.payouts} />}
        {tab === 'credits' && <CreditsTable rows={snapshot.creditTransactions} />}
        {tab === 'refunds' && <RefundsTable rows={snapshot.refunds} />}
      </SectionCard>

      <p className="text-caption text-text-muted">
        Stripe webhook reconciliation runs every 5 minutes. Payouts ship to{' '}
        <span className="text-text-secondary font-mono">acct_forgely_main</span> in USD; FX is
        handled by Stripe. All ledger entries are append-only.
      </p>
    </div>
  )
}

function Tab({
  id,
  current,
  onSelect,
  children,
}: {
  id: TabId
  current: TabId
  onSelect: (tab: TabId) => void
  children: React.ReactNode
}) {
  const active = current === id
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={
        'text-caption border-b-2 px-4 py-3 font-mono uppercase tracking-[0.18em] transition-colors ' +
        (active
          ? 'border-forge-orange text-forge-amber'
          : 'text-text-muted hover:text-text-primary border-transparent')
      }
    >
      {children}
    </button>
  )
}

function PayoutsTable({ rows }: { rows: StripePayoutRow[] }) {
  const columns: DataTableColumn<StripePayoutRow>[] = [
    {
      key: 'id',
      header: 'Payout',
      render: (r) => <span className="text-caption font-mono">{r.id}</span>,
      sortAccessor: (r) => r.id,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot
            tone={
              PAYOUT_TONE[r.status] === 'error'
                ? 'error'
                : PAYOUT_TONE[r.status] === 'warning'
                  ? 'warning'
                  : 'ok'
            }
          />
          <Badge tone={PAYOUT_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>
        </span>
      ),
      sortAccessor: (r) => r.status,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => (
        <span className="text-forge-amber font-mono tabular-nums">{formatUsd(r.amountUsd)}</span>
      ),
      sortAccessor: (r) => r.amountUsd,
    },
    {
      key: 'bank',
      header: 'Bank',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono">•••• {r.bankLast4}</span>
      ),
    },
    {
      key: 'arrival',
      header: 'Arrival',
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono">
          {formatTimestamp(r.arrivalDate)}
        </span>
      ),
      sortAccessor: (r) => r.arrivalDate,
    },
  ]
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: 'arrival', direction: 'desc' }}
    />
  )
}

function CreditsTable({ rows }: { rows: CreditTransactionRow[] }) {
  const columns: DataTableColumn<CreditTransactionRow>[] = [
    {
      key: 'time',
      header: 'When',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {formatRelative(r.occurredAt, MOCK_NOW_UTC_MS)}
        </span>
      ),
      sortAccessor: (r) => r.occurredAt,
    },
    {
      key: 'user',
      header: 'User',
      render: (r) => (
        <div>
          <div className="text-small text-text-primary">{r.userEmail}</div>
          <div className="text-caption text-text-muted font-mono">{r.userId}</div>
        </div>
      ),
      sortAccessor: (r) => r.userEmail,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <Badge tone={CT_TONE[r.type]}>{r.type.replace('_', ' ')}</Badge>,
      sortAccessor: (r) => r.type,
    },
    {
      key: 'desc',
      header: 'Description',
      render: (r) => <span className="text-small text-text-secondary">{r.description}</span>,
    },
    {
      key: 'amount',
      header: 'Δ Credits',
      align: 'right',
      render: (r) => (
        <span
          className={'font-mono tabular-nums ' + (r.amount < 0 ? 'text-error' : 'text-success')}
        >
          {r.amount > 0 ? '+' : ''}
          {formatCount(r.amount)}
        </span>
      ),
      sortAccessor: (r) => r.amount,
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (r) => (
        <span className="text-text-secondary font-mono tabular-nums">
          {formatCount(r.balanceAfter)}
        </span>
      ),
      sortAccessor: (r) => r.balanceAfter,
    },
  ]
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: 'time', direction: 'desc' }}
      density="compact"
    />
  )
}

function RefundsTable({ rows }: { rows: RefundRow[] }) {
  const columns: DataTableColumn<RefundRow>[] = [
    {
      key: 'id',
      header: 'Refund',
      render: (r) => <span className="text-caption font-mono">{r.id}</span>,
    },
    {
      key: 'user',
      header: 'User',
      render: (r) => (
        <div>
          <div className="text-small text-text-primary">{r.userEmail}</div>
          <div className="text-caption text-text-muted font-mono">{r.userId}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => <span className="text-small text-text-secondary">{r.reason}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => (
        <span className="text-error font-mono tabular-nums">−{formatUsd(r.amountUsd)}</span>
      ),
      sortAccessor: (r) => r.amountUsd,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={REFUND_TONE[r.status]}>{r.status}</Badge>,
      sortAccessor: (r) => r.status,
    },
    {
      key: 'age',
      header: 'Age',
      align: 'right',
      render: (r) => (
        <span
          className={
            'text-caption font-mono tabular-nums ' +
            (r.ageHours > 24 ? 'text-error' : 'text-text-muted')
          }
        >
          {r.ageHours}h
        </span>
      ),
      sortAccessor: (r) => r.ageHours,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <SuperButton size="sm" variant="secondary" disabled={r.status !== 'queued'}>
            Approve
          </SuperButton>
          <SuperButton size="sm" variant="ghost" disabled={r.status !== 'queued'}>
            Reject
          </SuperButton>
        </div>
      ),
    },
  ]
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: 'age', direction: 'desc' }}
    />
  )
}

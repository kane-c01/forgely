'use client'

import { useEffect, useState } from 'react'
import {
  Badge,
  SectionCard,
  SideDrawer,
  StatusDot,
  SuperButton,
} from '@/components/super-ui'
import {
  formatCount,
  formatRelative,
  formatTimestamp,
  formatUsd,
  MOCK_NOW_UTC_MS,
} from '@/lib/super'
import type {
  RefundStatus,
  SuperUserDetail,
  SuperUserRow,
  UserStatus,
} from '@/lib/super'

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

type LoginRequestState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'awaiting_user'; expiresAt: number; ticketId: string }
  | { status: 'denied' }
  | { status: 'granted'; expiresAt: number; ticketId: string }
  | { status: 'expired' }

const TX_TONE: Record<'subscription' | 'credits_pack' | 'refund', 'forge' | 'success' | 'warning'> = {
  subscription: 'forge',
  credits_pack: 'success',
  refund: 'warning',
}

const REFUND_BADGE: Record<RefundStatus, 'warning' | 'info' | 'success' | 'error'> = {
  queued: 'warning',
  approved: 'info',
  completed: 'success',
  rejected: 'error',
}

export interface UserDetailDrawerProps {
  user?: SuperUserRow
  detail?: SuperUserDetail
  open: boolean
  onClose: () => void
}

export function UserDetailDrawer({ user, detail, open, onClose }: UserDetailDrawerProps) {
  const [loginRequest, setLoginRequest] = useState<LoginRequestState>({ status: 'idle' })

  // Reset state when the user changes or the drawer closes.
  useEffect(() => {
    if (!open) setLoginRequest({ status: 'idle' })
  }, [open, user?.id])

  // Auto-expire any granted Login-as-User session.
  useEffect(() => {
    if (loginRequest.status !== 'granted' && loginRequest.status !== 'awaiting_user') return
    const id = window.setTimeout(() => {
      setLoginRequest({ status: 'expired' })
    }, Math.max(0, loginRequest.expiresAt - Date.now()))
    return () => window.clearTimeout(id)
  }, [loginRequest])

  function requestLoginAs() {
    if (!user) return
    setLoginRequest({ status: 'sending' })
    // TODO(W3-T06): replace with `trpc.super.users.requestLoginAs.mutate({ userId, reason })`.
    window.setTimeout(() => {
      setLoginRequest({
        status: 'awaiting_user',
        ticketId: `lar_${Math.random().toString(36).slice(2, 8)}`,
        expiresAt: Date.now() + 30 * 60 * 1000,
      })
    }, 600)
  }

  function simulateGrant() {
    setLoginRequest((prev) =>
      prev.status === 'awaiting_user'
        ? { status: 'granted', ticketId: prev.ticketId, expiresAt: prev.expiresAt }
        : prev,
    )
  }

  function simulateDeny() {
    setLoginRequest({ status: 'denied' })
  }

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      width="lg"
      title={user ? user.email : 'User detail'}
      description={user ? `ID ${user.id} · joined ${formatTimestamp(user.signedUpAt)}` : undefined}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
            All actions write to AuditLog
          </span>
          <div className="flex gap-2">
            <SuperButton variant="ghost" onClick={onClose}>
              Close
            </SuperButton>
            <SuperButton
              variant={user?.status === 'suspended' ? 'secondary' : 'danger'}
              disabled={!user}
            >
              {user?.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
            </SuperButton>
          </div>
        </div>
      }
    >
      {!user && (
        <p className="text-small text-text-muted">Select a user to inspect their account.</p>
      )}

      {user && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <SummaryStat label="Status">
              <Badge tone={STATUS_TONE[user.status]}>{user.status}</Badge>
            </SummaryStat>
            <SummaryStat label="Plan">
              <Badge tone={PLAN_TONE[user.plan]}>{user.plan}</Badge>
            </SummaryStat>
            <SummaryStat label="Sites">
              <span className="font-mono text-h3 tabular-nums text-text-primary">
                {user.sitesCount}
              </span>
            </SummaryStat>
            <SummaryStat label="Credits">
              <span className="font-mono text-h3 tabular-nums text-forge-amber">
                {formatCount(user.creditsBalance)}
              </span>
            </SummaryStat>
            <SummaryStat label="Lifetime spend">
              <span className="font-mono text-h3 tabular-nums text-text-primary">
                {formatUsd(user.lifetimeSpendUsd)}
              </span>
            </SummaryStat>
            <SummaryStat label="Last seen">
              <span className="font-mono text-small tabular-nums text-text-secondary">
                {user.lastSeenAt
                  ? formatRelative(user.lastSeenAt, MOCK_NOW_UTC_MS)
                  : 'never'}
              </span>
            </SummaryStat>
          </div>

          <SectionCard
            title="Login as user"
            subtitle="docs/MASTER.md §20.3 · user must explicitly authorise the session."
            density="compact"
          >
            <LoginAsUserPanel
              userEmail={user.email}
              state={loginRequest}
              onRequest={requestLoginAs}
              onSimulateGrant={simulateGrant}
              onSimulateDeny={simulateDeny}
              onReset={() => setLoginRequest({ status: 'idle' })}
            />
          </SectionCard>

          {detail && (
            <>
              <SectionCard title={`Recent sites · ${detail.recentSites.length}`} density="compact">
                {detail.recentSites.length === 0 ? (
                  <p className="text-small text-text-muted">No sites yet.</p>
                ) : (
                  <ul className="divide-y divide-border-subtle">
                    {detail.recentSites.map((site) => (
                      <li
                        key={site.id}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-small text-text-primary">{site.name}</div>
                          <div className="truncate font-mono text-caption text-text-muted">
                            {site.domain}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            tone={
                              site.status === 'published'
                                ? 'success'
                                : site.status === 'paused'
                                  ? 'warning'
                                  : 'neutral'
                            }
                          >
                            {site.status}
                          </Badge>
                          <span className="font-mono text-caption tabular-nums text-text-muted">
                            {site.publishedAt
                              ? formatRelative(site.publishedAt, MOCK_NOW_UTC_MS)
                              : '—'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title={`Recent transactions · ${detail.recentTransactions.length}`}
                density="compact"
              >
                <ul className="divide-y divide-border-subtle">
                  {detail.recentTransactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Badge tone={TX_TONE[tx.type]}>{tx.type.replace('_', ' ')}</Badge>
                        <span className="text-small text-text-secondary">{tx.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            'font-mono text-small tabular-nums ' +
                            (tx.amountUsd < 0 ? 'text-error' : 'text-forge-amber')
                          }
                        >
                          {tx.amountUsd < 0 ? '-' : '+'}
                          {formatUsd(Math.abs(tx.amountUsd))}
                        </span>
                        <span className="font-mono text-caption tabular-nums text-text-muted">
                          {formatRelative(tx.occurredAt, MOCK_NOW_UTC_MS)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </>
          )}

          {/* Sample of how downstream lists render statuses, kept here so the
             RefundStatus type stays referenced — TanStack Table on /finance
             uses the same map. */}
          <details className="text-caption text-text-subtle">
            <summary className="cursor-pointer font-mono uppercase tracking-[0.18em] text-text-muted">
              Refund-status legend
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(REFUND_BADGE) as RefundStatus[]).map((s) => (
                <Badge key={s} tone={REFUND_BADGE[s]}>
                  {s}
                </Badge>
              ))}
            </div>
          </details>
        </div>
      )}
    </SideDrawer>
  )
}

function SummaryStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border-subtle bg-bg-deep px-3 py-2">
      <div className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function LoginAsUserPanel({
  userEmail,
  state,
  onRequest,
  onSimulateGrant,
  onSimulateDeny,
  onReset,
}: {
  userEmail: string
  state: LoginRequestState
  onRequest: () => void
  onSimulateGrant: () => void
  onSimulateDeny: () => void
  onReset: () => void
}) {
  if (state.status === 'idle' || state.status === 'sending') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-small text-text-secondary">
          We&apos;ll message <span className="font-mono text-text-primary">{userEmail}</span> with a
          one-tap consent prompt. Their decision and the resulting session are appended to the
          audit log.
        </p>
        <SuperButton variant="primary" onClick={onRequest} disabled={state.status === 'sending'}>
          {state.status === 'sending' ? 'Requesting…' : 'Request access'}
        </SuperButton>
      </div>
    )
  }

  if (state.status === 'awaiting_user') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <StatusDot tone="warning" pulse />
          <span className="font-mono text-caption uppercase tracking-[0.18em] text-warning">
            Awaiting consent
          </span>
        </div>
        <p className="text-small text-text-secondary">
          Ticket <span className="font-mono text-text-primary">{state.ticketId}</span> · expires{' '}
          <span className="font-mono">{formatTimestamp(state.expiresAt)}</span>
        </p>
        <div className="flex gap-2">
          <SuperButton variant="secondary" onClick={onSimulateGrant}>
            Simulate Allow
          </SuperButton>
          <SuperButton variant="ghost" onClick={onSimulateDeny}>
            Simulate Deny
          </SuperButton>
          <SuperButton variant="ghost" onClick={onReset}>
            Cancel
          </SuperButton>
        </div>
      </div>
    )
  }

  if (state.status === 'granted') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <StatusDot tone="ok" />
          <span className="font-mono text-caption uppercase tracking-[0.18em] text-success">
            Access granted
          </span>
        </div>
        <p className="text-small text-text-secondary">
          Token issued for ticket <span className="font-mono">{state.ticketId}</span>. Expires{' '}
          <span className="font-mono">{formatTimestamp(state.expiresAt)}</span>. Every action you
          take while impersonating <span className="font-mono">{userEmail}</span> is tagged{' '}
          <Badge tone="warning">Support Access</Badge>.
        </p>
        <div className="flex gap-2">
          <SuperButton variant="primary" disabled>
            Open as user (stub)
          </SuperButton>
          <SuperButton variant="danger" onClick={onReset}>
            End session
          </SuperButton>
        </div>
      </div>
    )
  }

  if (state.status === 'denied') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <StatusDot tone="error" />
          <span className="font-mono text-caption uppercase tracking-[0.18em] text-error">
            Denied by user
          </span>
        </div>
        <p className="text-small text-text-secondary">
          The user declined the access request. Logged as
          <span className="font-mono"> support.login_as_user.denied</span>.
        </p>
        <SuperButton variant="ghost" onClick={onReset}>
          Reset
        </SuperButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <StatusDot tone="idle" />
        <span className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
          Session expired
        </span>
      </div>
      <SuperButton variant="ghost" onClick={onReset}>
        Reset
      </SuperButton>
    </div>
  )
}

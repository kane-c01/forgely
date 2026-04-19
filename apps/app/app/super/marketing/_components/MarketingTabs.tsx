'use client'

import { useState } from 'react'
import { Badge, DataTable, SectionCard, StatusDot, SuperButton } from '@/components/super-ui'
import type { DataTableColumn } from '@/components/super-ui'
import { formatRelative, formatTimestamp, formatUsd, MOCK_NOW_UTC_MS } from '@/lib/super'

type TabId = 'campaigns' | 'coupons' | 'push'

interface CampaignRow {
  id: string
  name: string
  provider: 'klaviyo' | 'mailchimp' | 'resend' | 'internal'
  status: 'draft' | 'scheduled' | 'queued' | 'sending' | 'sent' | 'failed'
  audienceSize: number
  scheduledAt: number | null
  sentAt: number | null
}

interface CouponRow {
  id: string
  code: string
  discountType: 'percent' | 'amount'
  value: number
  redemptions: number
  maxRedemptions: number | null
  expiresAt: number | null
}

interface PushRow {
  id: string
  channel: 'webpush' | 'inapp' | 'wechat_template' | 'system_banner'
  title: string
  audienceSize: number
  status: 'queued' | 'sending' | 'sent' | 'failed'
  scheduledAt: number | null
}

const STATUS_TONE = {
  draft: 'neutral',
  scheduled: 'info',
  queued: 'warning',
  sending: 'forge',
  sent: 'success',
  failed: 'error',
} as const

const PROVIDER_TONE = {
  klaviyo: 'forge',
  mailchimp: 'warning',
  resend: 'success',
  internal: 'neutral',
} as const

const CHANNEL_TONE = {
  webpush: 'info',
  inapp: 'forge',
  wechat_template: 'success',
  system_banner: 'warning',
} as const

const MOCK_CAMPAIGNS: CampaignRow[] = [
  {
    id: 'cam_1',
    name: 'April nurture · free → starter',
    provider: 'resend',
    status: 'sent',
    audienceSize: 8_421,
    scheduledAt: MOCK_NOW_UTC_MS - 2 * 24 * 60 * 60 * 1000,
    sentAt: MOCK_NOW_UTC_MS - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'cam_2',
    name: 'Q2 product changelog',
    provider: 'klaviyo',
    status: 'scheduled',
    audienceSize: 18_234,
    scheduledAt: MOCK_NOW_UTC_MS + 4 * 60 * 60 * 1000,
    sentAt: null,
  },
  {
    id: 'cam_3',
    name: 'Reactivation · last 90 days',
    provider: 'resend',
    status: 'draft',
    audienceSize: 1_204,
    scheduledAt: null,
    sentAt: null,
  },
]

const MOCK_COUPONS: CouponRow[] = [
  {
    id: 'co_1',
    code: 'LAUNCH2026',
    discountType: 'percent',
    value: 30,
    redemptions: 421,
    maxRedemptions: 500,
    expiresAt: MOCK_NOW_UTC_MS + 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'co_2',
    code: 'CHINA-Q2',
    discountType: 'percent',
    value: 50,
    redemptions: 89,
    maxRedemptions: null,
    expiresAt: MOCK_NOW_UTC_MS + 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'co_3',
    code: 'AGENCY-PROMO',
    discountType: 'amount',
    value: 50_000,
    redemptions: 7,
    maxRedemptions: 50,
    expiresAt: null,
  },
]

const MOCK_PUSH: PushRow[] = [
  {
    id: 'pb_1',
    channel: 'inapp',
    title: 'New: AI Copilot beta',
    audienceSize: 4_921,
    status: 'sent',
    scheduledAt: MOCK_NOW_UTC_MS - 6 * 60 * 60 * 1000,
  },
  {
    id: 'pb_2',
    channel: 'webpush',
    title: 'Render queue back online',
    audienceSize: 312,
    status: 'queued',
    scheduledAt: MOCK_NOW_UTC_MS + 30 * 60 * 1000,
  },
]

export function MarketingTabs() {
  const [tab, setTab] = useState<TabId>('campaigns')

  return (
    <SectionCard title={`Workspace · ${tab}`} bodyClassName="p-0">
      <div className="border-border-subtle flex border-b">
        <Tab id="campaigns" current={tab} onSelect={setTab}>
          Email campaigns ({MOCK_CAMPAIGNS.length})
        </Tab>
        <Tab id="coupons" current={tab} onSelect={setTab}>
          Coupons ({MOCK_COUPONS.length})
        </Tab>
        <Tab id="push" current={tab} onSelect={setTab}>
          Push broadcasts ({MOCK_PUSH.length})
        </Tab>
      </div>
      {tab === 'campaigns' && <CampaignsTable rows={MOCK_CAMPAIGNS} />}
      {tab === 'coupons' && <CouponsTable rows={MOCK_COUPONS} />}
      {tab === 'push' && <PushTable rows={MOCK_PUSH} />}
    </SectionCard>
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

function CampaignsTable({ rows }: { rows: CampaignRow[] }) {
  const columns: DataTableColumn<CampaignRow>[] = [
    {
      key: 'name',
      header: 'Campaign',
      render: (r) => (
        <div>
          <div className="text-small text-text-primary">{r.name}</div>
          <div className="text-caption text-text-muted font-mono">{r.id}</div>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (r) => <Badge tone={PROVIDER_TONE[r.provider]}>{r.provider}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot
            tone={r.status === 'failed' ? 'error' : r.status === 'queued' ? 'warning' : 'ok'}
          />
          <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
        </span>
      ),
    },
    {
      key: 'audience',
      header: 'Audience',
      align: 'right',
      render: (r) => (
        <span className="font-mono tabular-nums">{r.audienceSize.toLocaleString()}</span>
      ),
    },
    {
      key: 'when',
      header: 'When',
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {r.sentAt
            ? formatRelative(r.sentAt, MOCK_NOW_UTC_MS)
            : r.scheduledAt
              ? `in ${formatRelative(r.scheduledAt, MOCK_NOW_UTC_MS).replace(' ago', '')}`
              : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <SuperButton
            size="sm"
            variant="ghost"
            disabled={r.status !== 'draft' && r.status !== 'scheduled'}
          >
            Edit
          </SuperButton>
          <SuperButton
            size="sm"
            variant="primary"
            disabled={r.status === 'sending' || r.status === 'sent'}
          >
            Launch
          </SuperButton>
        </div>
      ),
    },
  ]
  return <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />
}

function CouponsTable({ rows }: { rows: CouponRow[] }) {
  const columns: DataTableColumn<CouponRow>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (r) => <span className="text-small text-forge-amber font-mono">{r.code}</span>,
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (r) =>
        r.discountType === 'percent' ? (
          <span className="font-mono">{r.value}%</span>
        ) : (
          <span className="font-mono">{formatUsd(r.value / 100, true)} off</span>
        ),
    },
    {
      key: 'redemptions',
      header: 'Used',
      align: 'right',
      render: (r) => (
        <span className="font-mono tabular-nums">
          {r.redemptions}
          {r.maxRedemptions ? ` / ${r.maxRedemptions}` : ''}
        </span>
      ),
    },
    {
      key: 'expires',
      header: 'Expires',
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {r.expiresAt ? formatTimestamp(r.expiresAt) : 'never'}
        </span>
      ),
    },
  ]
  return <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />
}

function PushTable({ rows }: { rows: PushRow[] }) {
  const columns: DataTableColumn<PushRow>[] = [
    {
      key: 'channel',
      header: 'Channel',
      render: (r) => <Badge tone={CHANNEL_TONE[r.channel]}>{r.channel}</Badge>,
    },
    {
      key: 'title',
      header: 'Title',
      render: (r) => <span className="text-small text-text-primary">{r.title}</span>,
    },
    {
      key: 'audience',
      header: 'Audience',
      align: 'right',
      render: (r) => (
        <span className="font-mono tabular-nums">{r.audienceSize.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge
          tone={
            r.status === 'failed'
              ? 'error'
              : r.status === 'queued'
                ? 'warning'
                : r.status === 'sent'
                  ? 'success'
                  : 'forge'
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'when',
      header: 'When',
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {r.scheduledAt ? formatRelative(r.scheduledAt, MOCK_NOW_UTC_MS) : '—'}
        </span>
      ),
    },
  ]
  return <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />
}

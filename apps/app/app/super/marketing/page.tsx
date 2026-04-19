import { Badge, SectionCard, StatCard, SuperButton } from '@/components/super-ui'
import { formatCount, getSuperSession } from '@/lib/super'
import { MarketingTabs } from './_components/MarketingTabs'

export const metadata = {
  title: 'Marketing · Forgely Command',
}

export default async function SuperMarketingPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return (
      <div className="grid h-[60vh] place-items-center text-center">
        <div>
          <div className="text-caption text-error font-mono uppercase tracking-[0.22em]">
            Restricted
          </div>
          <p className="text-small text-text-muted mt-2 max-w-md">
            Marketing requires ADMIN or OWNER role. Your current role is{' '}
            <span className="text-text-secondary font-mono">{session.role}</span>.
          </p>
        </div>
      </div>
    )
  }

  // Mock summary tiles — replaced by `trpc.super.marketing.*` queries once
  // the apps/app tRPC client lands.
  const summary = {
    activeCampaigns: 3,
    couponsLive: 12,
    pushBacklog: 0,
    deliveriesLast24h: 42_318,
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-caption text-text-muted font-mono uppercase tracking-[0.22em]">
            Growth
          </div>
          <h1 className="font-display text-h2 text-text-primary">Marketing</h1>
        </div>
        <p className="text-small text-text-muted max-w-md">
          Email campaigns, coupon codes and push broadcasts. Provider dispatch is queued through the
          BullMQ worker — every state change is audited.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active campaigns"
          value={formatCount(summary.activeCampaigns)}
          accent="forge"
          hint="draft + scheduled"
        />
        <StatCard
          label="Live coupons"
          value={formatCount(summary.couponsLive)}
          accent="info"
          hint="not yet expired"
        />
        <StatCard
          label="Push backlog"
          value={formatCount(summary.pushBacklog)}
          accent="data-3"
          hint="queued sends"
        />
        <StatCard
          label="Deliveries · 24h"
          value={formatCount(summary.deliveriesLast24h)}
          accent="success"
          hint="email + push"
        />
      </div>

      <SectionCard
        title="Active providers"
        subtitle={
          <span className="font-mono">
            klaviyo · resend · webpush — wechat_template requires WeChat Service-Account approval
          </span>
        }
        action={<SuperButton variant="primary">New campaign</SuperButton>}
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">resend · ready</Badge>
          <Badge tone="info">klaviyo · ready</Badge>
          <Badge tone="warning">mailchimp · pending key</Badge>
          <Badge tone="neutral">internal SMTP · disabled</Badge>
        </div>
      </SectionCard>

      <MarketingTabs />
    </div>
  )
}

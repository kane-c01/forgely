'use client'

import { Badge, SectionCard, StatCard, SuperButton } from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import { formatCount } from '@/lib/super'

const MOCK_SUMMARY = {
  activeCampaigns: 3,
  couponsLive: 12,
  pushBacklog: 0,
  deliveriesLast24h: 42_318,
}

export function MarketingSummary() {
  const t = useT()
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t.super.marketing.activeCampaigns}
        value={formatCount(MOCK_SUMMARY.activeCampaigns)}
        accent="forge"
      />
      <StatCard
        label={t.super.marketing.liveCoupons}
        value={formatCount(MOCK_SUMMARY.couponsLive)}
        accent="info"
      />
      <StatCard
        label={t.super.marketing.pushBacklog}
        value={formatCount(MOCK_SUMMARY.pushBacklog)}
        accent="data-3"
      />
      <StatCard
        label={t.super.marketing.deliveries24h}
        value={formatCount(MOCK_SUMMARY.deliveriesLast24h)}
        accent="success"
      />
    </div>
  )
}

export function MarketingProviders() {
  const t = useT()
  return (
    <SectionCard
      title="Active providers"
      action={<SuperButton variant="primary">{t.super.marketing.newCampaign}</SuperButton>}
    >
      <div className="flex flex-wrap gap-2">
        <Badge tone="success">{t.super.marketing.providerResend}</Badge>
        <Badge tone="info">{t.super.marketing.providerKlaviyo}</Badge>
        <Badge tone="warning">{t.super.marketing.providerMailchimp}</Badge>
        <Badge tone="neutral">{t.super.marketing.providerInternal}</Badge>
      </div>
    </SectionCard>
  )
}

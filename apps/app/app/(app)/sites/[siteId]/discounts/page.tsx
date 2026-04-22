'use client'

import { ComingSoon } from '@/components/shell/coming-soon'
import { DiscountsCopilotBridge } from '@/components/copilot/bridges'

export default function DiscountsPage({ params }: { params: { siteId: string } }) {
  return (
    <>
      <DiscountsCopilotBridge siteId={params.siteId} />
      <ComingSoon
        eyebrow="Marketing"
        title="Discounts"
        description="Coupon codes, automatic discounts and bundle offers."
        expected="V1.2"
        bullets={[
          'Percent / fixed / BOGO',
          'Schedule by date & timezone',
          'Limit per customer / per code',
          'Copilot can mint and email codes',
        ]}
      />
    </>
  )
}

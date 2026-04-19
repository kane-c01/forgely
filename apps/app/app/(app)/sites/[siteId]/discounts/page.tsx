import { ComingSoon } from '@/components/shell/coming-soon'

export default function DiscountsPage() {
  return (
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
  )
}

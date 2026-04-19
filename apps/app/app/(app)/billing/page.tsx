import { ComingSoon } from '@/components/shell/coming-soon'

export default function BillingPage() {
  return (
    <ComingSoon
      eyebrow="Account"
      title="Billing"
      description="Subscription, credit balance, invoices and payment methods."
      expected="Week 9"
      bullets={[
        'Plan upgrades + downgrades',
        'Credit auto-top-up',
        'Past invoices PDF',
        'Stripe-managed payment methods',
      ]}
    />
  )
}

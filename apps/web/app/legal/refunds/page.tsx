import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Refund Policy',
  description: 'When Forgely refunds you, how, and how long it takes.',
  path: '/legal/refunds',
})

export default function RefundsPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Refund Policy"
      intro="No surprises. Here is exactly what we refund and when."
      updated="April 19, 2026"
    >
      <h2>Subscriptions</h2>
      <ul>
        <li>
          <strong>14-day money-back</strong> on your first paid month of any plan. Email{' '}
          <a href="mailto:hello@forgely.com">hello@forgely.com</a> within 14 days of the charge.
        </li>
        <li>
          Cancel anytime — service continues until the end of the current paid period; no pro-rata
          refund for the unused remainder.
        </li>
        <li>Plan downgrades take effect at the start of the next period.</li>
      </ul>

      <h2>Credit packs</h2>
      <ul>
        <li>
          Unused purchased credits can be refunded within 30 days of purchase, pro-rata to whatever
          has not been spent.
        </li>
        <li>Credits given as part of a subscription are not refundable.</li>
      </ul>

      <h2>One-time services</h2>
      <ul>
        <li>
          Refundable in full <strong>before</strong> kick-off.
        </li>
        <li>Non-refundable once delivery has started.</li>
      </ul>

      <h2>Disputes</h2>
      <p>
        Please contact us first — we resolve 99% of issues without a chargeback. Refunds are issued
        back to the original payment method within 5-10 business days.
      </p>
    </StaticPageShell>
  )
}

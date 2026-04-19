import { ComingSoon } from '@/components/shell/coming-soon'

export default function SiteSettingsPage() {
  return (
    <ComingSoon
      eyebrow="Site"
      title="Site settings"
      description="Domains, payments, shipping, taxes, languages and team access for this site."
      expected="Week 11"
      bullets={[
        'Custom domains + free SSL',
        'Stripe / PayPal split routing',
        'Multi-region shipping',
        'Per-site team roles',
      ]}
    />
  )
}

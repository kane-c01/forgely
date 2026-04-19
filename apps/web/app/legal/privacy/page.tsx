import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'How Forgely collects, stores and protects your data.',
  path: '/legal/privacy',
})

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Privacy is the default at Forgely. This page lists every data class we touch and why."
      updated="April 19, 2026"
    >
      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong>: email, name, hashed password (or OAuth subject id) and
          timezone.
        </li>
        <li>
          <strong>Billing data</strong>: handled by Stripe — Forgely never stores card numbers. We
          store the Stripe customer id.
        </li>
        <li>
          <strong>Site content</strong>: products, copy, media, theme DSL you upload or generate.
        </li>
        <li>
          <strong>Telemetry</strong>: Plausible (cookieless, EU-hosted) records anonymised
          page-level usage. Web Vitals are reported via the same channel.
        </li>
        <li>
          <strong>Waitlist</strong>: email and optional store URL until your account is provisioned,
          then merged into Account data. Hashed IP retained 30 days for abuse prevention.
        </li>
      </ul>

      <h2>2. What we never do</h2>
      <ul>
        <li>Sell or rent your data to third parties.</li>
        <li>Train Forgely&rsquo;s foundation models on your private content.</li>
        <li>Set advertising or behavioural cookies on the marketing site.</li>
      </ul>

      <h2>3. Sub-processors</h2>
      <ul>
        <li>Cloudflare — hosting, CDN, R2 object storage.</li>
        <li>Stripe — payments and subscription management.</li>
        <li>
          Anthropic, Black Forest Labs, Kuaishou (Kling), Ideogram, Meshy — AI inference (no PII
          forwarded).
        </li>
        <li>Plausible Analytics — anonymised marketing telemetry.</li>
        <li>Sentry — error reporting.</li>
        <li>Resend — transactional email.</li>
      </ul>

      <h2>4. Your rights (GDPR / CCPA)</h2>
      <p>
        You can access, export or delete your data from the account settings page, or by emailing{' '}
        <a href="mailto:privacy@forgely.com">privacy@forgely.com</a>. We respond within 14 days.
      </p>

      <h2>5. Retention</h2>
      <ul>
        <li>Account data: until you delete the account.</li>
        <li>Generated assets: 90 days after subscription cancellation.</li>
        <li>Audit logs: 24 months.</li>
        <li>Hashed IP / user-agent on waitlist: 30 days.</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        The marketing site does not set tracking cookies by default. Plausible is cookieless. The
        dashboard uses one strictly necessary session cookie (HTTP-only, Secure, SameSite=Lax).
      </p>

      <h2>7. International transfers</h2>
      <p>
        Default infrastructure is in the EU. Cross-border transfers (e.g. AI inference) are covered
        by SCCs and Cloudflare&rsquo;s DPA.
      </p>

      <h2>8. Contact</h2>
      <p>
        Data Protection Officer: <a href="mailto:dpo@forgely.com">dpo@forgely.com</a>. Supervisory
        authority: Datatilsynet (Denmark) for EU users.
      </p>
    </StaticPageShell>
  )
}

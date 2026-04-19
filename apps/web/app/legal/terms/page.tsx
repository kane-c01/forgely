import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'Forgely Terms of Service — what you and Forgely each agree to.',
  path: '/legal/terms',
})

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Terms of Service"
      intro="By signing up for Forgely you agree to these terms. We have tried to write them in plain English."
      updated="April 19, 2026"
    >
      <h2>1. Who we are</h2>
      <p>
        “Forgely”, “we”, “us” means Forgely Inc., a Delaware C-corporation. “You” means the
        individual or organisation creating an account.
      </p>

      <h2>2. The service</h2>
      <p>
        Forgely is an AI-assisted brand site builder + Medusa-backed storefront. We host the sites
        you generate on our infrastructure and provide tools to design, edit and operate them.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>You are responsible for keeping your credentials secure.</li>
        <li>You must be 16 or older to create an account.</li>
        <li>One human per Free / Starter account; teams need Pro+.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>
        You may not use Forgely to build sites that sell illegal goods, infringe IP rights, scrape
        forbidden sources, generate deceptive deepfakes, or violate FTC / FDA / GDPR / DSA / CASL
        rules.
      </p>

      <h2>5. AI-generated assets</h2>
      <p>
        Assets produced by Forgely (videos, images, copy) are licensed to you under a
        commercial-use, non-exclusive license. Re-training a third-party model on Forgely outputs at
        scale is forbidden.
      </p>

      <h2>6. Plans, credits and billing</h2>
      <p>
        Subscriptions auto-renew until cancelled. Subscription credits reset monthly and do not
        accumulate; purchased credits never expire. Pricing changes are announced 30 days in advance
        and never apply to the current billing period.
      </p>

      <h2>7. Cancellation and refunds</h2>
      <p>
        See the <a href="/legal/refunds">refund policy</a>. You can cancel any time from your
        billing page; service continues to the end of the current period.
      </p>

      <h2>8. Liability</h2>
      <p>
        Forgely is provided “as is”. To the maximum extent permitted by law, our aggregate liability
        for any claim is capped at the fees you paid us in the 12 months prior.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        Material changes will be emailed to the address on file at least 30 days before they take
        effect.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions: <a href="mailto:hello@forgely.com">hello@forgely.com</a>.
      </p>
    </StaticPageShell>
  )
}

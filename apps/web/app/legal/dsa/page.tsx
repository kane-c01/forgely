import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'DSA Statement',
  description: "Forgely's transparency information under the EU Digital Services Act (DSA).",
  path: '/legal/dsa',
})

export default function DsaPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Digital Services Act"
      intro="As a hosting provider operating in the EU, Forgely complies with the Digital Services Act. This page lists our designated contacts and reporting flows."
      updated="April 19, 2026"
    >
      <h2>Designated point of contact</h2>
      <p>
        For authorities and users: <a href="mailto:dsa@forgely.com">dsa@forgely.com</a>. Languages
        accepted: English, German, French, Dutch, Spanish.
      </p>

      <h2>Notice and action</h2>
      <p>
        Use the in-product &ldquo;Report content&rdquo; flow on any generated storefront, or email{' '}
        <a href="mailto:trust@forgely.com">trust@forgely.com</a> with:
      </p>
      <ul>
        <li>The URL of the content.</li>
        <li>The reason (illegal, fraudulent, infringing, harmful).</li>
        <li>Your contact email.</li>
      </ul>
      <p>We acknowledge within 24 hours and act within 7 days for clearly illegal content.</p>

      <h2>Statement of reasons</h2>
      <p>
        Whenever Forgely removes or downranks content, the affected user receives a Statement of
        Reasons that includes the rule applied, the evidence relied on, and the appeal process.
      </p>

      <h2>Internal complaint handling</h2>
      <p>
        Decisions can be appealed within 6 months via the in-product Trust Centre. Appeals are
        reviewed by a different team member than the original decision maker.
      </p>

      <h2>Out-of-court dispute settlement</h2>
      <p>
        Users may refer disputes to a certified out-of-court dispute settlement body in their member
        state. We will list certified bodies here once they are designated by the European
        Commission.
      </p>

      <h2>Transparency reports</h2>
      <p>
        We publish an annual transparency report covering removals, appeals and average response
        times. The first report covers calendar year 2026.
      </p>
    </StaticPageShell>
  )
}

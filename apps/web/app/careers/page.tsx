import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Careers',
  description: 'Open roles at Forgely.',
  path: '/careers',
})

export default function CareersPage() {
  return (
    <StaticPageShell
      eyebrow="Careers"
      title="Help us build the brand operating system."
      intro="Small, distributed, default-write team. We hire generalists with one deep specialty."
    >
      <h2>Currently hiring</h2>
      <ul>
        <li>
          <strong>Founding Designer</strong> — own the visual language across three product
          surfaces. Strong with motion + 3D a plus. Anywhere ±3 CET.
        </li>
        <li>
          <strong>AI Pipeline Engineer</strong> — productionise the Agent crew (Scraper → Deployer).
          TypeScript / Bun / Anthropic SDK. EU + APAC.
        </li>
        <li>
          <strong>Customer Engineer (China-out)</strong> — onboard Persona A factory founders
          shipping to the US/EU. Mandarin + English required.
        </li>
      </ul>

      <h2>How we hire</h2>
      <ol>
        <li>30-min intro with a founder.</li>
        <li>Paid 4-hour case study against a real, anonymised problem.</li>
        <li>Two technical / craft interviews.</li>
        <li>Reference calls. Offer.</li>
      </ol>

      <p>
        Apply (and tell us what you want to forge):{' '}
        <a href="mailto:work@forgely.com">work@forgely.com</a>.
      </p>
    </StaticPageShell>
  )
}

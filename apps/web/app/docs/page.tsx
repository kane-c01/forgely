import Link from 'next/link'
import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Docs',
  description: 'Getting started, guides and API reference for Forgely.',
  path: '/docs',
  noIndex: true,
})

const sections = [
  {
    title: 'Getting started',
    items: [
      'Sign up & onboarding (5 min)',
      'Generate your first site',
      'Connect Stripe + custom domain',
    ],
  },
  {
    title: 'Theme editor',
    items: ['Visual mode', 'AI mode', 'Version history & rollback'],
  },
  {
    title: 'AI Copilot',
    items: ['What it can do', 'Available tools', 'Confirmation rules'],
  },
  {
    title: 'Plans & billing',
    items: ['Credits how-to', 'Top-ups & refunds', 'Code export'],
  },
]

export default function DocsPage() {
  return (
    <StaticPageShell
      eyebrow="Docs"
      title="Documentation is on the way."
      intro="Forgely is in private beta. Onboarded customers get a full handbook + a Loom-by-Loom walkthrough. Public docs ship with the public launch."
    >
      <p>
        Want early access? Join the{' '}
        <Link href="/#waitlist">waitlist</Link> — every accepted account
        gets a 30-min onboarding call where we walk you through the
        platform live.
      </p>

      <h2>What the docs will cover</h2>
      <div className="not-prose grid grid-cols-1 gap-6 sm:grid-cols-2">
        {sections.map((s) => (
          <article
            key={s.title}
            className="rounded-2xl border border-border-strong bg-bg-deep p-6"
          >
            <h3 className="font-display text-h3 font-light text-text-primary">
              {s.title}
            </h3>
            <ul className="mt-3 flex flex-col gap-1.5 text-small text-text-secondary">
              {s.items.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </StaticPageShell>
  )
}

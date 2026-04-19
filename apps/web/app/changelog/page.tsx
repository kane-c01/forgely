import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

const entries = [
  {
    version: 'v0.7.0',
    date: 'April 19, 2026',
    title: 'Sprint 0 — three apps online',
    items: [
      'Monorepo + Design Tokens preset + shared `@forgely/ui` library (50+ components).',
      '10 Visual DNA presets and 10 Product Moment templates land in their own packages.',
      'apps/web ships the marketing MVP: Hero, value props, pricing, FAQ, waitlist.',
      'apps/app dashboard skeleton + AI Copilot drawer go live.',
      'Prisma schema covers users, sites, generations, credits, audit logs.',
    ],
  },
  {
    version: 'v0.6.0',
    date: 'April 12, 2026',
    title: 'Forge & sandbox',
    items: [
      '`/the-forge` six-act cinematic scroll preview (Lenis + GSAP).',
      '`/the-forge/full` adds Showcase grid, interactive demo, testimonials.',
      '`/generate` simulates the full 12-step Agent pipeline.',
    ],
  },
  {
    version: 'v0.5.0',
    date: 'April 5, 2026',
    title: 'Privacy & telemetry',
    items: [
      'Plausible analytics + GDPR-friendly cookie consent banner.',
      'Web Vitals reporting routed through the same consent rail.',
    ],
  },
]

export const metadata = buildMetadata({
  title: 'Changelog',
  description: 'Recent shipping log for Forgely.',
  path: '/changelog',
})

export default function ChangelogPage() {
  return (
    <StaticPageShell
      eyebrow="Changelog"
      title="What just shipped."
      intro="The last few weeks of Forgely, in reverse-chronological order. Public log, private beta."
    >
      {entries.map((e) => (
        <section key={e.version} className="mb-10">
          <h2>
            {e.version} · {e.title}
          </h2>
          <p className="text-caption text-text-muted !mb-1 font-mono uppercase tracking-[0.18em]">
            {e.date}
          </p>
          <ul>
            {e.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </StaticPageShell>
  )
}

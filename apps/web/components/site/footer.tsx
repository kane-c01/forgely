import Link from 'next/link'
import { siteConfig } from '@/lib/site'

const sections: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Showcase', href: '#showcase' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Manifesto', href: '/manifesto' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: `mailto:${siteConfig.contact}` },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Brand Library', href: '/library' },
      { label: 'Status', href: 'https://status.forgely.com', external: true },
      { label: 'GitHub', href: siteConfig.github, external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'DSA', href: '/legal/dsa' },
      { label: 'Refunds', href: '/legal/refunds' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-bg-void">
      <div className="container-page grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-2">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-forge-amber via-forge-orange to-forge-ember shadow-glow-forge"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-bg-void" aria-hidden="true">
                <path d="M5 14L12 3l7 11-7 7-7-7zm7-7l-3 5h6l-3-5z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-h3 tracking-tight text-text-primary">
              {siteConfig.name}
            </span>
          </Link>
          <p className="max-w-sm text-small text-text-muted">{siteConfig.slogan}</p>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-text-subtle">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>

        {sections.map((section) => (
          <nav key={section.title} aria-label={section.title} className="flex flex-col gap-3">
            <h4 className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">
              {section.title}
            </h4>
            <ul className="flex flex-col gap-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-small text-text-secondary transition hover:text-forge-orange"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border-subtle">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-6 sm:flex-row sm:items-center">
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-text-subtle">
            Made for brands that ship. Built in dark mode by default.
          </p>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-text-subtle">
            v0.1 · MVP · {siteConfig.domain}
          </p>
        </div>
      </div>
    </footer>
  )
}

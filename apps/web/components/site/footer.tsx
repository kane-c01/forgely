import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Link as IntlLink } from '@/i18n/navigation'
import { siteConfig } from '@/lib/site'

interface FooterLink {
  key: string
  href: string
  external?: boolean
  /** When true, render via the locale-aware Link; otherwise render an anchor (e.g. external/mailto/anchor). */
  intl?: boolean
}

interface FooterSection {
  key: 'product' | 'company' | 'resources' | 'legal'
  links: FooterLink[]
}

const sections: FooterSection[] = [
  {
    key: 'product',
    links: [
      { key: 'howItWorks', href: '#how-it-works' },
      { key: 'showcase', href: '#showcase' },
      { key: 'pricing', href: '#pricing' },
      { key: 'changelog', href: '/changelog', intl: true },
    ],
  },
  {
    key: 'company',
    links: [
      { key: 'about', href: '/about', intl: true },
      { key: 'manifesto', href: '/manifesto', intl: true },
      { key: 'careers', href: '/careers', intl: true },
      { key: 'contact', href: `mailto:${siteConfig.contact}` },
    ],
  },
  {
    key: 'resources',
    links: [
      { key: 'docs', href: '/docs', intl: true },
      { key: 'library', href: '/library', intl: true },
      { key: 'status', href: 'https://status.forgely.com', external: true },
      { key: 'github', href: siteConfig.github, external: true },
    ],
  },
  {
    key: 'legal',
    links: [
      { key: 'terms', href: '/legal/terms', intl: true },
      { key: 'privacy', href: '/legal/privacy', intl: true },
      { key: 'dsa', href: '/legal/dsa', intl: true },
      { key: 'refunds', href: '/legal/refunds', intl: true },
    ],
  },
]

export function SiteFooter() {
  const t = useTranslations('footer')
  const tSite = useTranslations('metadata.site')
  return (
    <footer className="bg-bg-void">
      <div className="container-page grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-2">
          <IntlLink href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-forge-amber via-forge-orange to-forge-ember shadow-glow-forge"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-bg-void"
                aria-hidden="true"
              >
                <path
                  d="M5 14L12 3l7 11-7 7-7-7zm7-7l-3 5h6l-3-5z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="font-display text-h3 tracking-tight text-text-primary">
              {siteConfig.name}
            </span>
          </IntlLink>
          <p className="max-w-sm text-small text-text-muted">
            {tSite('slogan')}
          </p>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-text-subtle">
            {t('copyright', {
              year: new Date().getFullYear(),
              brand: siteConfig.name,
            })}
          </p>
        </div>

        {sections.map((section) => {
          const sectionTitle = t(`sections.${section.key}.title`)
          return (
            <nav
              key={section.key}
              aria-label={sectionTitle}
              className="flex flex-col gap-3"
            >
              <h4 className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">
                {sectionTitle}
              </h4>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => {
                  const label = t(`sections.${section.key}.links.${link.key}`)
                  const className =
                    'text-small text-text-secondary transition hover:text-forge-orange'
                  if (link.intl) {
                    return (
                      <li key={link.key}>
                        <IntlLink href={link.href} className={className}>
                          {label}
                        </IntlLink>
                      </li>
                    )
                  }
                  return (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className={className}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )
        })}
      </div>

      <div className="border-t border-border-subtle">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-6 sm:flex-row sm:items-center">
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-text-subtle">
            {t('tagline')}
          </p>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-text-subtle">
            {t('version', { domain: siteConfig.domain })}
          </p>
        </div>
      </div>
    </footer>
  )
}

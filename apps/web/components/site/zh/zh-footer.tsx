import Link from 'next/link'
import { LocaleSwitcher } from '@/components/site/locale-switcher'
import { siteConfig } from '@/lib/site'
import { getMessages } from '@/lib/messages'

const sections = [
  {
    key: 'product' as const,
    links: [
      { label: '工作流程', href: '#how-it-works' },
      { label: '案例', href: '#showcase' },
      { label: '价格', href: '#pricing' },
      { label: '更新日志', href: '/changelog' },
    ],
  },
  {
    key: 'company' as const,
    links: [
      { label: '关于', href: '/about' },
      { label: '理念', href: '/manifesto' },
      { label: '招聘', href: '/careers' },
      { label: '联系', href: `mailto:${siteConfig.contact}` },
    ],
  },
  {
    key: 'resources' as const,
    links: [
      { label: '文档', href: '/docs' },
      { label: '品牌库', href: '/library' },
      { label: '运行状态', href: 'https://status.forgely.com', external: true },
      { label: 'GitHub', href: siteConfig.github, external: true },
    ],
  },
  {
    key: 'legal' as const,
    links: [
      { label: '服务条款', href: '/legal/terms' },
      { label: '隐私政策', href: '/legal/privacy' },
      { label: 'DSA', href: '/legal/dsa' },
      { label: '退款政策', href: '/legal/refunds' },
    ],
  },
]

export function ZhFooter() {
  const t = getMessages('zh-CN').footer
  return (
    <footer className="bg-bg-void">
      <div className="container-page grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-2">
          <Link href="/zh" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="from-forge-amber via-forge-orange to-forge-ember shadow-glow-forge grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br"
            >
              <svg viewBox="0 0 24 24" className="text-bg-void h-4 w-4" aria-hidden="true">
                <path d="M5 14L12 3l7 11-7 7-7-7zm7-7l-3 5h6l-3-5z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-h3 text-text-primary tracking-tight">
              {siteConfig.name}
            </span>
          </Link>
          <p className="text-small text-text-muted max-w-sm">{t.slogan}</p>
          <LocaleSwitcher current="zh-CN" />
          <p className="text-caption text-text-subtle font-mono uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} {siteConfig.name}. {t.rights}
          </p>
        </div>

        {sections.map((section) => (
          <nav
            key={section.key}
            aria-label={t.sections[section.key]}
            className="flex flex-col gap-3"
          >
            <h4 className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
              {t.sections[section.key]}
            </h4>
            <ul className="flex flex-col gap-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={'external' in link && link.external ? '_blank' : undefined}
                    rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                    className="text-small text-text-secondary hover:text-forge-orange transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-border-subtle border-t">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-6 sm:flex-row sm:items-center">
          <p className="text-caption text-text-subtle font-mono uppercase tracking-[0.2em]">
            {t.bottomA}
          </p>
          <p className="text-caption text-text-subtle font-mono uppercase tracking-[0.2em]">
            {t.bottomB}
          </p>
        </div>
      </div>
    </footer>
  )
}

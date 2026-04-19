import Link from 'next/link'
import { SUPER_NAV } from '@/lib/super'
import type { Route } from 'next'

/**
 * "Coming soon" stub for the 9 non-MVP modules listed in the sidebar
 * (sites, ai-ops, content, plugins, analytics, marketing, support, settings,
 * health). Anything that isn't a recognised slug 404s normally.
 */
export default function SuperPlaceholderPage({
  params,
}: {
  params: { notFound: string }
}) {
  const slug = params.notFound
  const item = SUPER_NAV.find((it) => it.href === `/super/${slug}`)
  if (!item) {
    return (
      <div className="grid h-[60vh] place-items-center text-center">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-error">
            404
          </div>
          <p className="mt-2 text-small text-text-muted">
            No /super module at <span className="font-mono">/{slug}</span>.
          </p>
          <Link
            href={'/super' as Route}
            className="mt-4 inline-block font-mono text-caption uppercase tracking-[0.18em] text-forge-amber hover:underline"
          >
            ← Back to overview
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="grid h-[60vh] place-items-center text-center">
      <div className="max-w-md">
        <div className="font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
          {item.group.toUpperCase()} module · {item.status}
        </div>
        <h1 className="mt-2 font-display text-h2 text-text-primary">{item.label}</h1>
        <p className="mt-3 text-small text-text-muted">
          This module is on the {item.group === 'v1' ? 'V1 (first 3 months)' : 'V2 (6+ months)'}{' '}
          roadmap. The W7 MVP shipped Overview, Users, Finance, Audit and Team — the rest of the
          14 modules in docs/MASTER.md §20.4 are unlocked here as they land.
        </p>
        <Link
          href={'/super' as Route}
          className="mt-6 inline-block border border-border-strong px-4 py-2 font-mono text-caption uppercase tracking-[0.18em] text-text-primary transition-colors hover:border-forge-amber hover:text-forge-amber"
        >
          ← Back to overview
        </Link>
      </div>
    </div>
  )
}

export function generateStaticParams() {
  return SUPER_NAV.filter((it) => it.status !== 'live')
    .map((it) => it.href.replace('/super/', ''))
    .filter((slug) => slug !== '/super')
    .map((notFound) => ({ notFound }))
}

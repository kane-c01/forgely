'use client'

import type { ReactNode } from 'react'

import { useT } from '@/lib/i18n'
import type { TranslationKeys } from '@/lib/i18n'

type SuperKeys = keyof TranslationKeys['super']

interface I18nHeaderProps {
  /** Key under `t.super.*` — e.g. "overview", "users", "plugins". */
  section: Exclude<SuperKeys, 'sidebar' | 'topbar' | 'restricted' | 'common'>
  /** Extra JSX rendered on the right side (e.g. timestamp, badges, refresh). */
  meta?: ReactNode
}

/**
 * Bilingual page header used across every /super page.
 *
 * Reads `eyebrow`, `title`, and optional `description` from
 * `t.super.{section}` so changing locale flips the entire header at once.
 */
export function I18nHeader({ section, meta }: I18nHeaderProps) {
  const t = useT()
  const s = t.super[section] as { eyebrow?: string; title?: string; description?: string }

  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {s.eyebrow ? (
          <div className="text-caption text-text-muted font-mono uppercase tracking-[0.22em]">
            {s.eyebrow}
          </div>
        ) : null}
        {s.title ? <h1 className="font-display text-h2 text-text-primary">{s.title}</h1> : null}
        {s.description ? (
          <p className="text-small text-text-muted mt-1 max-w-xl">{s.description}</p>
        ) : null}
      </div>
      {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
    </header>
  )
}

interface RestrictedBannerProps {
  role: string
  level: 'admin' | 'owner'
}

export function RestrictedBanner({ role, level }: RestrictedBannerProps) {
  return <RestrictedBannerClient role={role} level={level} />
}

function RestrictedBannerClient({ role, level }: RestrictedBannerProps) {
  const t = useT()
  return (
    <div className="grid h-[60vh] place-items-center text-center">
      <div>
        <div className="text-caption text-error font-mono uppercase tracking-[0.22em]">
          {t.super.restricted.title}
        </div>
        <p className="text-small text-text-muted mt-2 max-w-md">
          {level === 'owner' ? t.super.restricted.descOwner : t.super.restricted.descSupport}{' '}
          {t.super.restricted.currentRole}{' '}
          <span className="text-text-secondary font-mono">{role}</span>。
        </p>
      </div>
    </div>
  )
}

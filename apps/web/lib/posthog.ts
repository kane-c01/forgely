import type posthog from 'posthog-js'

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'

export const isPosthogEnabled = Boolean(POSTHOG_KEY)

let posthogInstance: typeof posthog | null = null

/** Lazy client-only PostHog init. Returns null on SSR or when no key. */
export async function getPosthog(): Promise<typeof posthog | null> {
  if (typeof window === 'undefined') return null
  if (!isPosthogEnabled) return null
  if (posthogInstance) return posthogInstance
  const mod = (await import('posthog-js')).default
  mod.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
    persistence: 'localStorage+cookie',
    person_profiles: 'identified_only',
  })
  posthogInstance = mod
  return mod
}

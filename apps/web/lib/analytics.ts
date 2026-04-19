/**
 * Analytics + consent abstraction.
 *
 * Why a thin wrapper:
 * - Lets us swap providers (Plausible, PostHog, GA, Pirsch…) without
 *   touching call-sites.
 * - Hard-gates every event on the user's stored consent state so we
 *   stay GDPR / DSA / CCPA friendly.
 * - Keeps zero runtime weight when consent is `denied` or unset.
 *
 * The default provider is Plausible (cookieless, privacy-first). It
 * ships only when the `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var is set
 * AND the user has accepted analytics.
 */

export type ConsentChoice = 'accepted' | 'denied' | 'pending'

export const CONSENT_STORAGE_KEY = 'forgely.consent'
export const CONSENT_VERSION = 1

export interface ConsentRecord {
  choice: ConsentChoice
  version: number
  decidedAt: string | null
}

export const DEFAULT_CONSENT: ConsentRecord = {
  choice: 'pending',
  version: CONSENT_VERSION,
  decidedAt: null,
}

export interface AnalyticsEvent {
  name: string
  /** Free-form properties — strings, numbers or booleans only. */
  props?: Record<string, string | number | boolean>
}

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void
  }
}

export function readConsent(): ConsentRecord {
  if (typeof window === 'undefined') return DEFAULT_CONSENT
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return DEFAULT_CONSENT
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>
    if (parsed.version !== CONSENT_VERSION) return DEFAULT_CONSENT
    if (parsed.choice !== 'accepted' && parsed.choice !== 'denied') return DEFAULT_CONSENT
    return {
      choice: parsed.choice,
      version: CONSENT_VERSION,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : null,
    }
  } catch {
    return DEFAULT_CONSENT
  }
}

export function writeConsent(choice: Exclude<ConsentChoice, 'pending'>): ConsentRecord {
  const record: ConsentRecord = {
    choice,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
      window.dispatchEvent(new CustomEvent('forgely:consent', { detail: record }))
    } catch {
      /* private mode etc. — fail silently */
    }
  }
  return record
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return
  if (readConsent().choice !== 'accepted') return
  if (typeof window.plausible !== 'function') return
  window.plausible(event.name, event.props ? { props: event.props } : undefined)
}

export const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? ''
export const PLAUSIBLE_SCRIPT_SRC =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC ?? 'https://plausible.io/js/script.outbound-links.js'

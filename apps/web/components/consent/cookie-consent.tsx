'use client'

import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConsent } from './consent-provider'

/**
 * GDPR / DSA / CCPA-friendly consent banner.
 *
 * - Forgely's default analytics (Plausible) is cookieless, but we still
 *   surface a clear opt-in to set the right precedent and to be ready
 *   for higher-touch tools (PostHog session replay, Stripe, Intercom).
 * - The banner is a non-modal, sticky region pinned to the bottom-left
 *   so it never covers the primary CTA. Esc / "Decline" both close it
 *   and store the choice; "Settings" reopens it on demand.
 * - The banner is rendered only when `prompting` is true AND the user
 *   has hydrated, so the SSR HTML stays empty for visitors who already
 *   decided — keeping CLS at zero.
 */
export function CookieConsent() {
  const { prompting, accept, decline, dismiss } = useConsent()

  if (!prompting) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and analytics preferences"
      className="border-border-strong bg-bg-elevated shadow-elevated fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border p-5 backdrop-blur-md sm:left-6 sm:right-auto"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="bg-forge-orange/10 text-forge-orange grid h-10 w-10 shrink-0 place-items-center rounded-full"
        >
          <Cookie className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-h3 text-text-primary font-light">
            Privacy-first by default.
          </h2>
          <p className="text-small text-text-secondary mt-2">
            Forgely uses Plausible — a cookieless, GDPR-compliant analytics tool — to understand
            which marketing pages help. No personal data leaves the EU. You can opt out at any time
            via the footer.
          </p>
          <p className="text-caption text-text-muted mt-2">
            Read the full{' '}
            <Link href="/legal/privacy" className="hover:text-forge-orange underline">
              privacy policy
            </Link>{' '}
            for details.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="forge" size="sm" onClick={accept}>
              Accept analytics
            </Button>
            <Button variant="secondary" size="sm" onClick={decline}>
              Decline
            </Button>
            <Link
              href="/legal/privacy"
              className="text-small text-text-secondary hover:text-forge-orange ml-1 underline-offset-2 hover:underline"
            >
              Learn more
            </Link>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss for now"
          className="text-text-muted hover:bg-bg-deep hover:text-text-primary grid h-8 w-8 place-items-center rounded-md transition"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

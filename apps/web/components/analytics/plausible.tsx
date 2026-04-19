'use client'

import Script from 'next/script'
import { useConsent } from '@/components/consent/consent-provider'
import { PLAUSIBLE_DOMAIN, PLAUSIBLE_SCRIPT_SRC } from '@/lib/analytics'

/**
 * Plausible loader — gated on consent + env config.
 *
 * - We use `next/script` with `strategy="afterInteractive"` so the
 *   script never blocks the LCP.
 * - When the user revokes consent, the script is unmounted (the
 *   subsequent `next/script` runtime call to `removeChild` cleans up
 *   the global `window.plausible` callable).
 * - When `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is empty (e.g. local dev),
 *   we skip the script entirely. This means previews / smoke tests
 *   never hit the network.
 */
export function PlausibleAnalytics() {
  const { consent } = useConsent()

  if (!PLAUSIBLE_DOMAIN) return null
  if (consent.choice !== 'accepted') return null

  return (
    <Script
      id="forgely-plausible"
      strategy="afterInteractive"
      src={PLAUSIBLE_SCRIPT_SRC}
      data-domain={PLAUSIBLE_DOMAIN}
      data-api={`https://${PLAUSIBLE_DOMAIN}/api/event`}
    />
  )
}

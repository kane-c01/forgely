'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { trackEvent } from '@/lib/analytics'

/**
 * Mounts Next.js's `useReportWebVitals` hook and forwards each metric
 * to our analytics layer. The forwarder is itself consent-gated, so
 * if the user declined we never emit.
 *
 * Field semantics (Next.js 14):
 * - `name` is one of FCP / LCP / CLS / INP / TTFB / FID / Next.js-hydration.
 * - `value` is the metric value (ms for time, unitless for CLS).
 * - `id` is unique per page-load × metric (good for deduplication).
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    trackEvent({
      name: 'web-vitals',
      props: {
        metric: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating ?? 'unknown',
        id: metric.id,
      },
    })
  })
  return null
}

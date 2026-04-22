'use client'

import { ComingSoon } from '@/components/shell/coming-soon'
import { useT } from '@/lib/i18n'

export default function AnalyticsPage() {
  const t = useT()
  return (
    <ComingSoon
      eyebrow={t.analytics.eyebrow}
      title={t.analytics.title}
      description={t.analytics.description}
      expected={t.analytics.expected}
      bullets={[t.analytics.bullet1, t.analytics.bullet2, t.analytics.bullet3, t.analytics.bullet4]}
    />
  )
}

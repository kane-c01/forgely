'use client'

import { ComingSoon } from '@/components/shell/coming-soon'
import { useT } from '@/lib/i18n'

export default function DiscountsPage() {
  const t = useT()
  return (
    <ComingSoon
      eyebrow={t.discounts.eyebrow}
      title={t.discounts.title}
      description={t.discounts.description}
      expected={t.discounts.expected}
      bullets={[t.discounts.bullet1, t.discounts.bullet2, t.discounts.bullet3, t.discounts.bullet4]}
    />
  )
}

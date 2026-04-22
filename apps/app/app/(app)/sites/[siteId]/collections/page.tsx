'use client'

import { ComingSoon } from '@/components/shell/coming-soon'
import { useT } from '@/lib/i18n'

export default function CollectionsPage() {
  const t = useT()
  return (
    <ComingSoon
      eyebrow={t.collections.eyebrow}
      title={t.collections.title}
      description={t.collections.description}
      expected={t.collections.expected}
      bullets={[
        t.collections.bullet1,
        t.collections.bullet2,
        t.collections.bullet3,
        t.collections.bullet4,
      ]}
    />
  )
}

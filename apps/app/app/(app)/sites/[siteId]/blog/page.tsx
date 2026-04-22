'use client'

import { ComingSoon } from '@/components/shell/coming-soon'
import { useT } from '@/lib/i18n'

export default function BlogPage() {
  const t = useT()
  return (
    <ComingSoon
      eyebrow={t.blog.eyebrow}
      title={t.blog.title}
      description={t.blog.description}
      expected={t.blog.expected}
      bullets={[t.blog.bullet1, t.blog.bullet2, t.blog.bullet3, t.blog.bullet4]}
    />
  )
}

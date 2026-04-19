import { ComingSoon } from '@/components/shell/coming-soon'

export default function PagesIndex() {
  return (
    <ComingSoon
      eyebrow="Content"
      title="CMS pages"
      description="Long-form pages outside the storefront — About, Press, FAQ, Returns."
      expected="Week 12"
      bullets={['Markdown + MDX', 'AI rewrite/translate', 'Versioning', 'Custom OG images']}
    />
  )
}

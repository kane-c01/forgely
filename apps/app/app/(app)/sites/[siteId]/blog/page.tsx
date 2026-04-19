import { ComingSoon } from '@/components/shell/coming-soon'

export default function BlogPage() {
  return (
    <ComingSoon
      eyebrow="Content"
      title="Blog"
      description="Editorial layout for stories, recipes and brand journals."
      expected="V1.1"
      bullets={['MDX writing', 'Category & tag taxonomy', 'AI cover image', 'RSS / Atom feeds']}
    />
  )
}

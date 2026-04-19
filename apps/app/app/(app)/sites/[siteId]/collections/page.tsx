import { ComingSoon } from '@/components/shell/coming-soon'

export default function CollectionsPage() {
  return (
    <ComingSoon
      eyebrow="Catalog"
      title="Collections"
      description="Group products into themed sets to power navigation, hero blocks and Pinterest-style grids."
      expected="Week 8"
      bullets={[
        'Drag-and-drop ordering',
        'Smart auto-collections by tag / vendor',
        'Sync to storefront navigation',
        'AI-generated SEO copy per collection',
      ]}
    />
  )
}

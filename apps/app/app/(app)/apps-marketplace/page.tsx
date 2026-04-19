import { ComingSoon } from '@/components/shell/coming-soon'

export default function AppsMarketplacePage() {
  return (
    <ComingSoon
      eyebrow="Marketplace"
      title="Apps & integrations"
      description="Browse, install and configure third-party apps that extend Forgely."
      expected="V2 (6 mo)"
      bullets={[
        'Verified developer apps',
        'Free + paid plans',
        '70/30 revenue split',
        'Built-in OAuth + API tokens',
      ]}
    />
  )
}

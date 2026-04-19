import { ComingSoon } from '@/components/shell/coming-soon'

export default function SiteAppsPage() {
  return (
    <ComingSoon
      eyebrow="Extensions"
      title="Installed apps"
      description="Marketplace plugins enabled on this site (reviews, loyalty, upsell, etc)."
      expected="V2"
      bullets={['Per-site enable / disable', 'Per-app permissions', 'Webhook log', 'Self-published apps']}
    />
  )
}

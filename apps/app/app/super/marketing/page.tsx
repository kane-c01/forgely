import { getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { MarketingSummary, MarketingProviders } from './_components/MarketingSummary'
import { MarketingTabs } from './_components/MarketingTabs'

export const metadata = {
  title: 'Forgely Command · Marketing',
}

export default async function SuperMarketingPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return <RestrictedBanner role={session.role} level="admin" />
  }

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="marketing" />
      <MarketingSummary />
      <MarketingProviders />
      <MarketingTabs />
    </div>
  )
}

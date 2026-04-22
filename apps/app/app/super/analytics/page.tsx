import { getPlatformAnalytics, getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { AnalyticsDashboard } from './_components/AnalyticsDashboard'

export const metadata = {
  title: 'Forgely Command · Platform Analytics',
}

export default async function SuperAnalyticsPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return <RestrictedBanner role={session.role} level="admin" />
  }

  const overview = getPlatformAnalytics()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="analytics" />
      <AnalyticsDashboard overview={overview} />
    </div>
  )
}

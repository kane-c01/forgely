import { getHealthOverview, getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { HealthDashboard } from './_components/HealthDashboard'

export const metadata = {
  title: 'Forgely Command · System Health',
}

export default async function SuperHealthPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return <RestrictedBanner role={session.role} level="admin" />
  }

  const overview = getHealthOverview()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="health" />
      <HealthDashboard overview={overview} />
    </div>
  )
}

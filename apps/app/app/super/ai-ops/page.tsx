import { getAiOpsOverview, getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { AiOpsDashboard } from './_components/AiOpsClient'

export const metadata = {
  title: 'Forgely Command · AI Ops',
}

export default async function SuperAiOpsPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return <RestrictedBanner role={session.role} level="admin" />
  }

  const overview = getAiOpsOverview()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="aiOps" />
      <AiOpsDashboard overview={overview} />
    </div>
  )
}

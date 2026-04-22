import { getSuperSession, getSuperSites } from '@/lib/super'
import { I18nHeader } from '../_components/I18nHeader'
import { SitesClient, SitesStats, SitesOpsCard } from './_components/SitesClient'

export const metadata = {
  title: 'Forgely Command · Sites',
}

export default async function SuperSitesPage() {
  await getSuperSession()
  const sites = getSuperSites()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="sites" />
      <SitesStats sites={sites} />
      <SitesOpsCard />
      <SitesClient sites={sites} />
    </div>
  )
}

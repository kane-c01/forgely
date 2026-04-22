import { getSuperContent, getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { ContentClient } from './_components/ContentClient'

export const metadata = {
  title: 'Forgely Command · Content',
}

export default async function SuperContentPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return <RestrictedBanner role={session.role} level="admin" />
  }

  const items = getSuperContent()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="content" />
      <ContentClient items={items} />
    </div>
  )
}

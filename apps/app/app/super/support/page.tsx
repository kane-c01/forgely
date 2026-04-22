import { getSupportTickets, getSuperSession } from '@/lib/super'
import { I18nHeader } from '../_components/I18nHeader'
import { SupportClient } from './_components/SupportClient'

export const metadata = {
  title: 'Forgely Command · Support',
}

export default async function SuperSupportPage() {
  await getSuperSession()
  const tickets = getSupportTickets()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="support" />
      <SupportClient tickets={tickets} />
    </div>
  )
}

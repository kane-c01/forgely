import { getFinanceSnapshot, getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { FinanceClient } from './_components/FinanceClient'

export const metadata = {
  title: 'Forgely Command · Finance',
}

export default async function SuperFinancePage() {
  const session = await getSuperSession()
  if (session.role !== 'OWNER') {
    return <RestrictedBanner role={session.role} level="owner" />
  }

  const snapshot = getFinanceSnapshot()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="finance" />
      <FinanceClient snapshot={snapshot} />
    </div>
  )
}

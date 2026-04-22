import { getUserDetail, getUserRows } from '@/lib/super'
import type { SuperUserDetail } from '@/lib/super'
import { I18nHeader } from '../_components/I18nHeader'
import { UsersClient } from './_components/UsersClient'

export const metadata = {
  title: 'Forgely Command · Users',
}

export default function SuperUsersPage() {
  const rows = getUserRows()
  const details: Record<string, SuperUserDetail> = {}
  for (const row of rows) {
    const d = getUserDetail(row.id)
    if (d) details[row.id] = d
  }

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="users" />
      <UsersClient rows={rows} details={details} />
    </div>
  )
}

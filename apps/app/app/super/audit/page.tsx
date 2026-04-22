import { getAuditActions, getAuditActors, getSuperSession, queryAudit } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { AuditClient } from './_components/AuditClient'

export const metadata = {
  title: 'Forgely Command · Audit Log',
}

export default async function SuperAuditPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return <RestrictedBanner role={session.role} level="admin" />
  }

  const result = queryAudit({ pageSize: 500 })

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="audit" />
      <AuditClient result={result} actions={getAuditActions()} actors={getAuditActors()} />
    </div>
  )
}

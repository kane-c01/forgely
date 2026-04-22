import { getPlatformSettings, getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { SettingsClient } from './_components/SettingsClient'

export const metadata = {
  title: 'Forgely Command · Platform Settings',
}

export default async function SuperSettingsPage() {
  const session = await getSuperSession()
  if (session.role !== 'OWNER') {
    return <RestrictedBanner role={session.role} level="owner" />
  }

  const settings = getPlatformSettings()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="settings" />
      <SettingsClient settings={settings} />
    </div>
  )
}

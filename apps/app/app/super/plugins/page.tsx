import { getSuperPlugins, getSuperSession } from '@/lib/super'
import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { PluginsClient, PluginsStats, PluginsPolicyCard } from './_components/PluginsClient'

export const metadata = {
  title: 'Forgely Command · Plugins',
}

export default async function SuperPluginsPage() {
  const session = await getSuperSession()
  if (session.role === 'SUPPORT') {
    return <RestrictedBanner role={session.role} level="admin" />
  }

  const plugins = getSuperPlugins()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="plugins" />
      <PluginsStats plugins={plugins} />
      <PluginsPolicyCard />
      <PluginsClient plugins={plugins} />
    </div>
  )
}

'use client'

import Link from 'next/link'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/cn'

export default function SiteAppsPage({ params }: { params: { siteId: string } }) {
  const installed = trpc.plugins.installed.useQuery({ siteId: params.siteId })
  const toggleMutation = trpc.plugins.toggle.useMutation({
    onSuccess: () => installed.refetch(),
  })
  const uninstallMutation = trpc.plugins.uninstall.useMutation({
    onSuccess: () => installed.refetch(),
  })

  const apps = installed.data ?? []

  const handleToggle = (pluginId: string, enabled: boolean) => {
    toggleMutation.mutate({ siteId: params.siteId, pluginId, enabled })
  }

  const handleUninstall = (pluginId: string) => {
    if (confirm('Are you sure you want to uninstall this app?')) {
      uninstallMutation.mutate({ siteId: params.siteId, pluginId })
    }
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Site"
        title="Installed apps"
        description="Manage apps and integrations installed on this site."
        meta={<Badge tone="info">{apps.length} installed</Badge>}
        actions={
          <Link href="/apps-marketplace">
            <Button>
              <Icon.Plus size={14} /> Browse marketplace
            </Button>
          </Link>
        }
      />

      {apps.length === 0 ? (
        <div className="border-border-strong bg-bg-surface flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <span className="border-forge-orange/30 bg-bg-deep text-forge-amber grid h-14 w-14 place-items-center rounded-full border">
            <Icon.Box size={24} />
          </span>
          <div>
            <h3 className="font-heading text-h3 text-text-primary">No apps installed</h3>
            <p className="text-small text-text-secondary mt-1 max-w-sm">
              Visit the marketplace to discover analytics, chat, shipping and more.
            </p>
          </div>
          <Link href="/apps-marketplace">
            <Button variant="primary" className="mt-2">
              <Icon.Sparkle size={14} /> Browse marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const a = app as Record<string, unknown>
            const pluginId = a.pluginId as string
            const enabled = a.enabled as boolean

            return (
              <div
                key={pluginId}
                className={cn(
                  'bg-bg-surface flex items-center gap-4 rounded-lg border p-4 transition-colors',
                  enabled ? 'border-border-subtle' : 'border-border-subtle opacity-60',
                )}
              >
                <span className="bg-bg-deep grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl">
                  {a.icon as string}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-small text-text-primary font-medium">
                      {a.name as string}
                    </h3>
                    <Badge tone={enabled ? 'success' : 'neutral'} dot>
                      {enabled ? 'active' : 'disabled'}
                    </Badge>
                  </div>
                  <p className="text-caption text-text-secondary mt-0.5">
                    {a.description as string}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="outline">{a.category as string}</Badge>

                  <button
                    type="button"
                    onClick={() => handleToggle(pluginId, !enabled)}
                    disabled={toggleMutation.isPending}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      enabled ? 'bg-forge-orange' : 'bg-bg-elevated',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                        enabled ? 'translate-x-6' : 'translate-x-1',
                      )}
                    />
                  </button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUninstall(pluginId)}
                    disabled={uninstallMutation.isPending}
                  >
                    <Icon.Trash size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

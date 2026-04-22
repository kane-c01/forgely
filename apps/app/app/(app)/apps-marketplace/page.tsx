'use client'

import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/cn'

const CATEGORY_KEYS = [
  'all',
  'analytics',
  'support',
  'social-proof',
  'shipping',
  'payments',
  'seo',
  'marketing',
] as const

interface MarketplaceApp {
  pluginId: string
  name: string
  description: string
  category: string
  icon: string
  verified: boolean
  free: boolean
}

export default function AppsMarketplacePage() {
  const t = useT()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [activeApp, setActiveApp] = useState<MarketplaceApp | null>(null)

  const CAT_LABEL: Record<string, string> = {
    all: t.appsMarketplace.catAll,
    analytics: t.appsMarketplace.catAnalytics,
    support: t.appsMarketplace.catSupport,
    'social-proof': t.appsMarketplace.catSocialProof,
    shipping: t.appsMarketplace.catShipping,
    payments: t.appsMarketplace.catPayments,
    seo: t.appsMarketplace.catSeo,
    marketing: t.appsMarketplace.catMarketing,
  }

  const marketplace = trpc.plugins.marketplace.useQuery()
  const apps = useMemo<MarketplaceApp[]>(
    () => (marketplace.data ?? []) as MarketplaceApp[],
    [marketplace.data],
  )

  const filtered = useMemo(() => {
    return apps
      .filter((a) => category === 'all' || a.category === category)
      .filter((a) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          (a.name ?? '').toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q)
        )
      })
  }, [apps, category, search])

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow={t.appsMarketplace.eyebrow}
        title={t.appsMarketplace.title}
        description={t.appsMarketplace.description}
        meta={
          <Badge tone="success" dot>
            {apps.length} {t.appsMarketplace.appsAvailable}
          </Badge>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon.Search
            size={14}
            className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.appsMarketplace.searchApps}
            className="w-64 pl-8"
          />
        </div>
        <div className="border-border-subtle bg-bg-deep flex gap-1 rounded-lg border p-1">
          {CATEGORY_KEYS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setCategory(val)}
              className={cn(
                'text-caption rounded-md px-3 py-1 transition-colors',
                category === val
                  ? 'bg-forge-orange text-bg-void font-medium'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {CAT_LABEL[val]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((app) => (
          <AppCard key={app.pluginId} app={app} t={t} onSelect={() => setActiveApp(app)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border-border-strong bg-bg-surface text-text-muted flex flex-col items-center gap-2 rounded-lg border border-dashed py-10">
          <Icon.Search size={28} />
          <p>{t.appsMarketplace.noMatch}</p>
        </div>
      )}

      {activeApp && <AppManagerModal app={activeApp} t={t} onClose={() => setActiveApp(null)} />}
    </div>
  )
}

function AppCard({
  app,
  t,
  onSelect,
}: {
  app: MarketplaceApp
  t: ReturnType<typeof useT>
  onSelect: () => void
}) {
  // Light-touch installation indicator — fetched lazily so we don't issue N
  // queries when the page loads. We bail when the data isn't here yet so the
  // grid stays snappy.
  const installations = trpc.plugins.installations.useQuery(
    { pluginId: app.pluginId },
    { staleTime: 30_000 },
  )
  const installedSites = (installations.data ?? []).filter((i) => i.installed)
  const enabledCount = installedSites.filter((i) => i.enabled).length

  return (
    <div className="border-border-subtle bg-bg-surface hover:border-forge-orange/40 group flex flex-col rounded-lg border p-4 transition-colors">
      <div className="flex items-start gap-3">
        <span className="bg-bg-deep grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl">
          {app.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-small text-text-primary truncate font-medium">
              {app.name}
            </h3>
            {app.verified && <Icon.Check size={12} className="text-forge-amber shrink-0" />}
          </div>
          <p className="text-caption text-text-secondary mt-0.5 line-clamp-2">{app.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="outline">{app.category}</Badge>
          {app.free ? (
            <Badge tone="success">{t.appsMarketplace.free}</Badge>
          ) : (
            <Badge tone="forge">{t.appsMarketplace.paid}</Badge>
          )}
          {installedSites.length > 0 && (
            <Badge tone="info">
              {enabledCount}/{installedSites.length} {t.appsMarketplace.active}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant={installedSites.length > 0 ? 'secondary' : 'primary'}
          onClick={onSelect}
        >
          {installedSites.length > 0 ? t.appsMarketplace.manage : t.appsMarketplace.install}
        </Button>
      </div>
    </div>
  )
}

function AppManagerModal({
  app,
  t,
  onClose,
}: {
  app: MarketplaceApp
  t: ReturnType<typeof useT>
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const installations = trpc.plugins.installations.useQuery({ pluginId: app.pluginId })
  const install = trpc.plugins.install.useMutation({
    onSuccess: () => {
      utils.plugins.installations.invalidate({ pluginId: app.pluginId })
    },
  })
  const toggle = trpc.plugins.toggle.useMutation({
    onSuccess: () => utils.plugins.installations.invalidate({ pluginId: app.pluginId }),
  })
  const updateConfig = trpc.plugins.updateConfig.useMutation({
    onSuccess: () => utils.plugins.installations.invalidate({ pluginId: app.pluginId }),
  })
  const uninstall = trpc.plugins.uninstall.useMutation({
    onSuccess: () => utils.plugins.installations.invalidate({ pluginId: app.pluginId }),
  })

  const rows = installations.data ?? []
  const [configEditorFor, setConfigEditorFor] = useState<string | null>(null)
  const [draftConfig, setDraftConfig] = useState('{}')
  const [draftError, setDraftError] = useState<string | null>(null)

  const openEditor = (siteId: string, current: Record<string, unknown> | null) => {
    setConfigEditorFor(siteId)
    setDraftConfig(JSON.stringify(current ?? {}, null, 2))
    setDraftError(null)
  }

  const saveConfig = async () => {
    try {
      const parsed = JSON.parse(draftConfig) as Record<string, unknown>
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        throw new Error('Config must be a JSON object.')
      }
      await updateConfig.mutateAsync({
        siteId: configEditorFor as string,
        pluginId: app.pluginId,
        config: parsed,
      })
      setConfigEditorFor(null)
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Invalid JSON.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="border-border-subtle bg-bg-surface w-full max-w-2xl rounded-lg border shadow-xl">
        <header className="border-border-subtle flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="bg-bg-deep grid h-12 w-12 shrink-0 place-items-center rounded-lg text-2xl">
              {app.icon}
            </span>
            <div>
              <h3 className="font-heading text-h3 text-text-primary">{app.name}</h3>
              <p className="text-caption text-text-secondary mt-0.5">{app.description}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone="outline">{app.category}</Badge>
                {app.free ? (
                  <Badge tone="success">{t.appsMarketplace.free}</Badge>
                ) : (
                  <Badge tone="forge">{t.appsMarketplace.paid}</Badge>
                )}
                {app.verified && <Badge tone="info">{t.appsMarketplace.verified}</Badge>}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:bg-bg-elevated hover:text-text-primary rounded p-1"
          >
            <Icon.Close size={16} />
          </button>
        </header>

        <div className="space-y-3 p-5">
          <p className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
            {t.appsMarketplace.sitesLabel}
          </p>
          {installations.isLoading && (
            <p className="text-small text-text-muted">{t.appsMarketplace.loading}</p>
          )}
          {!installations.isLoading && rows.length === 0 && (
            <div className="border-border-strong bg-bg-deep text-small text-text-muted rounded-md border border-dashed p-6 text-center">
              {t.appsMarketplace.noSites}
            </div>
          )}

          {rows.map(({ site, installed, enabled, installedAt, config }) => (
            <div key={site.id} className="border-border-subtle bg-bg-deep rounded-md border p-4">
              <div className="flex items-center gap-3">
                <span className="border-border-subtle bg-bg-surface text-text-muted grid h-9 w-9 shrink-0 place-items-center rounded-full border">
                  <Icon.Sites size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-small text-text-primary truncate">{site.name}</p>
                  <p className="text-caption text-text-muted font-mono">
                    {site.subdomain}.forgely.app · {site.status}
                  </p>
                </div>
                {installed ? (
                  <div className="flex items-center gap-2">
                    <Badge tone={enabled ? 'success' : 'neutral'} dot>
                      {enabled ? t.appsMarketplace.active : t.appsMarketplace.disabled}
                    </Badge>
                    <button
                      type="button"
                      onClick={() =>
                        toggle.mutate({
                          siteId: site.id,
                          pluginId: app.pluginId,
                          enabled: !enabled,
                        })
                      }
                      disabled={toggle.isPending}
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
                    <Button size="sm" variant="ghost" onClick={() => openEditor(site.id, config)}>
                      <Icon.Settings size={14} /> {t.appsMarketplace.configure}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Uninstall ${app.name} from ${site.name}?`)) {
                          uninstall.mutate({ siteId: site.id, pluginId: app.pluginId })
                        }
                      }}
                      disabled={uninstall.isPending}
                    >
                      <Icon.Trash size={14} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      install.mutate({
                        siteId: site.id,
                        pluginId: app.pluginId,
                      })
                    }
                    disabled={install.isPending}
                  >
                    {install.isPending ? t.appsMarketplace.installing : t.appsMarketplace.install}
                  </Button>
                )}
              </div>

              {installed && installedAt && (
                <p className="text-caption text-text-muted mt-2 font-mono">
                  {t.appsMarketplace.installed}{' '}
                  {new Date(installedAt as unknown as string).toLocaleDateString()}
                </p>
              )}

              {configEditorFor === site.id && (
                <div className="border-border-subtle bg-bg-surface mt-3 space-y-2 rounded border p-3">
                  <Field label={t.appsMarketplace.configJson} hint={t.appsMarketplace.configHint}>
                    <Textarea
                      value={draftConfig}
                      onChange={(e) => setDraftConfig(e.target.value)}
                      className="text-caption min-h-32 font-mono"
                      spellCheck={false}
                    />
                  </Field>
                  {draftError && <p className="text-caption text-error">{draftError}</p>}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfigEditorFor(null)}>
                      {t.appsMarketplace.cancel}
                    </Button>
                    <Button size="sm" onClick={saveConfig} disabled={updateConfig.isPending}>
                      {updateConfig.isPending
                        ? t.appsMarketplace.saving
                        : t.appsMarketplace.saveConfig}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <footer className="border-border-subtle bg-bg-deep/40 flex items-center justify-between border-t px-5 py-3">
          <span className="text-caption text-text-muted">
            {install.error?.message ?? toggle.error?.message ?? uninstall.error?.message ?? ''}
          </span>
          <Button variant="secondary" onClick={onClose}>
            {t.appsMarketplace.done}
          </Button>
        </footer>
      </div>
    </div>
  )
}

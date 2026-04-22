'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { useLocale, useT, normalizeLocale } from '@/lib/i18n'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/cn'

type Tab = 'profile' | 'workspace' | 'notifications'

export default function GlobalSettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const t = useT()

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <PageHeader
        eyebrow={t.settings.eyebrow}
        title={t.settings.title}
        description={t.settings.description}
      />

      <div className="flex gap-6">
        <nav className="w-48 shrink-0 space-y-1">
          {(
            [
              { key: 'profile', label: t.settings.tabs.profile, icon: Icon.User },
              { key: 'workspace', label: t.settings.tabs.workspace, icon: Icon.Settings },
              { key: 'notifications', label: t.settings.tabs.notifications, icon: Icon.Bell },
            ] as const
          ).map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'text-small flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                tab === key
                  ? 'bg-forge-orange/10 text-forge-orange'
                  : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary',
              )}
            >
              <TabIcon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {tab === 'profile' && <ProfileSection />}
          {tab === 'workspace' && <WorkspaceSection />}
          {tab === 'notifications' && <NotificationsSection />}
        </div>
      </div>
    </div>
  )
}

function ProfileSection() {
  const t = useT()
  const { setLocale: setAppLocale } = useLocale()
  const profile = trpc.settings.profile.useQuery()
  const updateProfile = trpc.settings.updateProfile.useMutation({
    onSuccess: () => profile.refetch(),
  })

  const [name, setName] = useState('')
  const [locale, setLocale] = useState('zh-CN')
  const [region, setRegion] = useState('cn')
  const [initialized, setInitialized] = useState(false)

  if (profile.data && !initialized) {
    setName(((profile.data as Record<string, unknown>).name as string) ?? '')
    setLocale(((profile.data as Record<string, unknown>).locale as string) ?? 'zh-CN')
    setRegion(((profile.data as Record<string, unknown>).region as string) ?? 'cn')
    setInitialized(true)
  }

  const save = async () => {
    await updateProfile.mutateAsync({
      name,
      locale: locale as 'zh-CN' | 'zh-HK' | 'zh-TW' | 'en',
      region: region as 'cn' | 'global',
    })
    setAppLocale(normalizeLocale(locale))
  }

  return (
    <div className="space-y-6">
      <SectionCard title={t.settings.profile.personalInfo}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label={t.settings.profile.displayName}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.settings.profile.namePlaceholder}
            />
          </FieldGroup>
          <FieldGroup label={t.settings.profile.email}>
            <Input
              value={((profile.data as Record<string, unknown>)?.email as string) ?? ''}
              disabled
              className="opacity-60"
            />
          </FieldGroup>
          <FieldGroup label={t.settings.profile.language}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="border-border-strong bg-bg-elevated text-text-primary h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="zh-CN">简体中文</option>
              <option value="zh-HK">繁體中文（香港）</option>
              <option value="zh-TW">繁體中文（台灣）</option>
              <option value="en">English</option>
            </select>
          </FieldGroup>
          <FieldGroup label={t.settings.profile.region}>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="border-border-strong bg-bg-elevated text-text-primary h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="cn">{t.settings.profile.regionCn}</option>
              <option value="global">{t.settings.profile.regionGlobal}</option>
            </select>
          </FieldGroup>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? t.settings.profile.saving : t.settings.profile.saveChanges}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title={t.settings.profile.account}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-small text-text-primary">{t.settings.profile.currentPlan}</p>
            <p className="text-caption text-text-muted mt-0.5 font-mono capitalize">
              {((profile.data as Record<string, unknown>)?.plan as string) ?? 'free'}
            </p>
          </div>
          <Badge tone="success" dot>
            {t.settings.profile.active}
          </Badge>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-small text-text-primary">{t.settings.profile.memberSince}</p>
            <p className="text-caption text-text-muted mt-0.5 font-mono">
              {profile.data
                ? new Date(
                    (profile.data as Record<string, unknown>).createdAt as string,
                  ).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function WorkspaceSection() {
  const t = useT()
  const workspace = trpc.settings.workspace.useQuery()
  const updateWorkspace = trpc.settings.updateWorkspace.useMutation({
    onSuccess: () => workspace.refetch(),
  })

  const [wsName, setWsName] = useState('')
  const [initialized, setInitialized] = useState(false)

  if (workspace.data && !initialized) {
    setWsName(((workspace.data as Record<string, unknown>).workspaceName as string) ?? '')
    setInitialized(true)
  }

  return (
    <div className="space-y-6">
      <SectionCard title={t.settings.workspace.title}>
        <FieldGroup label={t.settings.workspace.workspaceName}>
          <Input value={wsName} onChange={(e) => setWsName(e.target.value)} />
        </FieldGroup>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => updateWorkspace.mutateAsync({ workspaceName: wsName })}
            disabled={updateWorkspace.isPending}
          >
            {updateWorkspace.isPending ? t.settings.workspace.saving : t.settings.workspace.save}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title={t.settings.workspace.apiKeys}>
        <div className="border-border-strong bg-bg-deep text-text-muted flex flex-col items-center gap-2 rounded-lg border border-dashed py-8">
          <Icon.Key size={24} />
          <p className="text-small">{t.settings.workspace.apiKeysComingSoon}</p>
          <Badge tone="outline">{t.settings.workspace.comingSoon}</Badge>
        </div>
      </SectionCard>
    </div>
  )
}

function NotificationsSection() {
  const t = useT()
  const notifs = trpc.settings.notifications.useQuery()
  const updateNotifs = trpc.settings.updateNotifications.useMutation({
    onSuccess: () => notifs.refetch(),
  })

  const data = notifs.data ?? {
    emailOrders: true,
    emailMarketing: false,
    emailSecurity: true,
    pushEnabled: false,
  }

  const toggle = (key: string, value: boolean) => {
    updateNotifs.mutate({ [key]: value } as Record<string, boolean>)
  }

  return (
    <SectionCard title={t.settings.notifications.title}>
      <div className="space-y-3">
        {[
          {
            key: 'emailOrders',
            label: t.settings.notifications.emailOrders,
            desc: t.settings.notifications.emailOrdersDesc,
          },
          {
            key: 'emailMarketing',
            label: t.settings.notifications.emailMarketing,
            desc: t.settings.notifications.emailMarketingDesc,
          },
          {
            key: 'emailSecurity',
            label: t.settings.notifications.emailSecurity,
            desc: t.settings.notifications.emailSecurityDesc,
          },
          {
            key: 'pushEnabled',
            label: t.settings.notifications.pushEnabled,
            desc: t.settings.notifications.pushEnabledDesc,
          },
        ].map(({ key, label, desc }) => (
          <div
            key={key}
            className="border-border-subtle bg-bg-deep flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div>
              <p className="text-small text-text-primary">{label}</p>
              <p className="text-caption text-text-muted">{desc}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key, !(data as Record<string, boolean>)[key])}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (data as Record<string, boolean>)[key] ? 'bg-forge-orange' : 'bg-bg-elevated',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                  (data as Record<string, boolean>)[key] ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-border-subtle bg-bg-surface rounded-lg border p-5">
      <h3 className="font-heading text-h3 text-text-primary mb-4">{title}</h3>
      {children}
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-caption text-text-muted mb-1.5 block font-mono uppercase tracking-[0.08em]">
        {label}
      </label>
      {children}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

import { Badge, SectionCard, SuperButton } from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import {
  formatRelative,
  MOCK_NOW_UTC_MS,
  type ApiKeyRow,
  type FeatureFlagRow,
  type PlatformSettings,
} from '@/lib/super'
import { trpc } from '@/lib/trpc'

type TabId = 'general' | 'flags' | 'keys' | 'icp' | 'legal'

export function SettingsClient({ settings }: { settings: PlatformSettings }) {
  const t = useT()
  const [tab, setTab] = useState<TabId>('general')
  const [values, setValues] = useState(settings)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: t.super.settings.general },
    { id: 'flags', label: t.super.settings.featureFlags },
    { id: 'keys', label: t.super.settings.apiKeys },
    { id: 'icp', label: t.super.settings.icp },
    { id: 'legal', label: t.super.settings.legal },
  ]

  return (
    <div className="flex flex-col gap-4">
      <nav className="border-border-subtle flex flex-wrap gap-1 border-b">
        {tabs.map((tb) => {
          const active = tab === tb.id
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={
                'text-caption border-b-2 px-3 py-2 font-mono uppercase tracking-[0.18em] transition-colors ' +
                (active
                  ? 'border-forge-orange text-forge-amber'
                  : 'text-text-muted hover:text-text-primary border-transparent')
              }
            >
              {tb.label}
            </button>
          )
        })}
      </nav>

      {tab === 'general' && <GeneralTab values={values} setValues={setValues} />}
      {tab === 'flags' && <FlagsTab flags={values.featureFlags} />}
      {tab === 'keys' && <ApiKeysTab keys={values.apiKeys} />}
      {tab === 'icp' && <IcpTab icp={values.icp} />}
      {tab === 'legal' && <LegalTab legal={values.legal} />}
    </div>
  )
}

function GeneralTab({
  values,
  setValues,
}: {
  values: PlatformSettings
  setValues: (v: PlatformSettings) => void
}) {
  const t = useT()
  const updateMutation = trpc.super.settings.updateGeneral.useMutation()
  const [toast, setToast] = useState<string | null>(null)

  const onSave = async (): Promise<void> => {
    try {
      await updateMutation.mutateAsync({
        platformName: values.platformName,
        platformDomain: values.platformDomain,
        defaultLocale: values.defaultLocale,
        defaultRegion: values.defaultRegion,
        maintenanceMode: values.maintenanceMode,
        signupEnabled: values.signupEnabled,
      })
      setToast(t.super.common.succeeded)
      setTimeout(() => setToast(null), 2400)
    } catch (err) {
      setToast(`✗ ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <SectionCard
      title={t.super.settings.general}
      action={
        <SuperButton
          size="sm"
          variant="primary"
          disabled={updateMutation.isLoading}
          onClick={() => void onSave()}
        >
          {updateMutation.isLoading ? '...' : t.super.common.save}
        </SuperButton>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t.super.settings.platformName}>
          <input
            className="border-border-subtle bg-bg-deep text-small text-text-primary focus:border-forge-ember w-full border px-3 py-1.5 font-mono focus:outline-none"
            value={values.platformName}
            onChange={(e) => setValues({ ...values, platformName: e.target.value })}
          />
        </Field>
        <Field label={t.super.settings.platformDomain}>
          <input
            className="border-border-subtle bg-bg-deep text-small text-text-primary focus:border-forge-ember w-full border px-3 py-1.5 font-mono focus:outline-none"
            value={values.platformDomain}
            onChange={(e) => setValues({ ...values, platformDomain: e.target.value })}
          />
        </Field>
        <Field label={t.super.settings.defaultLocale}>
          <select
            className="border-border-subtle bg-bg-deep text-small text-text-primary focus:border-forge-ember w-full border px-3 py-1.5 font-mono focus:outline-none"
            value={values.defaultLocale}
            onChange={(e) =>
              setValues({ ...values, defaultLocale: e.target.value as 'zh-CN' | 'en' })
            }
          >
            <option value="zh-CN">zh-CN</option>
            <option value="en">en</option>
          </select>
        </Field>
        <Field label={t.super.settings.defaultRegion}>
          <select
            className="border-border-subtle bg-bg-deep text-small text-text-primary focus:border-forge-ember w-full border px-3 py-1.5 font-mono focus:outline-none"
            value={values.defaultRegion}
            onChange={(e) =>
              setValues({ ...values, defaultRegion: e.target.value as 'cn' | 'global' })
            }
          >
            <option value="cn">cn</option>
            <option value="global">global</option>
          </select>
        </Field>
      </div>

      <div className="border-border-subtle mt-6 border-t pt-5">
        <Toggle
          title={t.super.settings.maintenanceMode}
          description={t.super.settings.maintenanceDesc}
          enabled={values.maintenanceMode}
          onChange={(on) => setValues({ ...values, maintenanceMode: on })}
          dangerous
        />
        <Toggle
          title={t.super.settings.signupEnabled}
          description={t.super.settings.signupDesc}
          enabled={values.signupEnabled}
          onChange={(on) => setValues({ ...values, signupEnabled: on })}
        />
      </div>

      {toast ? (
        <div className="border-success/40 bg-success/10 text-caption text-success mt-4 border px-3 py-2 font-mono">
          {toast}
        </div>
      ) : null}
    </SectionCard>
  )
}

function FlagsTab({ flags }: { flags: FeatureFlagRow[] }) {
  const t = useT()
  const serverQuery = trpc.super.settings.get.useQuery(undefined, { staleTime: 30_000 })
  const toggleMutation = trpc.super.settings.toggleFlag.useMutation()
  const [local, setLocal] = useState(flags)

  useEffect(() => {
    // Merge server state if it arrives / differs from seed.
    if (serverQuery.data?.flags && serverQuery.data.flags.length > 0) {
      setLocal(
        flags.map((seed) => {
          const persisted = serverQuery.data.flags.find((p) => p.id === seed.id)
          return persisted ? { ...seed, enabled: persisted.enabled } : seed
        }),
      )
    }
  }, [serverQuery.data?.flags, flags])

  const flip = async (id: FeatureFlagRow['id'], on: boolean): Promise<void> => {
    setLocal(local.map((l) => (l.id === id ? { ...l, enabled: on } : l)))
    try {
      await toggleMutation.mutateAsync({ id, enabled: on })
      void serverQuery.refetch()
    } catch {
      // Roll back on failure.
      setLocal(local.map((l) => (l.id === id ? { ...l, enabled: !on } : l)))
    }
  }

  return (
    <SectionCard title={t.super.settings.featureFlags}>
      <div className="divide-border-subtle divide-y">
        {local.map((f) => (
          <Toggle
            key={f.id}
            title={t.super.settings.feature[f.id]}
            description={
              t.super.settings.feature[`${f.id}Desc` as keyof typeof t.super.settings.feature]
            }
            enabled={f.enabled}
            onChange={(on) => void flip(f.id, on)}
            warning={f.requiresCredential && f.enabled}
          />
        ))}
      </div>
    </SectionCard>
  )
}

type LiveKey = ApiKeyRow & { label: string }

function ApiKeysTab({ keys: seedKeys }: { keys: ApiKeyRow[] }) {
  const t = useT()

  // Merge the static mock catalogue with whatever persisted state the
  // backend has. Preference order: live server → seed mock.
  const serverQuery = trpc.super.settings.get.useQuery(undefined, { staleTime: 30_000 })
  const [editing, setEditing] = useState<LiveKey | null>(null)

  const live: LiveKey[] = seedKeys.map((k) => {
    const persisted = serverQuery.data?.secrets.find((s) => s.envVar === k.envVar)
    return {
      ...k,
      label: t.super.settings.apiKey[k.id] ?? k.id,
      configured: persisted?.configured ?? k.configured,
      maskedPreview: persisted?.maskedPreview ?? k.maskedPreview,
      rotatedAt:
        persisted?.rotatedAt != null ? new Date(persisted.rotatedAt).getTime() : k.rotatedAt,
    }
  })

  return (
    <SectionCard title={t.super.settings.apiKeys}>
      <div className="divide-border-subtle divide-y">
        {live.map((k) => (
          <div
            key={k.id}
            className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[200px_minmax(0,1fr)_160px_180px]"
          >
            <div>
              <div className="text-small text-text-primary">{k.label}</div>
              <div className="text-caption text-text-muted font-mono">{k.envVar}</div>
            </div>
            <div className="flex items-center gap-2">
              {k.configured ? (
                <>
                  <Badge tone="success">{t.super.settings.apiKeyMaskedPrefix}</Badge>
                  <span className="text-caption text-text-secondary font-mono">
                    {k.maskedPreview ?? '••••'}
                  </span>
                </>
              ) : (
                <Badge tone="warning">{t.super.settings.apiKeyNotConfigured}</Badge>
              )}
            </div>
            <div className="text-caption text-text-muted">
              {k.rotatedAt ? formatRelative(k.rotatedAt, MOCK_NOW_UTC_MS) : '—'}
            </div>
            <div className="flex gap-2">
              <SuperButton size="sm" variant="primary" onClick={() => setEditing(k)}>
                {k.configured ? t.super.settings.apiKeyRotate : t.super.common.create}
              </SuperButton>
              <SuperButton
                size="sm"
                variant="ghost"
                disabled={!k.configured}
                onClick={() => setEditing({ ...k, configured: true })}
              >
                {t.super.settings.apiKeyView}
              </SuperButton>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <SecretEditor
          secret={editing}
          onClose={() => setEditing(null)}
          onRotated={() => {
            void serverQuery.refetch()
            setEditing(null)
          }}
        />
      ) : null}
    </SectionCard>
  )
}

function IcpTab({ icp }: { icp: PlatformSettings['icp'] }) {
  const t = useT()
  const statusTone: Record<typeof icp.status, 'success' | 'warning' | 'error'> = {
    approved: 'success',
    pending: 'warning',
    expired: 'error',
  }
  const statusLabel: Record<typeof icp.status, string> = {
    approved: t.super.settings.icpStatusApproved,
    pending: t.super.settings.icpStatusPending,
    expired: t.super.settings.icpStatusExpired,
  }
  return (
    <SectionCard title={t.super.settings.icpTitle}>
      <dl className="text-small grid grid-cols-1 gap-4 md:grid-cols-2">
        <Row label={t.super.settings.icpRecord} value={icp.record} mono />
        <Row label={t.super.settings.icpHolder} value={icp.holder} />
        <Row label={t.super.settings.icpDomain} value={icp.domain} mono />
        <Row
          label={t.super.settings.icpSubmittedAt}
          value={formatRelative(icp.submittedAt, MOCK_NOW_UTC_MS)}
        />
      </dl>
      <div className="border-border-subtle mt-4 border-t pt-4">
        <Badge tone={statusTone[icp.status]}>{statusLabel[icp.status]}</Badge>
      </div>
    </SectionCard>
  )
}

function LegalTab({ legal }: { legal: PlatformSettings['legal'] }) {
  const t = useT()
  const entries = [
    { id: 'tos', title: t.super.settings.tosTitle, updatedAt: legal.tosUpdatedAt },
    { id: 'privacy', title: t.super.settings.privacyTitle, updatedAt: legal.privacyUpdatedAt },
    { id: 'cookie', title: t.super.settings.cookieTitle, updatedAt: legal.cookieUpdatedAt },
  ]
  return (
    <SectionCard title={t.super.settings.legalTitle}>
      <div className="divide-border-subtle divide-y">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <div className="text-small text-text-primary">{e.title}</div>
              <div className="text-caption text-text-muted font-mono">
                {t.super.settings.lastEdited}：{formatRelative(e.updatedAt, MOCK_NOW_UTC_MS)}
              </div>
            </div>
            <SuperButton size="sm" variant="primary">
              {t.super.settings.edit}
            </SuperButton>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-caption text-text-muted font-mono uppercase tracking-[0.16em]">
        {label}
      </span>
      {children}
    </label>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-caption text-text-muted font-mono uppercase tracking-[0.16em]">
        {label}
      </dt>
      <dd
        className={mono ? 'text-small text-text-primary font-mono' : 'text-small text-text-primary'}
      >
        {value}
      </dd>
    </div>
  )
}

function Toggle({
  title,
  description,
  enabled,
  onChange,
  dangerous = false,
  warning = false,
}: {
  title: string
  description?: string
  enabled: boolean
  onChange: (on: boolean) => void
  dangerous?: boolean
  warning?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div
          className={'text-small ' + (dangerous && enabled ? 'text-error' : 'text-text-primary')}
        >
          {title}
        </div>
        {description ? <p className="text-caption text-text-muted mt-0.5">{description}</p> : null}
        {warning ? (
          <p className="text-caption text-warning mt-1 font-mono">
            需要 .env 配置对应凭据 · requires credentials
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={
          'relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors ' +
          (enabled
            ? dangerous
              ? 'border-error/60 bg-error/25'
              : 'border-forge-ember bg-forge-orange/25'
            : 'border-border-strong bg-bg-deep')
        }
      >
        <span
          className={
            'inline-block h-4 w-4 transform transition-transform ' +
            (enabled
              ? dangerous
                ? 'bg-error translate-x-6'
                : 'bg-forge-amber translate-x-6'
              : 'bg-text-muted translate-x-0.5')
          }
        />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Secret editor dialog — the "fill in / rotate API key" UI.
// ─────────────────────────────────────────────────────────────────────────

interface SecretEditorProps {
  secret: LiveKey
  onClose: () => void
  onRotated: () => void
}

function SecretEditor({ secret, onClose, onRotated }: SecretEditorProps) {
  const t = useT()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const rotate = trpc.super.settings.rotateSecret.useMutation()

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  const save = async (): Promise<void> => {
    setError(null)
    if (value.trim().length < 8) {
      setError('密钥太短（至少 8 个字符）。Stripe / DeepSeek / Qwen 等通常是 32 字符以上。')
      return
    }
    try {
      await rotate.mutateAsync({
        envVar: secret.envVar,
        label: secret.label,
        plaintext: value.trim(),
      })
      onRotated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="border-forge-ember bg-bg-deep w-full max-w-lg border p-5 shadow-xl">
        <header className="border-border-subtle mb-4 flex items-start justify-between gap-3 border-b pb-3">
          <div>
            <div className="text-caption text-text-muted font-mono uppercase tracking-[0.22em]">
              {t.super.settings.apiKeys}
            </div>
            <h2 className="font-display text-h3 text-text-primary">{secret.label}</h2>
            <div className="text-caption text-text-muted mt-0.5 font-mono">{secret.envVar}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-caption text-text-muted hover:text-text-primary font-mono"
            aria-label={t.super.common.close}
          >
            ✕
          </button>
        </header>

        {secret.configured ? (
          <div className="border-border-subtle bg-bg-surface text-caption mb-4 border px-3 py-2 font-mono">
            <div className="text-text-muted">当前预览 / current preview</div>
            <div className="text-text-primary mt-1">{secret.maskedPreview ?? '••••'}</div>
            {secret.rotatedAt ? (
              <div className="text-text-muted mt-1">
                最近轮换 · {formatRelative(secret.rotatedAt, MOCK_NOW_UTC_MS)}
              </div>
            ) : null}
          </div>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
            {secret.configured ? '新密钥 · new key' : '粘贴密钥 · paste key'}
          </span>
          <textarea
            className="border-border-subtle bg-bg-deep text-small text-text-primary placeholder:text-text-subtle focus:border-forge-ember h-24 w-full resize-none border px-3 py-2 font-mono focus:outline-none"
            placeholder={placeholderFor(secret.id)}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            spellCheck={false}
          />
        </label>

        {error ? (
          <div className="border-error/40 bg-error/10 text-caption text-error mt-2 border px-3 py-2 font-mono">
            {error}
          </div>
        ) : null}

        <div className="border-warning/30 bg-warning/5 text-caption text-warning mt-4 rounded border px-3 py-2">
          <strong className="text-text-primary">注意</strong>
          ：密钥写入后会被掩码存储到平台数据库，并记入审计日志。 实际运行时生效仍需你在生产{' '}
          <span className="font-mono">.env</span> 把{' '}
          <span className="font-mono">{secret.envVar}=...</span> 填上并重启服务。
        </div>

        <div className="border-border-subtle mt-5 flex items-center justify-end gap-2 border-t pt-4">
          <SuperButton size="sm" variant="ghost" onClick={onClose}>
            {t.super.common.cancel}
          </SuperButton>
          <SuperButton
            size="sm"
            variant="primary"
            disabled={rotate.isLoading || value.trim().length < 8}
            onClick={() => void save()}
          >
            {rotate.isLoading
              ? (t.common?.loading ?? 'Saving…')
              : secret.configured
                ? t.super.settings.apiKeyRotate
                : t.super.common.save}
          </SuperButton>
        </div>
      </div>
    </div>
  )
}

function placeholderFor(id: string): string {
  switch (id) {
    case 'deepseek':
      return 'sk-... (DeepSeek 平台 → API keys)'
    case 'qwen':
      return 'sk-... (阿里云百炼 DashScope)'
    case 'anthropic':
      return 'sk-ant-api03-...'
    case 'stripe':
      return 'sk_live_... 或 sk_test_...'
    case 'wechatpay':
      return '1234567890 (商户号 MCH_ID)'
    case 'alipay':
      return '2021xxxxxxxx (AppID)'
    case 'aliyunSms':
      return 'LTAI... (AccessKey ID)'
    case 'cloudflare':
      return 'cf-...'
    case 'sentry':
      return 'sntrys_...'
    case 'posthog':
      return 'phc_...'
    default:
      return 'your-secret-here'
  }
}

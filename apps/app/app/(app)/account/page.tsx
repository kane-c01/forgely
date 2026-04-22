'use client'

import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icons'
import { useLocale, normalizeLocale } from '@/lib/i18n'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/cn'

type Tab = 'profile' | 'email' | 'password' | '2fa' | 'sessions' | 'connections' | 'danger'

const TABS: Array<{ key: Tab; label: string; icon: keyof typeof Icon }> = [
  { key: 'profile', label: 'Profile', icon: 'User' },
  { key: 'email', label: 'Email', icon: 'Mail' },
  { key: 'password', label: 'Password', icon: 'Lock' },
  { key: '2fa', label: 'Two-factor', icon: 'Shield' },
  { key: 'sessions', label: 'Sessions', icon: 'Monitor' },
  { key: 'connections', label: 'Connected', icon: 'Link' },
  { key: 'danger', label: 'Danger zone', icon: 'AlertTriangle' },
]

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Personal account"
        description="Manage how you sign in, secure your account and stay on top of activity."
      />

      <div className="flex gap-6">
        <nav className="w-52 shrink-0 space-y-1">
          {TABS.map(({ key, label, icon }) => {
            const TabIcon = Icon[icon]
            return (
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
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === 'profile' && <ProfileSection />}
          {tab === 'email' && <EmailSection />}
          {tab === 'password' && <PasswordSection />}
          {tab === '2fa' && <TwoFactorSection />}
          {tab === 'sessions' && <SessionsSection />}
          {tab === 'connections' && <ConnectionsSection />}
          {tab === 'danger' && <DangerSection />}
        </div>
      </div>
    </div>
  )
}

// ─── Section card ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className="border-border-subtle bg-bg-surface rounded-lg border">
      <header className="border-border-subtle border-b px-5 py-4">
        <h3 className="font-heading text-h3 text-text-primary">{title}</h3>
        {description ? <p className="text-small text-text-secondary mt-1">{description}</p> : null}
      </header>
      <div className="p-5">{children}</div>
      {footer ? (
        <footer className="border-border-subtle bg-bg-deep/40 border-t px-5 py-3">{footer}</footer>
      ) : null}
    </section>
  )
}

function MutationStatus({
  isPending,
  isSuccess,
  errorMessage,
  successLabel = 'Saved',
}: {
  isPending: boolean
  isSuccess: boolean
  errorMessage?: string | null
  successLabel?: string
}) {
  if (errorMessage) {
    return <span className="text-caption text-error">{errorMessage}</span>
  }
  if (isPending) {
    return <span className="text-caption text-text-muted">Saving…</span>
  }
  if (isSuccess) {
    return <span className="text-caption text-success">{successLabel}</span>
  }
  return null
}

// ─── Profile ─────────────────────────────────────────────────────────────────

function ProfileSection() {
  const { setLocale: setAppLocale } = useLocale()
  const profile = trpc.settings.profile.useQuery()
  const updateProfile = trpc.settings.updateProfile.useMutation({
    onSuccess: () => profile.refetch(),
  })

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [locale, setLocale] = useState<'zh-CN' | 'zh-HK' | 'zh-TW' | 'en'>('zh-CN')
  const [region, setRegion] = useState<'cn' | 'global'>('cn')
  const [primed, setPrimed] = useState(false)

  if (profile.data && !primed) {
    setName((profile.data.name as string) ?? '')
    setAvatarUrl((profile.data.avatarUrl as string) ?? '')
    setLocale(((profile.data.locale as string) ?? 'zh-CN') as typeof locale)
    setRegion(((profile.data.region as string) ?? 'cn') as typeof region)
    setPrimed(true)
  }

  const initials = useMemo(() => {
    const source = name || (profile.data?.email as string) || '?'
    return source.slice(0, 2).toUpperCase()
  }, [name, profile.data])

  const dirty =
    primed &&
    profile.data &&
    (name !== ((profile.data.name as string) ?? '') ||
      avatarUrl !== ((profile.data.avatarUrl as string) ?? '') ||
      locale !== ((profile.data.locale as string) ?? 'zh-CN') ||
      region !== ((profile.data.region as string) ?? 'cn'))

  const save = () => {
    updateProfile.mutate({ name, avatarUrl: avatarUrl || null, locale, region })
    setAppLocale(normalizeLocale(locale))
  }

  return (
    <SectionCard
      title="Profile"
      description="How you appear across Forgely. Avatar accepts any HTTPS image URL."
      footer={
        <div className="flex items-center justify-between gap-3">
          <MutationStatus
            isPending={updateProfile.isPending}
            isSuccess={updateProfile.isSuccess}
            errorMessage={updateProfile.error?.message}
          />
          <Button onClick={save} disabled={!dirty || updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="border-border-strong bg-bg-deep grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-h3 text-forge-amber">{initials}</span>
            )}
          </span>
          <div className="flex-1">
            <p className="font-heading text-small text-text-primary">{name || 'Unnamed'}</p>
            <p className="text-caption text-text-muted font-mono">
              {(profile.data?.email as string) ?? '…'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Avatar URL" hint="HTTPS image — leave blank for the initials avatar.">
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Language">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              className="border-border-strong bg-bg-deep text-text-primary h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="zh-CN">简体中文</option>
              <option value="zh-HK">繁體中文（香港）</option>
              <option value="zh-TW">繁體中文（台灣）</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Region" hint="Drives default LLM provider, payment channels and currency.">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as typeof region)}
              className="border-border-strong bg-bg-deep text-text-primary h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="cn">China — 国内站</option>
              <option value="global">Global — 海外站</option>
            </select>
          </Field>
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Email ───────────────────────────────────────────────────────────────────

function EmailSection() {
  const profile = trpc.settings.profile.useQuery()
  const resend = trpc.auth.resendEmailVerification.useMutation()

  const email = (profile.data?.email as string) ?? ''
  const verifiedAt = profile.data?.emailVerifiedAt as Date | null | undefined

  return (
    <SectionCard
      title="Email"
      description="Email is your primary login. Changing it requires re-verification (coming soon)."
    >
      <div className="flex flex-col gap-4">
        <Field label="Current email">
          <Input value={email} disabled className="opacity-70" />
        </Field>

        <div className="border-border-subtle bg-bg-deep flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
          <div className="flex items-center gap-3">
            <span className="border-border-subtle bg-bg-surface grid h-9 w-9 place-items-center rounded-full border">
              <Icon.Shield size={16} className={verifiedAt ? 'text-success' : 'text-warning'} />
            </span>
            <div>
              <p className="text-small text-text-primary">Verification status</p>
              <p className="text-caption text-text-muted">
                {verifiedAt
                  ? `Verified on ${new Date(verifiedAt).toLocaleDateString()}`
                  : 'Not verified — check your inbox or resend the link.'}
              </p>
            </div>
          </div>
          {verifiedAt ? (
            <Badge tone="success" dot>
              verified
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => resend.mutate()}
              disabled={resend.isPending}
            >
              {resend.isPending ? 'Sending…' : 'Resend link'}
            </Button>
          )}
        </div>

        {resend.isSuccess && (
          <p className="text-caption text-success">Verification email sent. Check your inbox.</p>
        )}
        {resend.error && <p className="text-caption text-error">{resend.error.message}</p>}
      </div>
    </SectionCard>
  )
}

// ─── Password ────────────────────────────────────────────────────────────────

function PasswordSection() {
  const change = trpc.auth.changePassword.useMutation()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)

  const ready = currentPw.length >= 1 && newPw.length >= 10 && newPw === confirm
  const submit = async () => {
    if (!ready) return
    await change.mutateAsync({ currentPassword: currentPw, newPassword: newPw })
    setCurrentPw('')
    setNewPw('')
    setConfirm('')
  }

  return (
    <SectionCard
      title="Password"
      description="Use 10+ characters with at least one letter and one number. Changing your password signs you out from every other device."
      footer={
        <div className="flex items-center justify-between gap-3">
          <MutationStatus
            isPending={change.isPending}
            isSuccess={change.isSuccess}
            errorMessage={change.error?.message}
            successLabel="Password updated · other sessions revoked"
          />
          <Button onClick={submit} disabled={!ready || change.isPending}>
            {change.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Current password">
          <Input
            type={show ? 'text' : 'password'}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="New password">
            <Input
              type={show ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="text-caption text-text-muted hover:text-text-primary inline-flex items-center gap-1"
          >
            {show ? <Icon.EyeOff size={12} /> : <Icon.Eye size={12} />}
            {show ? 'Hide passwords' : 'Show passwords'}
          </button>
          {newPw && newPw.length < 10 && (
            <span className="text-caption text-warning">At least 10 characters.</span>
          )}
          {confirm && newPw !== confirm && (
            <span className="text-caption text-error">Passwords don&apos;t match.</span>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

// ─── 2FA ─────────────────────────────────────────────────────────────────────

function TwoFactorSection() {
  const profile = trpc.settings.profile.useQuery()
  const utils = trpc.useUtils()
  const begin = trpc.auth.beginTotpEnrollment.useMutation()
  const confirm = trpc.auth.confirmTotpEnrollment.useMutation({
    onSuccess: () => {
      utils.settings.profile.invalidate()
      setStep('idle')
      setEnrollData(null)
      setCode('')
    },
  })
  const disable = trpc.auth.disableTotp.useMutation({
    onSuccess: () => utils.settings.profile.invalidate(),
  })

  const enabled = !!profile.data?.totpEnabledAt
  const [step, setStep] = useState<'idle' | 'enroll' | 'disable'>('idle')
  const [enrollData, setEnrollData] = useState<{ otpauthUrl: string; secret: string } | null>(null)
  const [code, setCode] = useState('')

  const startEnroll = async () => {
    const result = await begin.mutateAsync()
    setEnrollData(result as { otpauthUrl: string; secret: string })
    setStep('enroll')
    setCode('')
  }

  return (
    <SectionCard
      title="Two-factor authentication"
      description="Add a TOTP authenticator (1Password / Google Authenticator / Authy) for an extra step at sign-in."
    >
      <div className="flex flex-col gap-4">
        <div className="border-border-subtle bg-bg-deep flex items-center justify-between rounded-md border p-4">
          <div className="flex items-center gap-3">
            <span className="border-border-subtle bg-bg-surface grid h-9 w-9 place-items-center rounded-full border">
              <Icon.Shield size={16} className={enabled ? 'text-success' : 'text-text-muted'} />
            </span>
            <div>
              <p className="text-small text-text-primary">
                {enabled ? '2FA is enabled' : '2FA is not enabled'}
              </p>
              <p className="text-caption text-text-muted">
                {enabled && profile.data?.totpEnabledAt
                  ? `Enrolled on ${new Date(profile.data.totpEnabledAt as unknown as string).toLocaleDateString()}.`
                  : 'Adds a second factor to every login attempt.'}
              </p>
            </div>
          </div>
          {enabled ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setStep('disable')}
              disabled={disable.isPending}
            >
              Disable
            </Button>
          ) : (
            <Button size="sm" onClick={startEnroll} disabled={begin.isPending}>
              {begin.isPending ? 'Generating…' : 'Enable'}
            </Button>
          )}
        </div>

        {step === 'enroll' && enrollData && (
          <div className="border-border-subtle bg-bg-deep space-y-3 rounded-md border p-4">
            <p className="text-small text-text-primary">
              1. Scan this URL in your authenticator app, or paste the secret manually.
            </p>
            <code className="bg-bg-surface text-caption text-text-secondary block break-all rounded p-2 font-mono">
              {enrollData.otpauthUrl}
            </code>
            <p className="text-caption text-text-muted">
              Manual secret: <code className="text-text-primary">{enrollData.secret}</code>
            </p>
            <p className="text-small text-text-primary">2. Enter the 6-digit code:</p>
            <div className="flex items-center gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                className="w-32 font-mono tracking-widest"
              />
              <Button
                size="sm"
                onClick={() => confirm.mutate({ code })}
                disabled={code.length !== 6 || confirm.isPending}
              >
                {confirm.isPending ? 'Verifying…' : 'Confirm'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStep('idle')
                  setEnrollData(null)
                }}
              >
                Cancel
              </Button>
            </div>
            {confirm.error && <p className="text-caption text-error">{confirm.error.message}</p>}
          </div>
        )}

        {step === 'disable' && (
          <div className="border-warning/40 bg-warning/5 space-y-3 rounded-md border p-4">
            <p className="text-small text-text-primary">
              Enter your current 6-digit code to disable 2FA.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                className="w-32 font-mono tracking-widest"
              />
              <Button
                size="sm"
                variant="danger"
                onClick={() => disable.mutate({ code })}
                disabled={code.length !== 6 || disable.isPending}
              >
                {disable.isPending ? 'Disabling…' : 'Disable 2FA'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStep('idle')}>
                Cancel
              </Button>
            </div>
            {disable.error && <p className="text-caption text-error">{disable.error.message}</p>}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

// ─── Sessions ────────────────────────────────────────────────────────────────

function deviceLabel(userAgent?: string | null): { os: string; browser: string } {
  if (!userAgent) return { os: 'Unknown device', browser: 'Unknown browser' }
  const os = /Mac OS X/.test(userAgent)
    ? 'macOS'
    : /Windows NT/.test(userAgent)
      ? 'Windows'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown'
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser'
  return { os, browser }
}

function SessionsSection() {
  const sessions = trpc.auth.listSessions.useQuery()
  const revoke = trpc.auth.revokeSession.useMutation({
    onSuccess: () => sessions.refetch(),
  })
  const signoutAll = trpc.auth.signoutAll.useMutation({
    onSuccess: () => sessions.refetch(),
  })

  const rows = sessions.data ?? []

  return (
    <SectionCard
      title="Active sessions"
      description="Sessions persist across browsers. Revoke any you don't recognise immediately."
      footer={
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-muted">
            {rows.length} active session{rows.length === 1 ? '' : 's'}
          </span>
          <Button
            size="sm"
            variant="danger"
            disabled={signoutAll.isPending || rows.length <= 1}
            onClick={() => signoutAll.mutate()}
          >
            <Icon.LogOut size={14} />
            {signoutAll.isPending ? 'Revoking…' : 'Sign out everywhere'}
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {rows.length === 0 && !sessions.isLoading && (
          <p className="text-small text-text-muted">No active sessions.</p>
        )}
        {rows.map((s) => {
          const row = s as Record<string, unknown>
          const { os, browser } = deviceLabel(row.userAgent as string | null)
          const lastSeen = row.lastSeenAt ? new Date(row.lastSeenAt as string) : null
          return (
            <div
              key={row.id as string}
              className="border-border-subtle bg-bg-deep flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="border-border-subtle bg-bg-surface text-text-muted grid h-9 w-9 place-items-center rounded-full border">
                  <Icon.Monitor size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-small text-text-primary truncate">
                    {browser} on {os}
                  </p>
                  <p className="text-caption text-text-muted font-mono">
                    {(row.ipAddress as string) ?? '—'} ·{' '}
                    {lastSeen ? `last seen ${lastSeen.toLocaleString()}` : 'no activity recorded'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => revoke.mutate({ sessionId: row.id as string })}
                disabled={revoke.isPending}
              >
                Revoke
              </Button>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ─── Connections ─────────────────────────────────────────────────────────────

function ConnectionsSection() {
  const profile = trpc.settings.profile.useQuery()

  const items = [
    {
      key: 'wechat',
      label: '微信',
      description: 'WeChat OAuth — scan-to-login on the desktop app.',
      icon: Icon.User,
      connected: !!profile.data?.wechatUnionId,
    },
    {
      key: 'phone',
      label: 'Phone (中国)',
      description: profile.data?.phoneE164
        ? `Connected to ${profile.data.phoneE164}`
        : 'Add your mobile to receive SMS OTP at sign-in.',
      icon: Icon.Phone,
      connected: !!profile.data?.phoneE164 && !!profile.data?.phoneVerifiedAt,
    },
    {
      key: 'github',
      label: 'GitHub',
      description: 'Sign in with GitHub OAuth.',
      icon: Icon.Globe,
      connected: false,
    },
    {
      key: 'google',
      label: 'Google',
      description: 'Sign in with your Google Workspace account.',
      icon: Icon.Globe,
      connected: false,
    },
  ]

  return (
    <SectionCard
      title="Connected accounts"
      description="Bind external identities to sign in faster. WeChat / phone is required for users in China."
    >
      <div className="space-y-2">
        {items.map((item) => {
          const ItemIcon = item.icon
          return (
            <div
              key={item.key}
              className="border-border-subtle bg-bg-deep flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="border-border-subtle bg-bg-surface text-text-muted grid h-9 w-9 place-items-center rounded-full border">
                  <ItemIcon size={16} />
                </span>
                <div>
                  <p className="text-small text-text-primary">{item.label}</p>
                  <p className="text-caption text-text-muted">{item.description}</p>
                </div>
              </div>
              {item.connected ? (
                <Badge tone="success" dot>
                  connected
                </Badge>
              ) : (
                <Button size="sm" variant="secondary" disabled>
                  Connect
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ─── Danger zone ─────────────────────────────────────────────────────────────

function DangerSection() {
  const signoutAll = trpc.auth.signoutAll.useMutation()
  return (
    <div className="space-y-4">
      <SectionCard
        title="Sign out everywhere"
        description="Useful if a device was lost. You stay signed in on this device."
      >
        <div className="flex items-center justify-between">
          <p className="text-caption text-text-muted">
            Revokes every active session for your account.
          </p>
          <Button
            variant="danger"
            disabled={signoutAll.isPending}
            onClick={() => signoutAll.mutate()}
          >
            {signoutAll.isPending ? 'Revoking…' : 'Sign out all sessions'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Delete account"
        description="Permanently removes your account and every site, generation and asset attached to it. This is irreversible."
      >
        <div className="border-error/30 bg-error/5 flex items-center justify-between gap-3 rounded-md border p-4">
          <div className="flex items-start gap-3">
            <Icon.AlertTriangle size={18} className="text-error mt-0.5 shrink-0" />
            <div>
              <p className="text-small text-text-primary">
                Account deletion will be available after your subscription ends.
              </p>
              <p className="text-caption text-text-muted">
                Cancel your active plan from /billing, then contact support to schedule deletion.
              </p>
            </div>
          </div>
          <Button variant="danger" disabled>
            Request deletion
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

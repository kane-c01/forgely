'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/cn'

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ['1 site', '500 credits/mo', 'Email support'],
  pro: ['5 sites', '2,000 credits/mo', 'Priority support', 'Custom domain'],
  agency: ['Unlimited sites', '10,000 credits/mo', 'Dedicated account manager', 'API access'],
}

type Currency = 'USD' | 'CNY'
type CnChannel = 'wechat' | 'alipay'
type AnyChannel = 'stripe' | CnChannel

interface ChannelInfo {
  stripe: { available: boolean; recommended: boolean; currency: 'USD' }
  wechat: { available: boolean; recommended: boolean; currency: 'CNY' }
  alipay: { available: boolean; recommended: boolean; currency: 'CNY' }
}

const USD_TO_CNY = Number(process.env.NEXT_PUBLIC_USD_TO_CNY_RATE ?? '7')

function formatMoney(cents: number, currency: Currency): string {
  if (currency === 'CNY') {
    return `¥${(cents / 100).toFixed(0)}`
  }
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const usdCentsToCnyCents = (usd: number): number => Math.round(usd * USD_TO_CNY)

export default function BillingPage() {
  const t = useT()
  const [cadence, setCadence] = useState<'monthly' | 'yearly'>('monthly')
  const [currency, setCurrency] = useState<Currency>('CNY')

  const catalog = trpc.billing.catalog.useQuery()
  const subscription = trpc.billing.subscription.useQuery()
  const channels = trpc.billing.channels.useQuery()
  const credits = trpc.credits.balance.useQuery()
  const invoices = trpc.billing.invoices.useQuery({ limit: 10 })

  const portalMutation = trpc.billing.openCustomerPortal.useMutation()

  // ─── Active checkout flow state ────────────────────────────────────
  const [pickerKind, setPickerKind] = useState<'subscription' | 'credit_pack' | null>(null)
  const [pickerSubject, setPickerSubject] = useState<{
    slug: string
    label: string
    priceUsd: number
  } | null>(null)
  const [activeCnPaymentId, setActiveCnPaymentId] = useState<string | null>(null)

  const plans = catalog.data?.plans ?? []
  const packages = catalog.data?.packages ?? []
  const sub = subscription.data
  const balance = credits.data
  const txns = invoices.data ?? []

  const channelInfo = channels.data as ChannelInfo | undefined
  const cnAvailable = !!channelInfo?.wechat.available || !!channelInfo?.alipay.available

  const openPortal = async () => {
    const result = await portalMutation.mutateAsync({ returnUrl: window.location.href })
    if (result && typeof result === 'object' && 'url' in result) {
      window.location.href = result.url as string
    }
  }

  const startSubscription = (
    planSlug: 'starter' | 'pro' | 'agency',
    label: string,
    priceUsd: number,
  ) => {
    setPickerKind('subscription')
    setPickerSubject({ slug: planSlug, label, priceUsd })
  }

  const buyCreditPack = (slug: string, label: string, priceUsd: number) => {
    setPickerKind('credit_pack')
    setPickerSubject({ slug, label, priceUsd })
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow={t.billing.eyebrow}
        title={t.billing.title}
        description={t.billing.description}
        actions={
          sub ? (
            <Button variant="secondary" onClick={openPortal} disabled={portalMutation.isPending}>
              <Icon.Settings size={14} />
              {portalMutation.isPending ? t.billing.opening : t.billing.managePayment}
            </Button>
          ) : null
        }
        meta={<CurrencyToggle value={currency} onChange={setCurrency} cnEnabled={cnAvailable} />}
      />

      {/* Credit Balance */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <BalanceCard label={t.billing.availableCredits} value={balance?.balance ?? 0} accent />
        <BalanceCard label={t.billing.reserved} value={balance?.reserved ?? 0} />
        <BalanceCard label={t.billing.lifetimeEarned} value={balance?.lifetimeEarned ?? 0} />
        <BalanceCard label={t.billing.lifetimeSpent} value={balance?.lifetimeSpent ?? 0} />
      </section>

      {/* Current Plan */}
      {sub && (
        <section className="border-border-subtle bg-bg-surface rounded-lg border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
                {t.billing.currentPlan}
              </p>
              <p className="font-display text-h2 text-text-primary mt-1 capitalize">
                {((sub as Record<string, unknown>).planSlug as string | undefined) ?? 'Free'}
              </p>
            </div>
            <div className="text-right">
              <Badge tone="success" dot>
                {t.billing.active}
              </Badge>
              {Boolean((sub as Record<string, unknown>).currentPeriodEnd) && (
                <p className="text-caption text-text-muted mt-1 font-mono">
                  {t.billing.renews}{' '}
                  {formatDate((sub as Record<string, unknown>).currentPeriodEnd as string)}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Plans */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-h3 text-text-primary">{t.billing.plans}</h2>
          <div className="border-border-subtle bg-bg-deep flex items-center gap-1 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setCadence('monthly')}
              className={cn(
                'text-caption rounded-md px-3 py-1 font-medium transition-colors',
                cadence === 'monthly'
                  ? 'bg-forge-orange text-bg-void'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t.billing.monthly}
            </button>
            <button
              type="button"
              onClick={() => setCadence('yearly')}
              className={cn(
                'text-caption rounded-md px-3 py-1 font-medium transition-colors',
                cadence === 'yearly'
                  ? 'bg-forge-orange text-bg-void'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t.billing.yearly}
              <span className="text-forge-amber ml-1 text-[10px]">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const p = plan as Record<string, unknown>
            const slug = (p.slug as string) ?? ''
            const name = (p.name as string) ?? slug
            const priceMonthly = (p.priceMonthlyUsd as number) ?? 0
            const priceYearly = (p.priceYearlyUsd as number) ?? 0
            const usd = cadence === 'monthly' ? priceMonthly : priceYearly
            const display = currency === 'USD' ? usd : usdCentsToCnyCents(usd)
            const isCurrent = sub && (sub as Record<string, unknown>).planSlug === slug
            const features = PLAN_FEATURES[slug] ?? []

            return (
              <div
                key={slug}
                className={cn(
                  'bg-bg-surface flex flex-col rounded-lg border p-5',
                  isCurrent ? 'border-forge-orange' : 'border-border-subtle',
                )}
              >
                <p className="font-heading text-h3 text-text-primary capitalize">{name}</p>
                <p className="font-display text-h1 text-text-primary mt-2">
                  {formatMoney(display, currency)}
                  <span className="text-body text-text-muted">
                    /{cadence === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="text-small text-text-secondary flex items-center gap-2">
                      <Icon.Check size={14} className="text-forge-amber shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={!!isCurrent}
                  onClick={() => startSubscription(slug as 'starter' | 'pro' | 'agency', name, usd)}
                >
                  {isCurrent ? t.billing.currentPlanBtn : t.billing.upgrade}
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Credit Packs */}
      {packages.length > 0 && (
        <section>
          <h2 className="font-heading text-h3 text-text-primary mb-4">{t.billing.creditPacks}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {packages.map((pkg) => {
              const p = pkg as Record<string, unknown>
              const slug = (p.slug as string) ?? ''
              const label = (p.name as string) ?? slug
              const creds = (p.credits as number) ?? 0
              const usd = (p.priceUsd as number) ?? 0
              const display = currency === 'USD' ? usd : usdCentsToCnyCents(usd)

              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => buyCreditPack(slug, label, usd)}
                  className="border-border-subtle bg-bg-surface hover:border-forge-orange/40 flex flex-col items-center gap-1 rounded-lg border p-4 text-center transition-colors"
                >
                  <span className="font-display text-h2 text-forge-amber">
                    {creds.toLocaleString()}
                  </span>
                  <span className="text-caption text-text-muted">{t.billing.credits}</span>
                  <span className="font-heading text-small text-text-primary mt-1">
                    {formatMoney(display, currency)}
                  </span>
                  <span className="text-caption text-text-secondary">{label}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Transaction History */}
      <section>
        <h2 className="font-heading text-h3 text-text-primary mb-4">
          {t.billing.recentTransactions}
        </h2>
        {txns.length === 0 ? (
          <div className="border-border-strong bg-bg-surface text-text-muted flex flex-col items-center gap-2 rounded-lg border border-dashed py-10">
            <Icon.Receipt size={28} />
            <p>{t.billing.noTransactions}</p>
          </div>
        ) : (
          <div className="border-border-subtle overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-border-subtle bg-bg-deep border-b">
                  <th className="text-caption text-text-muted px-4 py-2.5 text-left font-mono uppercase tracking-[0.08em]">
                    {t.billing.colDate}
                  </th>
                  <th className="text-caption text-text-muted px-4 py-2.5 text-left font-mono uppercase tracking-[0.08em]">
                    {t.billing.colType}
                  </th>
                  <th className="text-caption text-text-muted px-4 py-2.5 text-left font-mono uppercase tracking-[0.08em]">
                    {t.billing.colDescription}
                  </th>
                  <th className="text-caption text-text-muted px-4 py-2.5 text-right font-mono uppercase tracking-[0.08em]">
                    {t.billing.colAmount}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border-subtle divide-y">
                {txns.map((tx) => {
                  const t = tx as Record<string, unknown>
                  const type = (t.type as string) ?? ''
                  const tone =
                    type === 'refund' ? 'error' : type === 'purchase' ? 'success' : 'info'
                  return (
                    <tr
                      key={t.id as string}
                      className="bg-bg-surface hover:bg-bg-elevated/60 transition-colors"
                    >
                      <td className="text-caption text-text-muted px-4 py-3 font-mono">
                        {t.createdAt ? formatDate(t.createdAt as string) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={tone}>{type}</Badge>
                      </td>
                      <td className="text-small text-text-primary px-4 py-3">
                        {(t.description as string) ?? '—'}
                      </td>
                      <td className="text-small text-text-primary px-4 py-3 text-right font-mono tabular-nums">
                        {type === 'refund' ? '-' : '+'}
                        {(t.amount as number) ?? 0} credits
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Channel picker modal */}
      {pickerKind && pickerSubject && channelInfo && (
        <ChannelPickerModal
          kind={pickerKind}
          subject={pickerSubject}
          cadence={cadence}
          channels={channelInfo}
          onClose={() => {
            setPickerKind(null)
            setPickerSubject(null)
          }}
          onCnPaymentStarted={(id) => {
            setActiveCnPaymentId(id)
            setPickerKind(null)
            setPickerSubject(null)
          }}
        />
      )}

      {/* CN payment QR modal */}
      {activeCnPaymentId && (
        <CnQrModal
          paymentId={activeCnPaymentId}
          onClose={() => setActiveCnPaymentId(null)}
          onPaid={() => {
            credits.refetch()
            subscription.refetch()
            invoices.refetch()
            setActiveCnPaymentId(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BalanceCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        accent ? 'border-forge-orange/30 bg-forge-orange/5' : 'border-border-subtle bg-bg-surface',
      )}
    >
      <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">{label}</p>
      <p
        className={cn(
          'font-display text-h2 mt-1 tabular-nums',
          accent ? 'text-forge-amber' : 'text-text-primary',
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function CurrencyToggle({
  value,
  onChange,
  cnEnabled,
}: {
  value: Currency
  onChange: (c: Currency) => void
  cnEnabled: boolean
}) {
  return (
    <div className="border-border-subtle bg-bg-deep text-text-secondary flex items-center gap-1 rounded-md border p-0.5">
      <button
        type="button"
        onClick={() => onChange('USD')}
        className={cn(
          'rounded px-2 py-0.5 transition-colors',
          value === 'USD' ? 'bg-forge-orange text-bg-void font-medium' : 'hover:text-text-primary',
        )}
      >
        USD
      </button>
      <button
        type="button"
        onClick={() => onChange('CNY')}
        disabled={!cnEnabled}
        className={cn(
          'rounded px-2 py-0.5 transition-colors',
          value === 'CNY' ? 'bg-forge-orange text-bg-void font-medium' : 'hover:text-text-primary',
          !cnEnabled && 'cursor-not-allowed opacity-40',
        )}
        title={cnEnabled ? '' : 'Set your region to China to enable CNY pricing.'}
      >
        CNY
      </button>
    </div>
  )
}

function ChannelPickerModal({
  kind,
  subject,
  cadence,
  channels,
  onClose,
  onCnPaymentStarted,
}: {
  kind: 'subscription' | 'credit_pack'
  subject: { slug: string; label: string; priceUsd: number }
  cadence: 'monthly' | 'yearly'
  channels: ChannelInfo
  onClose: () => void
  onCnPaymentStarted: (id: string) => void
}) {
  const t = useT()
  const stripeSub = trpc.billing.startSubscriptionCheckout.useMutation()
  const stripePack = trpc.billing.startCreditPackCheckout.useMutation()
  const cnSub = trpc.billing.startCnSubscriptionCheckout.useMutation()
  const cnPack = trpc.billing.startCnCreditPackCheckout.useMutation()

  const [chosen, setChosen] = useState<AnyChannel | null>(
    channels.wechat.recommended ? 'wechat' : channels.stripe.recommended ? 'stripe' : null,
  )

  const cnyAmount = useMemo(() => Math.round(subject.priceUsd * USD_TO_CNY), [subject.priceUsd])

  const submitting =
    stripeSub.isPending || stripePack.isPending || cnSub.isPending || cnPack.isPending

  const errMsg =
    stripeSub.error?.message ??
    stripePack.error?.message ??
    cnSub.error?.message ??
    cnPack.error?.message ??
    null

  const submit = async () => {
    if (!chosen) return
    if (chosen === 'stripe') {
      const result =
        kind === 'subscription'
          ? await stripeSub.mutateAsync({
              planSlug: subject.slug as 'starter' | 'pro' | 'agency',
              cadence,
              successUrl: `${window.location.origin}/billing?success=1`,
              cancelUrl: window.location.href,
            })
          : await stripePack.mutateAsync({
              packageSlug: subject.slug,
              successUrl: `${window.location.origin}/billing?credits=1`,
              cancelUrl: window.location.href,
            })
      if (result && typeof result === 'object' && 'url' in result) {
        window.location.href = result.url as string
      }
      return
    }
    // CN channel
    const cn =
      kind === 'subscription'
        ? await cnSub.mutateAsync({
            planSlug: subject.slug as 'starter' | 'pro' | 'agency',
            cadence,
            channel: chosen,
            scene: 'native',
          })
        : await cnPack.mutateAsync({
            packageSlug: subject.slug,
            channel: chosen,
            scene: 'native',
          })
    const cnRow = cn as { id: string; qrCode?: string; redirectUrl?: string; channel: string }
    // Stash QR / channel for the modal to render. Persisting through
    // sessionStorage keeps the modal pure (no need to thread the payload
    // through global state) and survives a fast remount.
    if (typeof window !== 'undefined') {
      const payload = cnRow.qrCode ?? cnRow.redirectUrl ?? ''
      sessionStorage.setItem(`cn-qr:${cnRow.id}`, payload)
      sessionStorage.setItem(`cn-channel:${cnRow.id}`, cnRow.channel)
    }
    onCnPaymentStarted(cnRow.id)
  }

  return (
    <ModalShell title={t.billing.choosePaymentMethod} onClose={onClose}>
      <div className="space-y-4">
        <div className="border-border-subtle bg-bg-deep rounded-md border p-4">
          <p className="font-heading text-small text-text-primary">{subject.label}</p>
          <p className="text-caption text-text-muted mt-1">
            {kind === 'subscription'
              ? cadence === 'monthly'
                ? t.billing.monthlySubscription
                : t.billing.yearlySubscription
              : t.billing.oneshotCreditPack}
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-h2 text-text-primary">
              ${(subject.priceUsd / 100).toFixed(2)}
            </span>
            <span className="text-caption text-text-muted font-mono">
              ≈ ¥{(cnyAmount / 100).toFixed(0)} (rate {USD_TO_CNY.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <ChannelOption
            id="stripe"
            chosen={chosen}
            onChoose={setChosen}
            label="Stripe (USD)"
            description={t.billing.stripeDesc}
            badge={channels.stripe.recommended ? t.billing.recommended : null}
            disabled={!channels.stripe.available}
            currency="USD"
          />
          <ChannelOption
            id="wechat"
            chosen={chosen}
            onChoose={setChosen}
            label="微信支付"
            description={t.billing.wechatPayDesc}
            badge={channels.wechat.recommended ? t.billing.recommended : null}
            disabled={!channels.wechat.available}
            currency="CNY"
          />
          <ChannelOption
            id="alipay"
            chosen={chosen}
            onChoose={setChosen}
            label="支付宝"
            description={t.billing.alipayDesc}
            badge={null}
            disabled={!channels.alipay.available}
            currency="CNY"
          />
        </div>

        {errMsg && (
          <p className="border-error/30 bg-error/5 text-caption text-error rounded-md border px-3 py-2">
            {errMsg}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t.billing.cancel}
          </Button>
          <Button onClick={submit} disabled={!chosen || submitting}>
            {submitting ? t.billing.starting : t.billing.continue}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function ChannelOption({
  id,
  chosen,
  onChoose,
  label,
  description,
  badge,
  disabled,
  currency,
}: {
  id: AnyChannel
  chosen: AnyChannel | null
  onChoose: (c: AnyChannel) => void
  label: string
  description: string
  badge: string | null
  disabled?: boolean
  currency: Currency
}) {
  const active = chosen === id
  return (
    <button
      type="button"
      onClick={() => !disabled && onChoose(id)}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors',
        active
          ? 'border-forge-orange bg-forge-orange/10'
          : 'border-border-subtle bg-bg-deep hover:border-border-strong',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <span
        className={cn(
          'grid h-5 w-5 place-items-center rounded-full border',
          active ? 'border-forge-orange bg-forge-orange' : 'border-border-strong',
        )}
      >
        {active && <span className="bg-bg-void h-2 w-2 rounded-full" />}
      </span>
      <span className="border-border-subtle bg-bg-surface text-text-muted grid h-9 w-9 place-items-center rounded-full border">
        {id === 'stripe' ? (
          <Icon.CreditCard size={16} />
        ) : id === 'wechat' ? (
          <Icon.QrCode size={16} />
        ) : (
          <Icon.QrCode size={16} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-small text-text-primary">{label}</span>
          {badge && <Badge tone="forge">{badge}</Badge>}
          <span className="text-caption text-text-muted ml-auto font-mono">{currency}</span>
        </div>
        <p className="text-caption text-text-muted">{description}</p>
      </div>
    </button>
  )
}

function CnQrModal({
  paymentId,
  onClose,
  onPaid,
}: {
  paymentId: string
  onClose: () => void
  onPaid: () => void
}) {
  const t = useT()
  const [now, setNow] = useState(() => Date.now())
  const status = trpc.billing.cnPaymentStatus.useQuery({ paymentId }, { refetchInterval: 3000 })

  const paid = status.data?.status === 'paid'
  const expired = status.data?.status === 'expired'
  const failed = status.data?.status === 'failed'
  const expiresAt = status.data?.expiresAt
    ? new Date(status.data.expiresAt as unknown as string).getTime()
    : 0
  const remainingMs = Math.max(0, expiresAt - now)

  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid

  useEffect(() => {
    if (paid) {
      const t = setTimeout(() => onPaidRef.current(), 800)
      return () => clearTimeout(t)
    }
  }, [paid])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Pull QR payload from a related react-query cache via direct refetch — but
  // since the start mutation already returned the QR, we keep it in URL hash
  // would be overkill. Instead the modal pulls from a context-style helper:
  // simplest approach is to hit the underlying CnPayment row again via a
  // dedicated query — for MVP we just store the QR via session sessionStorage.
  const qrPayload =
    typeof window === 'undefined' ? null : sessionStorage.getItem(`cn-qr:${paymentId}`)
  const channel =
    typeof window === 'undefined' ? null : sessionStorage.getItem(`cn-channel:${paymentId}`)

  return (
    <ModalShell title={paid ? t.billing.paymentReceived : t.billing.scanToPay} onClose={onClose}>
      <div className="space-y-4">
        {paid ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="bg-success/15 text-success grid h-14 w-14 place-items-center rounded-full">
              <Icon.Check size={28} />
            </span>
            <p className="font-heading text-h3 text-text-primary">{t.billing.thanksConfirmed}</p>
            <p className="text-caption text-text-muted">{t.billing.closingAuto}</p>
          </div>
        ) : expired || failed ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="bg-error/15 text-error grid h-14 w-14 place-items-center rounded-full">
              <Icon.AlertTriangle size={28} />
            </span>
            <p className="font-heading text-h3 text-text-primary">
              {expired ? t.billing.sessionExpired : t.billing.paymentFailed}
            </p>
            <p className="text-caption text-text-muted">{t.billing.closeAndRetry}</p>
            <Button variant="secondary" onClick={onClose}>
              {t.billing.close}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-small text-text-secondary">
              {channel === 'alipay' ? 'Alipay' : 'WeChat'} — {t.billing.scanToPay}
            </p>
            <div className="border-border-strong rounded-md border bg-white p-4">
              {qrPayload ? (
                <QRCodeSVG value={qrPayload} size={208} bgColor="#ffffff" fgColor="#08080a" />
              ) : (
                <div className="text-text-muted grid h-52 w-52 place-items-center">
                  <Icon.QrCode size={48} />
                </div>
              )}
            </div>
            <div className="text-caption text-text-muted flex items-center gap-2">
              <Icon.Refresh size={12} className="animate-spin" />
              {t.billing.waitingConfirmation}
            </div>
            <p className="text-caption text-text-muted font-mono">
              {t.billing.expiresIn} {Math.floor(remainingMs / 60000)}:
              {String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}
            </p>
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t.billing.payLater}
            </Button>
          </div>
        )}
      </div>
    </ModalShell>
  )
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="border-border-subtle bg-bg-surface w-full max-w-md rounded-lg border shadow-xl">
        <header className="border-border-subtle flex items-center justify-between border-b px-5 py-3">
          <h3 className="font-heading text-h3 text-text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:bg-bg-elevated hover:text-text-primary rounded p-1"
          >
            <Icon.Close size={16} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

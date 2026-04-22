'use client'

import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icons'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/cn'

type Tab = 'general' | 'domain' | 'payments' | 'shipping' | 'tax' | 'storefront' | 'team'

const TABS: Array<{ key: Tab; label: string; icon: keyof typeof Icon }> = [
  { key: 'general', label: 'General', icon: 'Settings' },
  { key: 'domain', label: 'Domains', icon: 'Globe' },
  { key: 'payments', label: 'Payments', icon: 'CreditCard' },
  { key: 'shipping', label: 'Shipping', icon: 'Truck' },
  { key: 'tax', label: 'Tax', icon: 'Percent' },
  { key: 'storefront', label: 'Storefront', icon: 'Sites' },
  { key: 'team', label: 'Team', icon: 'Users' },
]

interface PaymentSettings {
  providers: Array<'stripe' | 'paypal' | 'apple_pay' | 'google_pay' | 'nowpayments'>
  stripeAccountId?: string
  paypalEmail?: string
  nowpaymentsApiKey?: string
  currency?: string
}

interface ShippingRate {
  id: string
  label: string
  amountCents: number
  etaDays?: string
}

interface ShippingZone {
  id: string
  name: string
  regions: string[]
  rates: ShippingRate[]
}

interface TaxSettings {
  mode?: 'auto' | 'manual'
  defaultRate?: number
  includedInPrice?: boolean
}

interface StorefrontSettings {
  defaultLocale?: string
  enabledLocales?: string[]
  defaultCurrency?: string
  supportEmail?: string
  contactPhone?: string
  address?: {
    line1?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}

interface SiteSettingsShape {
  payments?: PaymentSettings
  shipping?: { zones?: ShippingZone[] }
  tax?: TaxSettings
  storefront?: StorefrontSettings
}

const newId = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export default function SiteSettingsPage({ params }: { params: { siteId: string } }) {
  const [tab, setTab] = useState<Tab>('general')
  const data = trpc.settings.siteSettings.useQuery({ siteId: params.siteId })

  const site = data.data?.site
  const settings = (data.data?.settings ?? {}) as SiteSettingsShape

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Site"
        title={site ? `${site.name} · Settings` : 'Site settings'}
        description="Domains, payments, shipping, taxes, storefront and team for this site."
        meta={
          site ? (
            <>
              <Badge tone="info">{site.subdomain}.forgely.app</Badge>
              <Badge tone={site.status === 'published' ? 'success' : 'neutral'} dot>
                {site.status}
              </Badge>
            </>
          ) : null
        }
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
          {data.isLoading && (
            <div className="border-border-subtle bg-bg-surface text-small text-text-muted rounded-lg border p-10 text-center">
              Loading site settings…
            </div>
          )}
          {!data.isLoading && tab === 'general' && site && <GeneralTab site={site} />}
          {!data.isLoading && tab === 'domain' && site && (
            <DomainTab siteId={params.siteId} site={site} />
          )}
          {!data.isLoading && tab === 'payments' && (
            <PaymentsTab siteId={params.siteId} settings={settings} />
          )}
          {!data.isLoading && tab === 'shipping' && (
            <ShippingTab siteId={params.siteId} settings={settings} />
          )}
          {!data.isLoading && tab === 'tax' && (
            <TaxTab siteId={params.siteId} settings={settings} />
          )}
          {!data.isLoading && tab === 'storefront' && (
            <StorefrontTab siteId={params.siteId} settings={settings} />
          )}
          {!data.isLoading && tab === 'team' && <TeamTab />}
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

// ─── General ─────────────────────────────────────────────────────────────────

function GeneralTab({
  site,
}: {
  site: { id: string; name: string; subdomain: string; status: string }
}) {
  return (
    <SectionCard
      title="Site identity"
      description="Identity changes (rename / re-key the subdomain) live in the editor's site picker for safety."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Site name">
          <Input value={site.name} disabled className="opacity-70" />
        </Field>
        <Field label="Forgely subdomain" hint="Always available, never reused.">
          <Input value={`${site.subdomain}.forgely.app`} disabled className="opacity-70" />
        </Field>
        <Field label="Status">
          <Input value={site.status} disabled className="opacity-70" />
        </Field>
        <Field label="Site ID" hint="Use this when contacting support.">
          <Input value={site.id} disabled className="font-mono opacity-70" />
        </Field>
      </div>
    </SectionCard>
  )
}

// ─── Domain ──────────────────────────────────────────────────────────────────

function DomainTab({ siteId, site }: { siteId: string; site: { customDomain: string | null } }) {
  const utils = trpc.useUtils()
  const update = trpc.settings.updateCustomDomain.useMutation({
    onSuccess: () => utils.settings.siteSettings.invalidate({ siteId }),
  })

  const [host, setHost] = useState(site.customDomain ?? '')
  const dirty = host.trim() !== (site.customDomain ?? '')

  const save = () =>
    update.mutate({
      siteId,
      customDomain: host.trim() ? host.trim().toLowerCase() : null,
    })

  return (
    <SectionCard
      title="Custom domain"
      description="Bring your own domain. We'll provision a free TLS certificate via Cloudflare."
      footer={
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-muted">
            {update.isPending ? 'Updating…' : update.isSuccess ? 'Saved.' : ''}
            {update.error && <span className="text-error">{update.error.message}</span>}
          </span>
          <div className="flex gap-2">
            {site.customDomain && (
              <Button
                variant="ghost"
                onClick={() => {
                  setHost('')
                  update.mutate({ siteId, customDomain: null })
                }}
                disabled={update.isPending}
              >
                Disconnect
              </Button>
            )}
            <Button onClick={save} disabled={!dirty || update.isPending}>
              {update.isPending ? 'Saving…' : site.customDomain ? 'Update' : 'Connect domain'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Field
          label="Domain"
          hint="Use the bare host — no scheme, no slash. Example: shop.example.com"
        >
          <Input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="shop.example.com"
          />
        </Field>

        <div className="border-border-subtle bg-bg-deep rounded-md border p-4">
          <p className="font-heading text-small text-text-primary">DNS records to add</p>
          <p className="text-caption text-text-muted mt-1">
            Point your DNS provider at Forgely. Propagation usually completes in &lt; 10 min.
          </p>
          <div className="text-caption mt-3 space-y-2 font-mono">
            <div className="bg-bg-surface flex justify-between rounded px-3 py-2">
              <span className="text-text-muted">CNAME</span>
              <span className="text-text-primary">{host || 'shop.example.com'}</span>
              <span className="text-text-secondary">cdn.forgely.app</span>
            </div>
            <div className="bg-bg-surface flex justify-between rounded px-3 py-2">
              <span className="text-text-muted">TXT</span>
              <span className="text-text-primary">
                _forgely-verify.{host || 'shop.example.com'}
              </span>
              <span className="text-text-secondary">forgely-{siteId.slice(0, 12)}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Payments ────────────────────────────────────────────────────────────────

const PROVIDERS: Array<{
  id: PaymentSettings['providers'][number]
  name: string
  description: string
  badge: string
  icon: keyof typeof Icon
}> = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Cards / Apple Pay / Google Pay via Stripe Connect (recommended for USD).',
    badge: 'recommended',
    icon: 'CreditCard',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'PayPal Checkout — required to convert ~12% of US shoppers.',
    badge: 'popular',
    icon: 'Wallet',
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    description: 'One-tap on iOS / Safari. Auto-enabled when Stripe is on.',
    badge: 'paired',
    icon: 'Mobile',
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    description: 'One-tap on Android / Chrome. Auto-enabled when Stripe is on.',
    badge: 'paired',
    icon: 'Mobile',
  },
  {
    id: 'nowpayments',
    name: 'NOWPayments (crypto)',
    description: 'BTC / ETH / USDT settlement for international shoppers.',
    badge: 'optional',
    icon: 'Globe',
  },
]

function PaymentsTab({ siteId, settings }: { siteId: string; settings: SiteSettingsShape }) {
  const utils = trpc.useUtils()
  const update = trpc.settings.updateSiteSettings.useMutation({
    onSuccess: () => utils.settings.siteSettings.invalidate({ siteId }),
  })

  const initial = settings.payments
  const [providers, setProviders] = useState<PaymentSettings['providers']>(
    initial?.providers ?? ['stripe'],
  )
  const [stripeAccount, setStripeAccount] = useState(initial?.stripeAccountId ?? '')
  const [paypalEmail, setPaypalEmail] = useState(initial?.paypalEmail ?? '')
  const [nowApiKey, setNowApiKey] = useState(initial?.nowpaymentsApiKey ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD')

  // Re-prime when settings refetch (e.g. after another tab edits them).
  useEffect(() => {
    if (!initial) return
    setProviders(initial.providers ?? ['stripe'])
    setStripeAccount(initial.stripeAccountId ?? '')
    setPaypalEmail(initial.paypalEmail ?? '')
    setNowApiKey(initial.nowpaymentsApiKey ?? '')
    setCurrency(initial.currency ?? 'USD')
  }, [initial])

  const toggleProvider = (id: PaymentSettings['providers'][number]) => {
    setProviders((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const save = () =>
    update.mutate({
      siteId,
      settings: {
        ...settings,
        payments: {
          providers,
          stripeAccountId: stripeAccount || undefined,
          paypalEmail: paypalEmail || undefined,
          nowpaymentsApiKey: nowApiKey || undefined,
          currency,
        },
      },
    })

  return (
    <div className="space-y-4">
      <SectionCard
        title="Storefront payment providers"
        description="Pick the rails your overseas shoppers will see at checkout. WeChat Pay / Alipay belong to your Forgely subscription billing — not your store."
        footer={
          <div className="flex items-center justify-between">
            <span className="text-caption text-text-muted">
              {update.isPending ? 'Saving…' : update.isSuccess ? 'Settings saved.' : ''}
              {update.error && <span className="text-error">{update.error.message}</span>}
            </span>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save payment settings'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {PROVIDERS.map((p) => {
            const ProviderIcon = Icon[p.icon]
            const enabled = providers.includes(p.id)
            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center justify-between rounded-md border p-4',
                  enabled
                    ? 'border-forge-orange/40 bg-forge-orange/5'
                    : 'border-border-subtle bg-bg-deep',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="border-border-subtle bg-bg-surface text-text-muted grid h-9 w-9 place-items-center rounded-full border">
                    <ProviderIcon size={16} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-small text-text-primary">{p.name}</p>
                      <Badge tone={p.badge === 'recommended' ? 'forge' : 'outline'}>
                        {p.badge}
                      </Badge>
                    </div>
                    <p className="text-caption text-text-muted">{p.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleProvider(p.id)}
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
              </div>
            )
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Default currency" hint="ISO 4217 code (USD / EUR / GBP / CAD …)">
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              className="font-mono uppercase"
            />
          </Field>
          {providers.includes('stripe') && (
            <Field
              label="Stripe Connect account"
              hint="acct_… from Stripe Connect OAuth (Sprint 4 will add the OAuth flow)."
            >
              <Input
                value={stripeAccount}
                onChange={(e) => setStripeAccount(e.target.value)}
                placeholder="acct_1NaR…"
                className="font-mono"
              />
            </Field>
          )}
          {providers.includes('paypal') && (
            <Field label="PayPal merchant email">
              <Input
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="payouts@yourbrand.com"
                type="email"
              />
            </Field>
          )}
          {providers.includes('nowpayments') && (
            <Field label="NOWPayments API key">
              <Input
                value={nowApiKey}
                onChange={(e) => setNowApiKey(e.target.value)}
                placeholder="api_…"
                type="password"
              />
            </Field>
          )}
        </div>
      </SectionCard>

      <div className="border-border-subtle bg-bg-deep rounded-md border p-4">
        <div className="flex gap-3">
          <Icon.Sparkle size={18} className="text-forge-amber mt-0.5 shrink-0" />
          <div className="text-caption text-text-secondary">
            <p className="text-text-primary">Forgely subscription billing is separate.</p>
            <p className="mt-1">
              You pay Forgely&apos;s monthly fee in CNY (微信支付 / 支付宝) — manage that on the{' '}
              <a href="/billing" className="text-forge-amber underline-offset-2 hover:underline">
                Billing page
              </a>
              . The providers above are what your overseas shoppers see when they buy from this
              site.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shipping ────────────────────────────────────────────────────────────────

function ShippingTab({ siteId, settings }: { siteId: string; settings: SiteSettingsShape }) {
  const utils = trpc.useUtils()
  const update = trpc.settings.updateSiteSettings.useMutation({
    onSuccess: () => utils.settings.siteSettings.invalidate({ siteId }),
  })

  const [zones, setZones] = useState<ShippingZone[]>(settings.shipping?.zones ?? [])

  useEffect(() => {
    setZones(settings.shipping?.zones ?? [])
  }, [settings.shipping])

  const addZone = () =>
    setZones((z) => [
      ...z,
      {
        id: newId(),
        name: 'New zone',
        regions: ['US'],
        rates: [{ id: newId(), label: 'Standard', amountCents: 599, etaDays: '5-7' }],
      },
    ])
  const removeZone = (id: string) => setZones((z) => z.filter((zz) => zz.id !== id))
  const updateZone = (id: string, patch: Partial<ShippingZone>) =>
    setZones((z) => z.map((zz) => (zz.id === id ? { ...zz, ...patch } : zz)))

  const addRate = (zoneId: string) =>
    updateZone(zoneId, {
      rates: [
        ...(zones.find((z) => z.id === zoneId)?.rates ?? []),
        { id: newId(), label: 'Express', amountCents: 1499, etaDays: '2-3' },
      ],
    })
  const removeRate = (zoneId: string, rateId: string) =>
    updateZone(zoneId, {
      rates: (zones.find((z) => z.id === zoneId)?.rates ?? []).filter((r) => r.id !== rateId),
    })
  const updateRate = (zoneId: string, rateId: string, patch: Partial<ShippingRate>) =>
    updateZone(zoneId, {
      rates: (zones.find((z) => z.id === zoneId)?.rates ?? []).map((r) =>
        r.id === rateId ? { ...r, ...patch } : r,
      ),
    })

  const save = () =>
    update.mutate({
      siteId,
      settings: {
        ...settings,
        shipping: { zones },
      },
    })

  return (
    <SectionCard
      title="Shipping zones"
      description="Group regions into zones with their own rate cards. Storefront picks the cheapest matching rate at checkout."
      footer={
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-muted">
            {update.isPending ? 'Saving…' : update.isSuccess ? 'Saved.' : ''}
            {update.error && <span className="text-error">{update.error.message}</span>}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={addZone}>
              <Icon.Plus size={14} /> Add zone
            </Button>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save shipping'}
            </Button>
          </div>
        </div>
      }
    >
      {zones.length === 0 ? (
        <div className="border-border-strong bg-bg-deep flex flex-col items-center gap-3 rounded-md border border-dashed py-10 text-center">
          <Icon.Truck size={28} className="text-text-muted" />
          <p className="text-small text-text-primary">No shipping zones yet.</p>
          <p className="text-caption text-text-muted max-w-md">
            Start with a US zone, then layer EU / Rest-of-world. Free shipping is just a £0 rate.
          </p>
          <Button size="sm" onClick={addZone}>
            <Icon.Plus size={14} /> Add first zone
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={zone.id} className="border-border-subtle bg-bg-deep rounded-md border p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Zone name">
                  <Input
                    value={zone.name}
                    onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="Regions" hint="Comma-separated ISO codes (US, CA, MX …)">
                  <Input
                    value={zone.regions.join(', ')}
                    onChange={(e) =>
                      updateZone(zone.id, {
                        regions: e.target.value
                          .split(',')
                          .map((s) => s.trim().toUpperCase())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={() => removeZone(zone.id)}>
                    <Icon.Trash size={14} /> Remove zone
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
                  Rates
                </p>
                <div className="mt-2 space-y-2">
                  {zone.rates.map((rate) => (
                    <div
                      key={rate.id}
                      className="border-border-subtle bg-bg-surface grid grid-cols-12 items-center gap-2 rounded border px-3 py-2"
                    >
                      <Input
                        value={rate.label}
                        onChange={(e) => updateRate(zone.id, rate.id, { label: e.target.value })}
                        placeholder="Standard"
                        className="col-span-4"
                      />
                      <div className="col-span-3 flex items-center gap-1.5">
                        <span className="text-caption text-text-muted">$</span>
                        <Input
                          type="number"
                          value={(rate.amountCents / 100).toFixed(2)}
                          onChange={(e) =>
                            updateRate(zone.id, rate.id, {
                              amountCents: Math.round(parseFloat(e.target.value || '0') * 100),
                            })
                          }
                          className="font-mono"
                        />
                      </div>
                      <Input
                        value={rate.etaDays ?? ''}
                        onChange={(e) => updateRate(zone.id, rate.id, { etaDays: e.target.value })}
                        placeholder="5-7 days"
                        className="col-span-3"
                      />
                      <button
                        type="button"
                        className="text-caption text-text-muted hover:text-error col-span-2 inline-flex items-center justify-end gap-1"
                        onClick={() => removeRate(zone.id, rate.id)}
                      >
                        <Icon.Trash size={12} /> remove
                      </button>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => addRate(zone.id)}>
                    <Icon.Plus size={14} /> Add rate
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Tax ─────────────────────────────────────────────────────────────────────

function TaxTab({ siteId, settings }: { siteId: string; settings: SiteSettingsShape }) {
  const utils = trpc.useUtils()
  const update = trpc.settings.updateSiteSettings.useMutation({
    onSuccess: () => utils.settings.siteSettings.invalidate({ siteId }),
  })

  const initial = settings.tax
  const [mode, setMode] = useState<'auto' | 'manual'>(initial?.mode ?? 'auto')
  const [defaultRate, setDefaultRate] = useState<string>(
    initial?.defaultRate != null ? (initial.defaultRate * 100).toFixed(2) : '',
  )
  const [included, setIncluded] = useState<boolean>(!!initial?.includedInPrice)

  useEffect(() => {
    if (!initial) return
    setMode(initial.mode ?? 'auto')
    setDefaultRate(initial.defaultRate != null ? (initial.defaultRate * 100).toFixed(2) : '')
    setIncluded(!!initial.includedInPrice)
  }, [initial])

  const save = () =>
    update.mutate({
      siteId,
      settings: {
        ...settings,
        tax: {
          mode,
          defaultRate:
            defaultRate.trim() === '' ? undefined : Math.max(0, parseFloat(defaultRate) / 100),
          includedInPrice: included,
        },
      },
    })

  return (
    <SectionCard
      title="Tax"
      description="Auto mode uses the storefront's region detection. Manual mode applies your default rate everywhere."
      footer={
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-muted">
            {update.isPending ? 'Saving…' : update.isSuccess ? 'Saved.' : ''}
            {update.error && <span className="text-error">{update.error.message}</span>}
          </span>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save tax settings'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'auto' | 'manual')}
            className="border-border-strong bg-bg-deep text-text-primary h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="auto">Auto — detect by shopper region</option>
            <option value="manual">Manual — single default rate</option>
          </select>
        </Field>
        <Field label="Default rate" hint="Percentage. Used as a fallback in auto mode.">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="font-mono"
            />
            <span className="text-text-muted">%</span>
          </div>
        </Field>
        <div className="sm:col-span-2">
          <label className="border-border-subtle bg-bg-deep flex items-center gap-3 rounded-md border px-4 py-3">
            <input
              type="checkbox"
              checked={included}
              onChange={(e) => setIncluded(e.target.checked)}
              className="accent-forge-orange h-4 w-4"
            />
            <div>
              <p className="text-small text-text-primary">Tax-inclusive pricing</p>
              <p className="text-caption text-text-muted">
                Display prices with tax already baked in (EU best practice).
              </p>
            </div>
          </label>
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Storefront ──────────────────────────────────────────────────────────────

const ALL_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]

function StorefrontTab({ siteId, settings }: { siteId: string; settings: SiteSettingsShape }) {
  const utils = trpc.useUtils()
  const update = trpc.settings.updateSiteSettings.useMutation({
    onSuccess: () => utils.settings.siteSettings.invalidate({ siteId }),
  })

  const initial = settings.storefront
  const [defaultLocale, setDefaultLocale] = useState(initial?.defaultLocale ?? 'en')
  const [enabledLocales, setEnabledLocales] = useState<string[]>(initial?.enabledLocales ?? ['en'])
  const [defaultCurrency, setDefaultCurrency] = useState(initial?.defaultCurrency ?? 'USD')
  const [supportEmail, setSupportEmail] = useState(initial?.supportEmail ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? '')
  const [line1, setLine1] = useState(initial?.address?.line1 ?? '')
  const [city, setCity] = useState(initial?.address?.city ?? '')
  const [stateRegion, setStateRegion] = useState(initial?.address?.state ?? '')
  const [country, setCountry] = useState(initial?.address?.country ?? '')
  const [postal, setPostal] = useState(initial?.address?.postalCode ?? '')

  useEffect(() => {
    if (!initial) return
    setDefaultLocale(initial.defaultLocale ?? 'en')
    setEnabledLocales(initial.enabledLocales ?? ['en'])
    setDefaultCurrency(initial.defaultCurrency ?? 'USD')
    setSupportEmail(initial.supportEmail ?? '')
    setContactPhone(initial.contactPhone ?? '')
    setLine1(initial.address?.line1 ?? '')
    setCity(initial.address?.city ?? '')
    setStateRegion(initial.address?.state ?? '')
    setCountry(initial.address?.country ?? '')
    setPostal(initial.address?.postalCode ?? '')
  }, [initial])

  const toggleLocale = (code: string) => {
    setEnabledLocales((cur) => {
      if (cur.includes(code)) {
        return cur.length === 1 ? cur : cur.filter((c) => c !== code)
      }
      return [...cur, code]
    })
  }

  const save = () =>
    update.mutate({
      siteId,
      settings: {
        ...settings,
        storefront: {
          defaultLocale,
          enabledLocales,
          defaultCurrency,
          supportEmail: supportEmail || undefined,
          contactPhone: contactPhone || undefined,
          address: {
            line1: line1 || undefined,
            city: city || undefined,
            state: stateRegion || undefined,
            country: country || undefined,
            postalCode: postal || undefined,
          },
        },
      },
    })

  return (
    <SectionCard
      title="Storefront"
      description="Public-facing details — languages, default currency and contact info shown to overseas shoppers."
      footer={
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-muted">
            {update.isPending ? 'Saving…' : update.isSuccess ? 'Saved.' : ''}
            {update.error && <span className="text-error">{update.error.message}</span>}
          </span>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save storefront'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Default locale">
            <select
              value={defaultLocale}
              onChange={(e) => setDefaultLocale(e.target.value)}
              className="border-border-strong bg-bg-deep text-text-primary h-9 w-full rounded-md border px-3 text-sm"
            >
              {enabledLocales.map((code) => {
                const label = ALL_LOCALES.find((l) => l.code === code)?.label ?? code
                return (
                  <option key={code} value={code}>
                    {label}
                  </option>
                )
              })}
            </select>
          </Field>
          <Field label="Default currency" hint="ISO 4217 — USD / EUR / GBP / CAD …">
            <Input
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              className="font-mono uppercase"
            />
          </Field>
        </div>

        <div>
          <p className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
            Enabled locales
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_LOCALES.map((loc) => {
              const active = enabledLocales.includes(loc.code)
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => toggleLocale(loc.code)}
                  className={cn(
                    'text-caption rounded-md border px-3 py-1.5 transition-colors',
                    active
                      ? 'border-forge-orange/40 bg-forge-orange/10 text-forge-amber'
                      : 'border-border-subtle bg-bg-deep text-text-muted hover:text-text-primary',
                  )}
                >
                  {loc.label} <span className="font-mono opacity-60">{loc.code}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Support email">
            <Input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="hello@yourbrand.com"
              type="email"
            />
          </Field>
          <Field label="Contact phone">
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 415 555 0100"
            />
          </Field>
        </div>

        <div>
          <p className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
            Business address
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Street">
              <Input value={line1} onChange={(e) => setLine1(e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="State / region">
              <Input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
            </Field>
            <Field label="Postal code">
              <Input value={postal} onChange={(e) => setPostal(e.target.value)} />
            </Field>
            <Field label="Country" hint="ISO code (US / GB / DE …)">
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
                className="font-mono uppercase"
              />
            </Field>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Team ────────────────────────────────────────────────────────────────────

function TeamTab() {
  // The per-tenant team CRUD lives behind super.team for now (W7 owns
  // TeamMember). When that lands we can wire this to settings.team.* as well.
  return (
    <SectionCard
      title="Team"
      description="Invite collaborators with OWNER / ADMIN / SUPPORT roles. Coming online in the next release."
    >
      <div className="space-y-3">
        <div className="border-border-subtle bg-bg-deep flex items-center justify-between rounded-md border p-4">
          <div>
            <p className="text-small text-text-primary">Per-site team management</p>
            <p className="text-caption text-text-muted">
              Wired through the same TeamMember model as the super-admin team.
            </p>
          </div>
          <Badge tone="forge" dot>
            roadmap · Sprint 4
          </Badge>
        </div>

        <div className="border-border-strong bg-bg-deep rounded-md border border-dashed p-6 text-center">
          <Icon.Users size={24} className="text-text-muted mx-auto" />
          <p className="text-small text-text-primary mt-2">Invite teammates</p>
          <p className="text-caption text-text-muted mt-1">
            For now use Settings → Workspace to set the workspace name. Full per-site invite UI is
            next.
          </p>
        </div>
      </div>
    </SectionCard>
  )
}

// (Reserved type so updates to SiteSettingsShape don't go unnoticed.)
export type { SiteSettingsShape as ExportedShape }

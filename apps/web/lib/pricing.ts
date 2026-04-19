/**
 * Pricing matrix mirrors docs/MASTER.md §3.2.
 * Single source of truth for the marketing pricing page + structured data.
 *
 * Text content lives in `messages/{locale}.json` under the `pricing.plans.*` namespace.
 * This file only owns the *shape*: prices, ordering, feature keys, included/value flags.
 */

export interface PricingFeature {
  /** Translation key suffix; full path = `pricing.plans.${planId}.features.${key}` */
  key: string
  /** Show as crossed-out / not included when false. Defaults to true. */
  included?: boolean
  /**
   * Show a separate emphasised value alongside the label. When true, the i18n
   * file must provide both `${key}` (label) and `${key}Value` (highlight).
   */
  hasValue?: boolean
}

export type PricingPlanId = 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'

export type CurrencyCode = 'USD' | 'CNY'

/**
 * Per-currency pricing tuple. The CN pivot wants RMB on /, USD on /en.
 * Stripe still settles in USD; the CNY column is a marketing convenience.
 */
export interface PricingAmount {
  monthly: number | null
  annual: number | null
}

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  USD: '$',
  CNY: '¥',
}

export const LOCALE_CURRENCY: Record<'en' | 'zh', CurrencyCode> = {
  en: 'USD',
  zh: 'CNY',
}

export interface PricingPlan {
  id: PricingPlanId
  /** Default monthly amount (USD), kept for backwards compatibility. */
  monthly: number | null
  annual: number | null
  /** Per-currency overrides. Falls back to USD `monthly`/`annual` when missing. */
  amounts?: Partial<Record<CurrencyCode, PricingAmount>>
  recommended?: boolean
  ctaHref: string
  features: PricingFeature[]
  hasFootnote?: boolean
}

export function planAmount(plan: PricingPlan, currency: CurrencyCode): PricingAmount {
  return plan.amounts?.[currency] ?? { monthly: plan.monthly, annual: plan.annual }
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    monthly: 0,
    annual: 0,
    amounts: { CNY: { monthly: 0, annual: 0 } },
    ctaHref: '/waitlist?plan=free',
    features: [
      { key: 'credits', hasValue: true },
      { key: 'site' },
      { key: 'homepage' },
      { key: 'videoHero', included: true },
      { key: 'copilotLimited', hasValue: true },
      { key: 'customDomain', included: false },
      { key: 'codeExport', included: false },
    ],
  },
  {
    id: 'starter',
    monthly: 29,
    annual: 261,
    amounts: { CNY: { monthly: 199, annual: 1791 } },
    ctaHref: '/waitlist?plan=starter',
    hasFootnote: true,
    features: [
      { key: 'credits', hasValue: true },
      { key: 'sites', hasValue: true },
      { key: 'domain', hasValue: true },
      { key: 'videoHero', included: true },
      { key: 'threeDHero', included: false },
      { key: 'copilot', included: true },
      { key: 'codeExport', included: false },
    ],
  },
  {
    id: 'pro',
    monthly: 99,
    annual: 891,
    amounts: { CNY: { monthly: 599, annual: 5391 } },
    recommended: true,
    ctaHref: '/waitlist?plan=pro',
    hasFootnote: true,
    features: [
      { key: 'credits', hasValue: true },
      { key: 'sites', hasValue: true },
      { key: 'domains', hasValue: true },
      { key: 'video3DHero', included: true },
      { key: 'copilotFull', included: true },
      { key: 'codeExportMonthly', included: true },
      { key: 'priorityQueue', included: true },
    ],
  },
  {
    id: 'agency',
    monthly: 299,
    annual: 2691,
    amounts: { CNY: { monthly: 1999, annual: 17991 } },
    ctaHref: '/waitlist?plan=agency',
    features: [
      { key: 'credits', hasValue: true },
      { key: 'sites', hasValue: true },
      { key: 'domains', hasValue: true },
      { key: 'whiteLabel', included: true },
      { key: 'unlimitedExport', included: true },
      { key: 'teamSeats', included: true },
      { key: 'prioritySupport', included: true },
    ],
  },
  {
    id: 'enterprise',
    monthly: null,
    annual: null,
    amounts: { CNY: { monthly: null, annual: null } },
    ctaHref: 'mailto:hello@forgely.com?subject=Enterprise',
    features: [
      { key: 'creditPool' },
      { key: 'sites' },
      { key: 'infra' },
      { key: 'deployment' },
      { key: 'compliance' },
      { key: 'engineer' },
    ],
  },
]

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

export interface PricingPlan {
  id: PricingPlanId
  monthly: number | null
  annual: number | null
  recommended?: boolean
  ctaHref: string
  features: PricingFeature[]
  hasFootnote?: boolean
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    monthly: 0,
    annual: 0,
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

/**
 * Pricing matrix mirrors docs/MASTER.md §3.2.
 * Single source of truth for the marketing pricing page + structured data.
 */

export interface PricingFeature {
  label: string
  /** When `false` the feature is shown crossed-out as "not included" */
  included?: boolean
  /** Optional emphasised value (e.g. "5 sites", "1,500 credits/mo") */
  value?: string
}

export interface PricingPlan {
  id: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'
  name: string
  tagline: string
  monthly: number | null
  annual: number | null
  /** Marketing emphasis – exactly one plan should be `recommended` */
  recommended?: boolean
  cta: { label: string; href: string }
  features: PricingFeature[]
  footnote?: string
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Kick the tires.',
    monthly: 0,
    annual: 0,
    cta: { label: 'Start for free', href: '/waitlist?plan=free' },
    features: [
      { label: '500 one-time credits', value: '500 credits' },
      { label: '1 site on .forgely.app subdomain (with watermark)' },
      { label: '6-section homepage generation' },
      { label: 'Video Hero (no 3D)', included: true },
      { label: 'AI Copilot', value: 'limited' },
      { label: 'Custom domain', included: false },
      { label: 'Code export', included: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo brands going live.',
    monthly: 29,
    annual: 261,
    cta: { label: 'Choose Starter', href: '/waitlist?plan=starter' },
    features: [
      { value: '1,500 credits / month', label: 'Credits' },
      { value: '3 sites', label: 'Sites' },
      { value: '1 custom domain', label: 'Custom domain' },
      { label: 'Video Hero', included: true },
      { label: '3D Hero', included: false },
      { label: 'AI Copilot', included: true },
      { label: 'Code export', included: false },
    ],
    footnote: 'Annual = 3 months free.',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing DTC brands.',
    monthly: 99,
    annual: 891,
    recommended: true,
    cta: { label: 'Choose Pro', href: '/waitlist?plan=pro' },
    features: [
      { value: '6,000 credits / month', label: 'Credits' },
      { value: '10 sites', label: 'Sites' },
      { value: '5 custom domains', label: 'Custom domains' },
      { label: 'Video + 3D Hero', included: true },
      { label: 'AI Copilot full power', included: true },
      { label: '1× Code export / month', included: true },
      { label: 'Priority generation queue', included: true },
    ],
    footnote: 'Most popular. Save 25% on annual.',
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'Scale across many brands.',
    monthly: 299,
    annual: 2691,
    cta: { label: 'Choose Agency', href: '/waitlist?plan=agency' },
    features: [
      { value: '25,000 credits / month', label: 'Credits' },
      { value: '50 sites', label: 'Sites' },
      { value: 'Unlimited custom domains', label: 'Custom domains' },
      { label: 'White-label Copilot', included: true },
      { label: 'Unlimited code export', included: true },
      { label: 'Team seats (5)', included: true },
      { label: 'Priority support', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For platforms & retailers.',
    monthly: null,
    annual: null,
    cta: { label: 'Talk to sales', href: 'mailto:hello@forgely.com?subject=Enterprise' },
    features: [
      { label: 'Custom credit pool' },
      { label: '100+ sites' },
      { label: 'Dedicated infrastructure' },
      { label: 'Private deployment option' },
      { label: 'SOC 2 / DPA / SSO' },
      { label: 'Named success engineer' },
    ],
  },
]

'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { buttonClasses } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/section-heading'
import { pricingPlans, type PricingPlan } from '@/lib/pricing'
import { cn } from '@/lib/cn'

type Cycle = 'monthly' | 'annual'

function priceLabel(
  plan: PricingPlan,
  cycle: Cycle,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (plan.monthly === null || plan.annual === null) {
    return { value: t('custom'), cadence: t('tailored') }
  }
  if (cycle === 'annual') {
    if (plan.annual === 0) return { value: '$0', cadence: t('forever') }
    const monthlyish = plan.annual / 12
    return {
      value: `$${monthlyish.toFixed(0)}`,
      cadence: t('perMonthBilledYearly', { amount: plan.annual }),
    }
  }
  if (plan.monthly === 0) return { value: '$0', cadence: t('forever') }
  return { value: `$${plan.monthly}`, cadence: t('perMonth') }
}

export function Pricing() {
  const t = useTranslations('pricing')
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const plans = useMemo(() => pricingPlans, [])

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="border-b border-border-subtle py-24 lg:py-32"
    >
      <div className="container-page flex flex-col gap-14">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow={t('eyebrow')}
            title={<span id="pricing-title">{t('title')}</span>}
            description={t('description')}
          />

          <div
            role="tablist"
            aria-label={t('billingCycle')}
            className="inline-flex items-center rounded-full border border-border-strong bg-bg-elevated p-1"
          >
            {(['monthly', 'annual'] as Cycle[]).map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cycle === c}
                onClick={() => setCycle(c)}
                className={cn(
                  'rounded-full px-4 py-2 font-mono text-caption uppercase tracking-[0.18em] transition',
                  cycle === c
                    ? 'bg-forge-orange text-bg-void shadow-glow-forge'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {c === 'monthly' ? t('monthly') : t('annualSave')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan) => {
            const price = priceLabel(plan, cycle, t)
            const planName = t(`plans.${plan.id}.name`)
            const planTagline = t(`plans.${plan.id}.tagline`)
            const planCta = t(`plans.${plan.id}.cta`)
            return (
              <article
                key={plan.id}
                className={cn(
                  'relative flex h-full flex-col gap-6 rounded-2xl border bg-bg-deep p-7 transition',
                  plan.recommended
                    ? 'border-forge-orange/60 shadow-glow-forge xl:scale-[1.03]'
                    : 'border-border-strong hover:border-border-strong/80',
                )}
              >
                {plan.recommended ? (
                  <Badge tone="forge" className="absolute -top-3 left-7">
                    {t('mostPopular')}
                  </Badge>
                ) : null}

                <header className="flex flex-col gap-2">
                  <h3 className="font-display text-h2 font-light text-text-primary">
                    {planName}
                  </h3>
                  <p className="text-small text-text-muted">{planTagline}</p>
                </header>

                <div className="flex items-baseline gap-2">
                  <span className="font-display text-display font-light tracking-tight text-text-primary">
                    {price.value}
                  </span>
                  <span className="text-small text-text-muted">
                    {price.cadence}
                  </span>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={buttonClasses({
                    variant: plan.recommended ? 'forge' : 'outline',
                    size: 'md',
                    className: 'w-full',
                  })}
                >
                  {planCta}
                </Link>

                <ul className="mt-2 flex flex-col gap-3 text-small">
                  {plan.features.map((f) => {
                    const isOmitted = f.included === false
                    const label = t(`plans.${plan.id}.features.${f.key}`)
                    const value = f.hasValue
                      ? t(`plans.${plan.id}.features.${f.key}Value`)
                      : null
                    return (
                      <li key={f.key} className="flex items-start gap-2">
                        {isOmitted ? (
                          <Minus
                            className="mt-0.5 h-4 w-4 shrink-0 text-text-subtle"
                            aria-hidden="true"
                          />
                        ) : (
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-forge-orange"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={cn(
                            isOmitted ? 'text-text-subtle' : 'text-text-secondary',
                          )}
                        >
                          {value ? (
                            <span className="text-text-primary">{value}</span>
                          ) : null}
                          {value ? (
                            <span className="ml-1 text-text-muted">·</span>
                          ) : null}
                          <span className="ml-1">{label}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {plan.hasFootnote ? (
                  <p className="mt-auto pt-4 font-mono text-caption uppercase tracking-[0.16em] text-text-muted">
                    {t(`plans.${plan.id}.footnote`)}
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

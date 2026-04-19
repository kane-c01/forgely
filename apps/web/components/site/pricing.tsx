'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Badge, Button, cn } from '@forgely/ui'
import { SectionHeading } from '@/components/ui/section-heading'
import {
  CURRENCY_SYMBOL,
  LOCALE_CURRENCY,
  pricingPlans,
  planAmount,
  type PricingPlan,
} from '@/lib/pricing'
import type { Locale } from '@/i18n/routing'

type Cycle = 'monthly' | 'annual'

interface PriceLabelKeys {
  custom: string
  tailored: string
  forever: string
  perMonth: string
  perMonthBilledYearly: string
}

function priceLabel(
  plan: PricingPlan,
  cycle: Cycle,
  locale: Locale,
  keys: PriceLabelKeys,
  formatBilled: (params: { amount: string }) => string,
) {
  const currency = LOCALE_CURRENCY[locale]
  const symbol = CURRENCY_SYMBOL[currency]
  const amounts = planAmount(plan, currency)

  if (amounts.monthly === null || amounts.annual === null) {
    return { value: keys.custom, cadence: keys.tailored }
  }

  if (cycle === 'annual') {
    if (amounts.annual === 0) return { value: `${symbol}0`, cadence: keys.forever }
    const monthlyish = amounts.annual / 12
    return {
      value: `${symbol}${Math.round(monthlyish)}`,
      cadence: formatBilled({ amount: `${symbol}${amounts.annual.toLocaleString()}` }),
    }
  }

  if (amounts.monthly === 0) return { value: `${symbol}0`, cadence: keys.forever }
  return { value: `${symbol}${amounts.monthly}`, cadence: keys.perMonth }
}

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const t = useTranslations('pricing')
  const locale = useLocale() as Locale
  const plans = useMemo(() => pricingPlans, [])

  const keys: PriceLabelKeys = {
    custom: t('custom'),
    tailored: t('tailored'),
    forever: t('forever'),
    perMonth: t('perMonth'),
    perMonthBilledYearly: t('perMonthBilledYearly', { amount: '__AMOUNT__' }),
  }

  const formatBilled = ({ amount }: { amount: string }) => t('perMonthBilledYearly', { amount })

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="border-border-subtle border-b py-24 lg:py-32"
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
            className="border-border-strong bg-bg-elevated inline-flex items-center rounded-full border p-1"
          >
            {(['monthly', 'annual'] as Cycle[]).map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cycle === c}
                onClick={() => setCycle(c)}
                className={cn(
                  'text-caption rounded-full px-4 py-2 font-mono uppercase tracking-[0.18em] transition',
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
            const price = priceLabel(plan, cycle, locale, keys, formatBilled)
            const planName = t(`plans.${plan.id}.name`)
            const planTagline = t(`plans.${plan.id}.tagline`)
            const planCta = t(`plans.${plan.id}.cta`)
            const planFootnote = plan.hasFootnote ? t(`plans.${plan.id}.footnote`) : null
            return (
              <article
                key={plan.id}
                className={cn(
                  'bg-bg-deep relative flex h-full flex-col gap-6 rounded-2xl border p-7 transition',
                  plan.recommended
                    ? 'border-forge-orange/60 shadow-glow-forge xl:scale-[1.03]'
                    : 'border-border-strong hover:border-border-strong/80',
                )}
              >
                {plan.recommended ? (
                  <Badge variant="forge" className="absolute -top-3 left-7">
                    {t('mostPopular')}
                  </Badge>
                ) : null}

                <header className="flex flex-col gap-2">
                  <h3 className="font-display text-h2 text-text-primary font-light">{planName}</h3>
                  <p className="text-small text-text-muted">{planTagline}</p>
                </header>

                <div className="flex items-baseline gap-2">
                  <span className="font-display text-display text-text-primary font-light tracking-tight">
                    {price.value}
                  </span>
                  <span className="text-small text-text-muted">{price.cadence}</span>
                </div>

                <Button
                  asChild
                  variant={plan.recommended ? 'primary' : 'secondary'}
                  size="md"
                  className="w-full"
                >
                  <Link href={plan.ctaHref}>{planCta}</Link>
                </Button>

                <ul className="text-small mt-2 flex flex-col gap-3">
                  {plan.features.map((feature) => {
                    const isOmitted = feature.included === false
                    const label = t(`plans.${plan.id}.features.${feature.key}`)
                    const value = feature.hasValue
                      ? t(`plans.${plan.id}.features.${feature.key}Value`)
                      : null
                    return (
                      <li key={feature.key} className="flex items-start gap-2">
                        {isOmitted ? (
                          <Minus
                            className="text-text-subtle mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Check
                            className="text-forge-orange mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={cn(isOmitted ? 'text-text-subtle' : 'text-text-secondary')}
                        >
                          {value ? <span className="text-text-primary">{value}</span> : null}
                          {value ? <span className="text-text-muted ml-1">·</span> : null}
                          <span className="ml-1">{label}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {planFootnote ? (
                  <p className="text-caption text-text-muted mt-auto pt-4 font-mono uppercase tracking-[0.16em]">
                    {planFootnote}
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

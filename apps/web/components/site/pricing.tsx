'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { Badge, Button, cn } from '@forgely/ui'
import { SectionHeading } from '@/components/ui/section-heading'
import { pricingPlans, type PricingPlan } from '@/lib/pricing'

type Cycle = 'monthly' | 'annual'

function priceLabel(plan: PricingPlan, cycle: Cycle) {
  if (plan.monthly === null || plan.annual === null) {
    return { value: 'Custom', cadence: 'tailored to your scale' }
  }
  if (cycle === 'annual') {
    if (plan.annual === 0) return { value: '$0', cadence: 'forever' }
    const monthlyish = plan.annual / 12
    return {
      value: `$${monthlyish.toFixed(0)}`,
      cadence: `/ month, billed $${plan.annual} yearly`,
    }
  }
  if (plan.monthly === 0) return { value: '$0', cadence: 'forever' }
  return { value: `$${plan.monthly}`, cadence: '/ month' }
}

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const plans = useMemo(() => pricingPlans, [])

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="border-border-subtle border-b py-24 lg:py-32"
    >
      <div className="container-page flex flex-col gap-14">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Pricing"
            title={<span id="pricing-title">Pay for the forge, not the seat.</span>}
            description="Start free. Subscribe for monthly credits + features. Top up anytime — purchased credits never expire."
          />

          <div
            role="tablist"
            aria-label="Billing cycle"
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
                {c === 'monthly' ? 'Monthly' : 'Annual · Save 25%'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan) => {
            const price = priceLabel(plan, cycle)
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
                    Most popular
                  </Badge>
                ) : null}

                <header className="flex flex-col gap-2">
                  <h3 className="font-display text-h2 text-text-primary font-light">{plan.name}</h3>
                  <p className="text-small text-text-muted">{plan.tagline}</p>
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
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>

                <ul className="text-small mt-2 flex flex-col gap-3">
                  {plan.features.map((f) => {
                    const isOmitted = f.included === false
                    return (
                      <li key={f.label} className="flex items-start gap-2">
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
                          {f.value ? <span className="text-text-primary">{f.value}</span> : null}
                          {f.value ? <span className="text-text-muted ml-1">·</span> : null}
                          <span className="ml-1">{f.label}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {plan.footnote ? (
                  <p className="text-caption text-text-muted mt-auto pt-4 font-mono uppercase tracking-[0.16em]">
                    {plan.footnote}
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

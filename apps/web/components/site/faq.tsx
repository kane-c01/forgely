'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/ui/section-heading'
import { faqKeys } from '@/lib/faq'
import { cn } from '@/lib/cn'

export function Faq() {
  const t = useTranslations('faq')
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="border-b border-border-subtle py-24 lg:py-32"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={<span id="faq-title">{t('title')}</span>}
          description={t('description')}
        />

        <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
          {faqKeys.map((key, idx) => {
            const isOpen = open === idx
            const question = t(`items.${key}.question`)
            const answer = t(`items.${key}.answer`)
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${idx}`}
                  onClick={() => setOpen((prev) => (prev === idx ? null : idx))}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition hover:text-forge-orange"
                >
                  <span className="font-display text-h3 font-light text-text-primary">
                    {question}
                  </span>
                  <Plus
                    aria-hidden="true"
                    className={cn(
                      'h-5 w-5 shrink-0 text-text-secondary transition duration-medium ease-standard',
                      isOpen ? 'rotate-45 text-forge-orange' : 'rotate-0',
                    )}
                  />
                </button>
                <div
                  id={`faq-${idx}`}
                  hidden={!isOpen}
                  className="pb-6 text-body text-text-secondary"
                >
                  {answer}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

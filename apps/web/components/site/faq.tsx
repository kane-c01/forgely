'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@forgely/ui'
import { SectionHeading } from '@/components/ui/section-heading'
import { faqKeys, type FaqItem } from '@/lib/faq'

export function Faq() {
  const t = useTranslations('faq')
  const tItems = useTranslations('faq.items')
  const [open, setOpen] = useState<number | null>(0)

  const items = useMemo<FaqItem[]>(
    () =>
      faqKeys.map((key) => ({
        question: tItems(`${key}.question`),
        answer: tItems(`${key}.answer`),
      })),
    [tItems],
  )

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="border-border-subtle border-b py-24 lg:py-32"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={<span id="faq-title">{t('title')}</span>}
          description={t('description')}
        />

        <ul className="divide-border-subtle border-border-subtle flex flex-col divide-y border-y">
          {items.map((item, idx) => {
            const isOpen = open === idx
            return (
              <li key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${idx}`}
                  onClick={() => setOpen((prev) => (prev === idx ? null : idx))}
                  className="hover:text-forge-orange flex w-full items-center justify-between gap-6 py-5 text-left transition"
                >
                  <span className="font-display text-h3 text-text-primary font-light">
                    {item.question}
                  </span>
                  <Plus
                    aria-hidden="true"
                    className={cn(
                      'text-text-secondary duration-medium ease-standard h-5 w-5 shrink-0 transition',
                      isOpen ? 'text-forge-orange rotate-45' : 'rotate-0',
                    )}
                  />
                </button>
                <div
                  id={`faq-${idx}`}
                  hidden={!isOpen}
                  className="text-body text-text-secondary pb-6"
                >
                  {item.answer}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

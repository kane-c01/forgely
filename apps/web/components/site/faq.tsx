'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SectionHeading } from '@/components/ui/section-heading'
import { faqItems } from '@/lib/faq'
import { cn } from '@/lib/cn'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="border-b border-border-subtle py-24 lg:py-32"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <SectionHeading
          eyebrow="FAQ"
          title={<span id="faq-title">Common questions, answered straight.</span>}
          description="Anything missing? Email hello@forgely.com — we'll send you a real reply, not a chatbot."
        />

        <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
          {faqItems.map((item, idx) => {
            const isOpen = open === idx
            return (
              <li key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${idx}`}
                  onClick={() => setOpen((prev) => (prev === idx ? null : idx))}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition hover:text-forge-orange"
                >
                  <span className="font-display text-h3 font-light text-text-primary">
                    {item.question}
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

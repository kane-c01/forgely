'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@forgely/ui'
import { SectionHeading } from '@/components/ui/section-heading'
import { faqItems } from '@/lib/faq'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="border-border-subtle border-b py-24 lg:py-32"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <SectionHeading
          eyebrow="FAQ"
          title={<span id="faq-title">Common questions, answered straight.</span>}
          description="Anything missing? Email hello@forgely.com — we'll send you a real reply, not a chatbot."
        />

        <ul className="divide-border-subtle border-border-subtle flex flex-col divide-y border-y">
          {faqItems.map((item, idx) => {
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

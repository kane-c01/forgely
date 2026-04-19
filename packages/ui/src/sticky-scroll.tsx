'use client'

import * as React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { cn } from './utils'

export interface StickyScrollSection {
  title: string
  description?: string
  content?: React.ReactNode
}

export interface StickyScrollProps {
  sections: StickyScrollSection[]
  className?: string
}

/**
 * StickyScroll — Aceternity inspired scrollytelling layout. The right-hand
 * panel sticks while the left list scrolls, and the active card swaps as
 * each section enters the viewport. Used for "How it works" on the
 * marketing site.
 */
export function StickyScroll({ sections, className }: StickyScrollProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const cardLength = sections.length
  const indexFraction = useTransform(scrollYProgress, [0, 1], [0, cardLength])
  const [activeCard, setActiveCard] = React.useState(0)

  React.useEffect(() => {
    return indexFraction.on('change', (value) => {
      const next = Math.min(cardLength - 1, Math.max(0, Math.floor(value)))
      setActiveCard(next)
    })
  }, [indexFraction, cardLength])

  return (
    <motion.div
      ref={ref}
      className={cn(
        'border-border-subtle bg-bg-deep relative grid gap-12 rounded-2xl border p-6 lg:grid-cols-[1fr_minmax(300px,420px)] lg:p-10',
        className,
      )}
    >
      <div className="flex flex-col gap-32">
        {sections.map((section, idx) => (
          <div key={section.title} className="max-w-prose">
            <motion.p
              className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]"
              animate={{ opacity: activeCard === idx ? 1 : 0.45 }}
            >
              0{idx + 1}
            </motion.p>
            <motion.h3
              className="font-heading text-h2 text-text-primary mt-2 leading-tight tracking-tight"
              animate={{ opacity: activeCard === idx ? 1 : 0.5 }}
            >
              {section.title}
            </motion.h3>
            {section.description && (
              <motion.p
                className="text-body text-text-secondary mt-3"
                animate={{ opacity: activeCard === idx ? 1 : 0.4 }}
              >
                {section.description}
              </motion.p>
            )}
          </div>
        ))}
      </div>
      <div className="border-border-strong bg-bg-elevated shadow-elevated sticky top-24 hidden h-[420px] overflow-hidden rounded-xl border lg:block">
        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            className="absolute inset-0 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: activeCard === idx ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          >
            {section.content ?? (
              <span className="font-display text-display text-text-secondary">0{idx + 1}</span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

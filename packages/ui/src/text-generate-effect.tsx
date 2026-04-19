'use client'

import * as React from 'react'
import { motion, useInView } from 'framer-motion'

import { cn } from './utils'

export interface TextGenerateEffectProps {
  words: string
  className?: string
  filter?: boolean
  duration?: number
  delay?: number
  /** When true, the animation replays each time the element re-enters the viewport. */
  replay?: boolean
}

/**
 * TextGenerateEffect — Aceternity inspired typewriter / blur-in word
 * reveal. Each word fades + un-blurs in sequence for the Hero subtitle
 * and AI Copilot streamed-response copy.
 */
export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.45,
  delay = 0,
  replay = false,
}: TextGenerateEffectProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: !replay, margin: '0px' })
  const items = React.useMemo(() => words.split(' '), [words])

  return (
    <div ref={ref} className={cn('inline-block', className)}>
      {items.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          className="mr-1 inline-block"
          initial={{ opacity: 0, filter: filter ? 'blur(8px)' : 'none' }}
          animate={
            inView
              ? { opacity: 1, filter: 'blur(0px)' }
              : { opacity: 0, filter: filter ? 'blur(8px)' : 'none' }
          }
          transition={{
            duration,
            ease: [0.2, 0, 0, 1],
            delay: delay + idx * 0.08,
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}

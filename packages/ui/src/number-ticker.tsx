'use client'

import * as React from 'react'
import { useInView, useMotionValue, useSpring, type SpringOptions } from 'framer-motion'

import { cn } from './utils'

export interface NumberTickerProps {
  value: number
  startValue?: number
  direction?: 'up' | 'down'
  delay?: number
  className?: string
  decimalPlaces?: number
  spring?: SpringOptions
  format?: (value: number) => string
}

const defaultSpring: SpringOptions = {
  damping: 60,
  stiffness: 100,
}

/**
 * NumberTicker — Magic UI inspired animated counter that snaps from
 * `startValue` to `value` once the element scrolls into view. Used for
 * KPIs in the Dashboard and Metrics on the marketing site.
 */
export function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  spring = defaultSpring,
  format,
}: NumberTickerProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null)
  const motion = useMotionValue(direction === 'down' ? value : startValue)
  const springed = useSpring(motion, spring)
  const isInView = useInView(ref, { once: true, margin: '0px' })

  React.useEffect(() => {
    if (!isInView) return
    const timer = setTimeout(() => {
      motion.set(direction === 'down' ? startValue : value)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [motion, isInView, delay, value, startValue, direction])

  React.useEffect(() => {
    return springed.on('change', (latest) => {
      if (!ref.current) return
      const formatted = format
        ? format(latest)
        : Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)))
      ref.current.textContent = formatted
    })
  }, [springed, decimalPlaces, format])

  return (
    <span
      ref={ref}
      className={cn(
        'font-display text-text-primary inline-block tabular-nums tracking-tight',
        className,
      )}
    >
      {format
        ? format(direction === 'down' ? value : startValue)
        : Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(direction === 'down' ? value : startValue)}
    </span>
  )
}

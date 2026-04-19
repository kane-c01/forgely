'use client'

import * as React from 'react'

import { cn } from './utils'

export interface InfiniteMovingCardsItem {
  quote: string
  name: string
  title?: string
}

export interface InfiniteMovingCardsProps {
  items: InfiniteMovingCardsItem[]
  direction?: 'left' | 'right'
  speed?: 'fast' | 'normal' | 'slow'
  pauseOnHover?: boolean
  className?: string
}

const speedMap = { fast: 20, normal: 40, slow: 80 } as const

/**
 * InfiniteMovingCards — Aceternity inspired endless quote strip used for
 * Testimonials. Duplicates content once and animates X by `-50%` to keep
 * the loop seamless.
 */
export function InfiniteMovingCards({
  items,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  return (
    <div
      className={cn(
        'group relative z-10 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]',
        className,
      )}
      style={
        {
          ['--marquee-duration' as string]: `${speedMap[speed]}s`,
          ['--marquee-direction' as string]: direction === 'left' ? 'normal' : 'reverse',
        } as React.CSSProperties
      }
    >
      <ul
        className={cn(
          'flex min-w-full shrink-0 flex-nowrap gap-4',
          'animate-[marquee_var(--marquee-duration)_linear_infinite]',
          '[animation-direction:var(--marquee-direction)]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
      >
        {[...items, ...items].map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="border-border-subtle bg-bg-elevated shadow-elevated w-[320px] shrink-0 rounded-xl border p-5 md:w-[420px]"
          >
            <p className="font-heading text-body text-text-primary leading-relaxed">
              "{item.quote}"
            </p>
            <footer className="mt-4 flex flex-col">
              <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
                {item.name}
              </span>
              {item.title && <span className="text-small text-text-secondary">{item.title}</span>}
            </footer>
          </li>
        ))}
      </ul>
    </div>
  )
}

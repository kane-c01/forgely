'use client'

import * as React from 'react'

import { cn } from './utils'

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean
  reverse?: boolean
  vertical?: boolean
  repeat?: number
  duration?: number
}

/**
 * Marquee — Magic UI inspired infinite scroll strip used for logo bars,
 * client moving cards and the Pricing trust row. Pure CSS animation so it
 * stays cheap on the GPU.
 */
export function Marquee({
  className,
  pauseOnHover = false,
  reverse = false,
  vertical = false,
  repeat = 2,
  duration = 30,
  children,
  style,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      style={{
        ...style,
        ['--marquee-duration' as string]: `${duration}s`,
      }}
      className={cn(
        'group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex shrink-0 [gap:var(--gap)]',
            vertical ? 'flex-col' : 'flex-row',
            vertical
              ? 'animate-[marquee-vertical_var(--marquee-duration)_linear_infinite]'
              : 'animate-[marquee_var(--marquee-duration)_linear_infinite]',
            reverse && '[animation-direction:reverse]',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
          aria-hidden={i > 0}
        >
          {children}
        </div>
      ))}
    </div>
  )
}

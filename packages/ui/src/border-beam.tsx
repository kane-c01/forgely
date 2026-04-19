import * as React from 'react'

import { cn } from './utils'

export interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
}

/**
 * BorderBeam — Magic UI / Aceternity hybrid: an animated conic gradient
 * that orbits the parent's border. Wrap inside any `position: relative`
 * container (e.g. {@link Card}). Defaults use Forge Orange + Forge Gold.
 */
export function BorderBeam({
  className,
  size = 220,
  duration = 14,
  delay = 0,
  colorFrom = '#FF6B1A',
  colorTo = '#FFD166',
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          ['--size' as string]: size,
          ['--duration' as string]: `${duration}s`,
          ['--delay' as string]: `${-delay}s`,
          ['--color-from' as string]: colorFrom,
          ['--color-to' as string]: colorTo,
        } as React.CSSProperties
      }
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] [border:1px_solid_transparent]',
        '![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(black,black)]',
        'after:absolute after:aspect-square after:w-[calc(var(--size)*1px)]',
        'after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]',
        'after:[offset-anchor:90%_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]',
        'after:[animation:border-beam_calc(var(--duration))_infinite_linear]',
        className,
      )}
    />
  )
}

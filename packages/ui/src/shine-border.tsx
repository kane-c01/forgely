import * as React from 'react'

import { cn } from './utils'

export interface ShineBorderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  borderRadius?: number
  borderWidth?: number
  duration?: number
  color?: string | string[]
}

/**
 * ShineBorder — Magic UI inspired animated gradient border effect.
 * Renders a wrapper that draws an animated gradient ring around its
 * children using a CSS conic gradient and the `mask` trick.
 */
export function ShineBorder({
  borderRadius = 14,
  borderWidth = 1,
  duration = 14,
  color = ['#FF6B1A', '#FFD166', '#00D9FF'],
  className,
  style,
  children,
  ...props
}: ShineBorderProps) {
  const colorList = Array.isArray(color) ? color : [color]
  return (
    <div
      style={
        {
          ...style,
          ['--border-radius' as string]: `${borderRadius}px`,
          ['--border-width' as string]: `${borderWidth}px`,
          ['--duration' as string]: `${duration}s`,
          ['--shine-pulse-duration' as string]: `${duration}s`,
          ['--mask-linear-gradient' as string]:
            'linear-gradient(#0000 calc(var(--border-width)) , #000 0)',
          ['--background-radial-gradient' as string]: `radial-gradient(transparent,transparent, ${colorList.join(',')},transparent,transparent)`,
        } as React.CSSProperties
      }
      className={cn(
        'bg-bg-elevated text-text-primary relative grid min-h-[60px] w-full place-items-center rounded-[--border-radius] p-3',
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full rounded-[--border-radius] [background-image:var(--background-radial-gradient)] [background-size:300%_300%] [mask:var(--mask-linear-gradient)] motion-safe:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]"
      />
      <div className="relative w-full">{children}</div>
    </div>
  )
}

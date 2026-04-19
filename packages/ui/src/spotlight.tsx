'use client'

import * as React from 'react'

import { cn } from './utils'

export interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Hex / rgba color of the spotlight glow. Defaults to Forge Orange.
   */
  color?: string
  /**
   * If true, the spotlight follows the pointer; otherwise it drifts on a
   * slow ambient loop (the Aceternity default).
   */
  followPointer?: boolean
}

/**
 * Spotlight — Aceternity inspired ambient glow used behind the Hero block.
 * Pure CSS gradient, no canvas required, so safe inside Server Components
 * once children are client-side.
 */
export function Spotlight({
  color = '#FF6B1A',
  followPointer = false,
  className,
  style,
  children,
  ...props
}: SpotlightProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = React.useState({ x: 50, y: 30 })

  React.useEffect(() => {
    if (!followPointer || !ref.current) return
    const el = ref.current
    const handler = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      setCoords({
        x: ((ev.clientX - rect.left) / rect.width) * 100,
        y: ((ev.clientY - rect.top) / rect.height) * 100,
      })
    }
    el.addEventListener('pointermove', handler)
    return () => el.removeEventListener('pointermove', handler)
  }, [followPointer])

  return (
    <div
      ref={ref}
      style={
        {
          ...style,
          ['--spot-color' as string]: color,
          ['--spot-x' as string]: `${coords.x}%`,
          ['--spot-y' as string]: `${coords.y}%`,
        } as React.CSSProperties
      }
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0',
          'bg-[radial-gradient(circle_400px_at_var(--spot-x)_var(--spot-y),var(--spot-color),transparent_60%)]',
          'duration-medium ease-emphasized opacity-30 mix-blend-screen transition-[background-position]',
          !followPointer && 'motion-safe:animate-[spotlight-drift_18s_ease-in-out_infinite]',
        )}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

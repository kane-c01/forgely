'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from './utils'

export interface CanvasRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Hex color of the dotted reveal grid. Defaults to Forge Orange.
   */
  color?: string
  dotSize?: number
  dotSpacing?: number
}

/**
 * CanvasReveal — Aceternity inspired pixelated grid that fades in on
 * hover. Pure CSS / SVG implementation — no canvas — so it works inside
 * server components once the parent renders client-side.
 */
export function CanvasReveal({
  color = '#FF6B1A',
  dotSize = 2,
  dotSpacing = 12,
  className,
  children,
  ...props
}: CanvasRevealProps) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'border-border-strong bg-bg-elevated group relative overflow-hidden rounded-xl border',
        className,
      )}
      {...props}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(${color} ${dotSize}px, transparent ${dotSize + 0.5}px)`,
              backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
              maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

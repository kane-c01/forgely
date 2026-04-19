'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from './utils'

export interface AnimatedBeamProps {
  className?: string
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  curvature?: number
  reverse?: boolean
  duration?: number
  delay?: number
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

/**
 * AnimatedBeam — Magic UI inspired SVG arc connecting two refs. Used for
 * the AI Copilot connection diagram and the "n agents" hero animation.
 */
export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 4,
  delay = 0,
  pathColor = '#1F1F28',
  pathWidth = 2,
  pathOpacity = 0.6,
  gradientStartColor = '#FF6B1A',
  gradientStopColor = '#FFD166',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const id = React.useId()
  const [pathD, setPathD] = React.useState('')
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const update = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return
      const c = containerRef.current.getBoundingClientRect()
      const a = fromRef.current.getBoundingClientRect()
      const b = toRef.current.getBoundingClientRect()
      const w = c.width
      const h = c.height
      const startX = a.left - c.left + a.width / 2 + startXOffset
      const startY = a.top - c.top + a.height / 2 + startYOffset
      const endX = b.left - c.left + b.width / 2 + endXOffset
      const endY = b.top - c.top + b.height / 2 + endYOffset
      const controlY = startY - curvature
      setSize({ width: w, height: h })
      setPathD(`M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`)
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset])

  return (
    <svg
      fill="none"
      width={size.width}
      height={size.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none absolute left-0 top-0 transform-gpu stroke-2', className)}
      viewBox={`0 0 ${size.width} ${size.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: '0%',
            x2: '0%',
            y1: '0%',
            y2: '0%',
          }}
          animate={{
            x1: reverse ? ['90%', '-10%'] : ['10%', '110%'],
            x2: reverse ? ['100%', '0%'] : ['0%', '100%'],
            y1: ['0%', '0%'],
            y2: ['0%', '0%'],
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  )
}

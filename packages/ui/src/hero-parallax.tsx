'use client'

import * as React from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'

import { cn } from './utils'

export interface HeroParallaxItem {
  title: string
  thumbnail: string
  link?: string
}

export interface HeroParallaxProps {
  items: HeroParallaxItem[]
  className?: string
  headline?: React.ReactNode
  subline?: React.ReactNode
}

/**
 * HeroParallax — Aceternity inspired three-row marquee that drifts during
 * scroll. Designed for the marketing site Showcase block.
 */
export function HeroParallax({ items, className, headline, subline }: HeroParallaxProps) {
  const firstRow = items.slice(0, Math.ceil(items.length / 3))
  const secondRow = items.slice(Math.ceil(items.length / 3), Math.ceil((items.length / 3) * 2))
  const thirdRow = items.slice(Math.ceil((items.length / 3) * 2))

  const ref = React.useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const springCfg = { stiffness: 300, damping: 30, bounce: 100 }
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springCfg)
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), springCfg)
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springCfg)
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springCfg)
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springCfg)
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), springCfg)

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-[300vh] flex-col self-auto overflow-hidden py-40 antialiased [perspective:1000px] [transform-style:preserve-3d]',
        className,
      )}
    >
      <header className="mx-auto w-full max-w-7xl px-4 py-20 md:py-32">
        {headline ?? (
          <h2 className="font-display text-hero-mega text-text-primary leading-none">
            Forge cinematic <br /> brand sites.
          </h2>
        )}
        {subline && <p className="text-body text-text-secondary mt-6 max-w-2xl">{subline}</p>}
      </header>
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
      >
        <ParallaxRow items={firstRow} translate={translateX} />
        <ParallaxRow items={secondRow} translate={translateXReverse} className="mt-10" />
        <ParallaxRow items={thirdRow} translate={translateX} className="mt-10" />
      </motion.div>
    </div>
  )
}

interface ParallaxRowProps {
  items: HeroParallaxItem[]
  translate: MotionValue<number>
  className?: string
}

function ParallaxRow({ items, translate, className }: ParallaxRowProps) {
  return (
    <motion.div className={cn('flex flex-row-reverse space-x-4 space-x-reverse', className)}>
      {items.map((item) => (
        <motion.a
          key={item.title}
          href={item.link ?? '#'}
          style={{ x: translate }}
          whileHover={{ y: -16 }}
          className="group/parallax border-border-strong bg-bg-elevated relative h-72 w-[20rem] shrink-0 overflow-hidden rounded-xl border"
        >
          <img
            src={item.thumbnail}
            alt={item.title}
            className="duration-medium ease-emphasized absolute inset-0 h-full w-full object-cover object-center transition-transform group-hover/parallax:scale-105"
          />
          <div
            aria-hidden
            className="from-bg-void/80 absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity group-hover/parallax:opacity-100"
          />
          <p className="font-heading text-small text-text-primary absolute bottom-3 left-3 right-3 font-medium opacity-0 transition-opacity group-hover/parallax:opacity-100">
            {item.title}
          </p>
        </motion.a>
      ))}
    </motion.div>
  )
}

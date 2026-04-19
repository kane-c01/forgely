'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export interface ShowcaseItem {
  id: string
  brand: string
  category: string
  dna: string
  moment: string
  href?: string
  /** Tailwind background classes for the static fallback (used while
   *  the video is loading or when reduced-motion is set). */
  gradient: string
  /** Static poster shown until the user hovers / focuses the card. */
  poster: string
  /** MP4 / WebM source — replaced with real Kling renders later. */
  videoSrc: string
}

interface ShowcaseGridProps {
  items: ShowcaseItem[]
  className?: string
  heading?: React.ReactNode
  description?: React.ReactNode
  ctaHref?: string
  ctaLabel?: string
}

/**
 * Cinematic showcase grid — hover (or focus) a card to play its
 * Product Moment loop. Replaces the gradient-only T07 `<Showcase>`
 * placeholder once the T27 PR chain merges.
 *
 * Design notes
 * - Videos are loaded `preload="none"`; only when the user expresses
 *   interest do we kick off the network request. Keeps Lighthouse
 *   happy on the marketing homepage.
 * - We listen to BOTH pointer + focus so keyboard users get parity.
 * - Reduced-motion users see only the poster + gradient.
 */
export function ShowcaseGrid({
  items,
  className,
  heading,
  description,
  ctaHref = '#waitlist',
  ctaLabel = 'Forge yours',
}: ShowcaseGridProps) {
  return (
    <section
      id="showcase-cinematic"
      aria-labelledby="showcase-cinematic-title"
      className={cn('border-border-subtle border-y py-24 lg:py-32', className)}
    >
      <div className="container-page flex flex-col gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
              Showcase
            </span>
            <h2
              id="showcase-cinematic-title"
              className="font-display text-h1 text-text-primary mt-4 font-light"
            >
              {heading ?? '100 looks. One brand at a time.'}
            </h2>
            {description ? (
              <p className="text-body-lg text-text-secondary mt-4">{description}</p>
            ) : (
              <p className="text-body-lg text-text-secondary mt-4">
                10 Visual DNAs &times; 10 Product Moments. Hover any card to preview the cinematic
                loop generated for that brand.
              </p>
            )}
          </div>
          <Link
            href={ctaHref}
            className="border-border-strong text-small text-text-secondary hover:border-forge-orange/60 hover:text-forge-orange inline-flex items-center gap-1.5 self-start rounded-full border px-4 py-2 transition"
          >
            {ctaLabel}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="contents">
              <ShowcaseCard item={item} />
            </li>
          ))}
        </ul>

        <p className="text-caption text-text-muted text-center font-mono uppercase tracking-[0.22em]">
          Cinematic previews · Pexels CC0 placeholders · real Kling-rendered loops ship with private
          beta.
        </p>
      </div>
    </section>
  )
}

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduced) return
    if (active) {
      void video.play().catch(() => {
        /* autoplay blocked; poster keeps showing */
      })
    } else {
      video.pause()
      try {
        video.currentTime = 0
      } catch {
        /* some browsers throw before metadata loads */
      }
    }
  }, [active, reduced])

  const cardContent = (
    <article
      className={cn(
        'border-border-strong bg-bg-deep group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border p-6 transition',
        'hover:border-forge-orange/40 focus-within:border-forge-orange/60',
      )}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <div
        aria-hidden="true"
        className={cn(
          'duration-cinematic absolute inset-0 -z-20 bg-gradient-to-br opacity-90 transition',
          item.gradient,
        )}
      />
      {!reduced ? (
        <video
          ref={videoRef}
          aria-hidden="true"
          className={cn(
            'duration-medium ease-standard absolute inset-0 -z-10 h-full w-full object-cover transition-opacity',
            active ? 'opacity-100' : 'opacity-0',
          )}
          poster={item.poster}
          muted
          loop
          playsInline
          preload="none"
        >
          <source src={item.videoSrc} type="video/mp4" />
        </video>
      ) : null}
      <div
        aria-hidden="true"
        className="from-bg-void via-bg-void/40 absolute inset-0 -z-10 bg-gradient-to-t to-transparent"
      />

      <div className="flex items-start justify-between">
        <Badge tone="default">{item.dna}</Badge>
        <Badge tone="forge">{item.moment}</Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-h2 text-text-primary font-light">{item.brand}</h3>
        <p className="text-caption text-text-secondary font-mono uppercase tracking-[0.2em]">
          {item.category}
        </p>
      </div>
    </article>
  )

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="focus-visible:ring-forge-orange focus-visible:ring-offset-bg-void block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {cardContent}
      </Link>
    )
  }
  return cardContent
}

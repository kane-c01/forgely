'use client'

import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'

export interface LenisProviderProps {
  children: ReactNode
  /**
   * Override the default Lenis options. Defaults are tuned for the
   * Cinematic Industrial cadence: slow ramp-in, restrained inertia.
   */
  options?: ConstructorParameters<typeof Lenis>[0]
}

/**
 * Initialise smooth scrolling for the segment it wraps.
 *
 * - Honours `prefers-reduced-motion` automatically (Lenis falls back to
 *   the native scroll when the media query matches).
 * - Tears down the rAF loop + DOM listeners on unmount so SPA route
 *   changes don't leak.
 *
 * IMPORTANT: keep this OUT of the root layout for now — the marketing
 * homepage is a single static document and adding Lenis there changes
 * the scroll feel for the entire site. We layer it on per-segment
 * (e.g. `/the-forge`) until the T27 hero/scroll-acts upgrade lands.
 */
export function LenisProvider({ children, options }: LenisProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      ...options,
    })

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [options])

  return <>{children}</>
}

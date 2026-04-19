'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HeroBackdrop, type HeroBackdropProps } from './hero-backdrop'
import { cn } from '@/lib/cn'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export interface ScrollAct {
  id: string
  /** 1-based act number, used for the eyebrow label. */
  index: number
  eyebrow: string
  title: ReactNode
  body: ReactNode
  /**
   * Tailwind background classes applied to the act backdrop. Always
   * required: it is the lightweight fallback we render when the
   * cinematic `backdrop` (video / 3D) is unavailable or while it
   * is loading. The component cross-fades between consecutive acts
   * as the user scrolls.
   */
  backdropClass: string
  /**
   * Optional cinematic backdrop. Layers on top of `backdropClass`:
   *   - `video`: AV1/MP4 loop with parallax + visibility autoplay.
   *   - `3d`   : lazy-loaded R3F scene.
   * Omit the field to keep the static gradient (T27a behaviour).
   */
  backdrop?: HeroBackdropProps
  /** Optional accent label rendered top-right (e.g. "Scrape", "Direct"). */
  accent?: string
}

interface ScrollActsProps {
  acts: ScrollAct[]
  className?: string
  /** When provided, replaces the default counter (e.g. "01 / 06"). */
  renderCounter?: (active: number, total: number) => ReactNode
}

/**
 * The Forge Reel — a 6-act cinematic scroll narrative.
 *
 * Implementation notes:
 * - Container is `acts.length * 100vh` tall so each act gets its own
 *   ScrollTrigger range without absolute positioning maths.
 * - The visual layer is `position: sticky; top: 0; height: 100vh`, so
 *   the background and overlay re-paint while the user scrolls without
 *   creating a new compositing layer per act.
 * - `prefers-reduced-motion` users get the static last-frame view of
 *   each act, no GSAP timelines.
 *
 * T27a ships the structure. T27b adds the R3F hero scene as the act 1
 * backdrop and Kling-rendered video bridges between acts. T27c polishes
 * showcase, interactive demo and testimonials.
 */
export function ScrollActs({ acts, className, renderCounter }: ScrollActsProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const total = acts.length

  useEffect(() => {
    if (typeof window === 'undefined' || acts.length === 0) return
    const root = rootRef.current
    if (!root) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const actEls = gsap.utils.toArray<HTMLElement>('[data-act]')
      const backdrops = gsap.utils.toArray<HTMLElement>('[data-act-backdrop]')

      gsap.set(actEls, { opacity: 0, yPercent: 4 })
      gsap.set(backdrops, { opacity: 0 })
      const firstAct = actEls[0]
      const firstBackdrop = backdrops[0]
      if (firstAct) gsap.set(firstAct, { opacity: 1, yPercent: 0 })
      if (firstBackdrop) gsap.set(firstBackdrop, { opacity: 1 })

      if (reduceMotion) {
        gsap.set(actEls, { opacity: 1, yPercent: 0 })
        gsap.set(backdrops, { opacity: 1 })
        return
      }

      actEls.forEach((el, i) => {
        const backdrop = backdrops[i]
        const nextBackdrop = backdrops[i + 1]

        ScrollTrigger.create({
          trigger: el,
          start: 'top 70%',
          end: 'bottom 30%',
          onEnter: () => {
            gsap.to(el, { opacity: 1, yPercent: 0, duration: 0.7, ease: 'power2.out' })
            if (backdrop) gsap.to(backdrop, { opacity: 1, duration: 0.9, ease: 'power2.out' })
            if (counterRef.current) counterRef.current.textContent = String(i + 1).padStart(2, '0')
          },
          onLeaveBack: () => {
            gsap.to(el, { opacity: 0, yPercent: 4, duration: 0.5, ease: 'power2.in' })
            if (backdrop && i > 0) {
              gsap.to(backdrop, { opacity: 0, duration: 0.6, ease: 'power2.in' })
            }
          },
        })

        if (nextBackdrop && backdrop) {
          ScrollTrigger.create({
            trigger: el,
            start: 'bottom 60%',
            end: 'bottom 20%',
            scrub: true,
            onUpdate: (st) => {
              gsap.set(nextBackdrop, { opacity: st.progress })
              gsap.set(backdrop, { opacity: 1 - st.progress * 0.85 })
            },
          })
        }
      })
    }, root)

    return () => ctx.revert()
  }, [acts.length])

  return (
    <section
      ref={rootRef}
      aria-label="The Forge — six-act scroll narrative"
      className={cn('relative w-full', className)}
      style={{ height: `${acts.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {acts.map((act, i) => (
          <div
            key={`bg-${act.id}`}
            data-act-backdrop
            aria-hidden="true"
            className="duration-cinematic ease-standard absolute inset-0 transition-opacity"
            style={{ zIndex: i }}
          >
            <div className={cn('absolute inset-0', act.backdropClass)} />
            {act.backdrop ? <HeroBackdrop {...act.backdrop} /> : null}
          </div>
        ))}

        <div className="from-bg-void/30 to-bg-void/80 absolute inset-0 bg-gradient-to-b via-transparent" />

        <div className="relative z-50 flex h-full items-center">
          <div className="container-page grid w-full grid-cols-12 gap-6">
            <header className="text-caption text-text-muted col-span-12 mb-6 flex items-center justify-between font-mono uppercase tracking-[0.24em]">
              <span>The Forge — six-act reel</span>
              <span className="text-text-secondary">
                {renderCounter ? (
                  renderCounter(1, total)
                ) : (
                  <>
                    <span ref={counterRef}>01</span> / {String(total).padStart(2, '0')}
                  </>
                )}
              </span>
            </header>

            <div className="relative col-span-12 grid grid-cols-12 gap-6">
              {acts.map((act) => (
                <article
                  key={act.id}
                  data-act
                  className="col-span-12 col-start-1 row-start-1 flex flex-col gap-6 lg:col-span-8 lg:col-start-1"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.24em]">
                      Act {String(act.index).padStart(2, '0')}
                    </span>
                    {act.accent ? (
                      <span className="border-border-strong text-caption text-text-secondary rounded-full border px-3 py-1 font-mono uppercase tracking-[0.18em]">
                        {act.accent}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="font-display text-display text-text-primary font-light leading-[1.02] tracking-tight">
                    {act.title}
                  </h2>
                  <p className="text-body-lg text-text-secondary max-w-2xl">{act.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

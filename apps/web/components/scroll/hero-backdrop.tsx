'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { cn } from '@/lib/cn'

export interface VideoSource {
  src: string
  type: 'video/mp4' | 'video/webm' | 'video/x-matroska'
}

export interface HeroBackdropVideoProps {
  type: 'video'
  /** Multiple <source> entries — provide AV1/H.265/H.264 fallbacks. */
  sources: VideoSource[]
  /** Static poster shown before the video buffers (also used by reduced-motion users). */
  poster: string
  /** Lighten/darken the video by overlaying a tint. Use Tailwind classes. */
  overlayClass?: string
  /** Subtle parallax shift, in pixels, applied via CSS variable. */
  parallaxPx?: number
}

export interface HeroBackdropStaticProps {
  type: 'static'
  /** Tailwind classes for the static gradient backdrop (T27a default). */
  className: string
}

export interface HeroBackdrop3DProps {
  type: '3d'
  /**
   * Lazy-load the heavy R3F module on demand. Caller passes a render
   * function so we can `next/dynamic` it out of the bundle until the
   * 3D scene is actually needed (planned for a later T27 PR).
   */
  render: () => React.ReactNode
}

export type HeroBackdropProps =
  | HeroBackdropVideoProps
  | HeroBackdropStaticProps
  | HeroBackdrop3DProps

/**
 * Cinematic backdrop slot used by `<ScrollActs>` (and any standalone
 * hero section). Three orthogonal modes:
 *
 *   1. `static` — Tailwind gradient (T27a default, zero JS / zero bytes).
 *   2. `video`  — predecoded MP4 / WebM loop (T27b default for marketing).
 *   3. `3d`     — lazy-loaded React Three Fiber scene (T27b'/T27c).
 *
 * Implementation notes
 * - Videos are `muted + playsInline + autoplay + loop` so iOS/Safari
 *   don't block playback. We honour `prefers-reduced-motion` by pausing
 *   the video and showing the poster only.
 * - When the backdrop scrolls out of the viewport we pause the video to
 *   save battery / bandwidth. An IntersectionObserver toggles play/pause.
 * - Parallax is a single `transform: translate3d(0, var(--parallax)…)`
 *   which is GPU-composited and avoids re-layout.
 */
export function HeroBackdrop(props: HeroBackdropProps) {
  if (props.type === 'static') return <StaticBackdrop className={props.className} />
  if (props.type === '3d') return <RemoteBackdrop render={props.render} />
  return <VideoBackdrop {...props} />
}

function StaticBackdrop({ className }: { className: string }) {
  return <div aria-hidden="true" className={cn('absolute inset-0', className)} />
}

function RemoteBackdrop({ render }: { render: () => React.ReactNode }) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {render()}
    </div>
  )
}

function VideoBackdrop({ sources, poster, overlayClass, parallaxPx = 0 }: HeroBackdropVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const video = videoRef.current
    if (!video) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      video.pause()
      video.removeAttribute('autoplay')
      return
    }

    let mounted = true
    const observer = new IntersectionObserver(
      (entries) => {
        if (!mounted) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void video.play().catch(() => {
              /* autoplay blocked — poster will keep showing */
            })
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.05 },
    )

    if (wrapperRef.current) observer.observe(wrapperRef.current)

    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || parallaxPx === 0) return
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = wrapper.getBoundingClientRect()
        const progress = rect.top / window.innerHeight
        const offset = -progress * parallaxPx
        wrapper.style.setProperty('--parallax', `${offset.toFixed(2)}px`)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [parallaxPx])

  const wrapperStyle: CSSProperties = {
    transform: parallaxPx ? 'translate3d(0, var(--parallax, 0px), 0)' : undefined,
    willChange: parallaxPx ? 'transform' : undefined,
  }

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={wrapperStyle}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        aria-hidden="true"
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      {overlayClass ? (
        <div
          aria-hidden="true"
          className={cn('pointer-events-none absolute inset-0', overlayClass)}
        />
      ) : null}
    </div>
  )
}

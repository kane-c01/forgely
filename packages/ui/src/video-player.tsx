'use client'

import * as React from 'react'
import { Play, Pause, Maximize, Volume2, VolumeX, Settings } from 'lucide-react'

import { cn } from './utils'

export interface VideoSource {
  src: string
  /** Resolution label (e.g. "1080p", "720p", "480p"). */
  label: string
  /** Width in pixels — used for auto quality selection. */
  width: number
}

export interface VideoPlayerProps {
  /** Array of video sources sorted by quality (highest first). */
  sources: VideoSource[]
  /** Poster image URL. */
  poster?: string
  /** Auto-play when in view. */
  autoPlay?: boolean
  /** Loop playback. */
  loop?: boolean
  /** Start muted. */
  muted?: boolean
  className?: string
}

/**
 * VideoPlayer — multi-resolution `<video>` wrapper with quality
 * picker, auto quality selection based on viewport width, and
 * minimal cinematic controls.
 */
export const VideoPlayer = React.forwardRef<HTMLDivElement, VideoPlayerProps>(function VideoPlayer(
  { sources, poster, autoPlay = false, loop = false, muted: mutedProp = false, className },
  ref,
) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(mutedProp)
  const [progress, setProgress] = React.useState(0)
  const [showQuality, setShowQuality] = React.useState(false)

  const pickAutoSource = React.useCallback((): VideoSource => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
    const sorted = [...sources].sort((a, b) => a.width - b.width)
    const match = sorted.find((s) => s.width >= vw) ?? sorted[sorted.length - 1]
    return match ?? { src: '', label: '', width: 0 }
  }, [sources])

  const [currentSource, setCurrentSource] = React.useState<VideoSource>(
    () => sources[0] ?? { src: '', label: '', width: 0 },
  )

  React.useEffect(() => {
    setCurrentSource(pickAutoSource())
  }, [pickAutoSource])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    v.currentTime = ratio * v.duration
  }

  const switchQuality = (source: VideoSource) => {
    const v = videoRef.current
    const time = v?.currentTime ?? 0
    const wasPlaying = v ? !v.paused : false
    setCurrentSource(source)
    setShowQuality(false)
    requestAnimationFrame(() => {
      const vid = videoRef.current
      if (!vid) return
      vid.currentTime = time
      if (wasPlaying) vid.play()
    })
  }

  const goFullscreen = () => {
    videoRef.current?.requestFullscreen?.()
  }

  return (
    <div ref={ref} className={cn('group relative overflow-hidden rounded-xl bg-black', className)}>
      <video
        ref={videoRef}
        key={currentSource.src}
        src={currentSource.src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
        className="h-full w-full cursor-pointer object-contain"
      />

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={progress}
          onClick={seek}
          className="mb-2 h-1 cursor-pointer overflow-hidden rounded-full bg-white/20"
        >
          <div
            className="bg-forge-orange h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={togglePlay} className="text-white/90 hover:text-white">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button type="button" onClick={toggleMute} className="text-white/90 hover:text-white">
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <div className="flex-1" />

          {/* Quality picker */}
          {sources.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuality((p) => !p)}
                className="flex items-center gap-1 text-xs text-white/90 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                {currentSource.label}
              </button>
              {showQuality && (
                <div className="bg-bg-elevated border-border-strong absolute bottom-8 right-0 rounded-lg border py-1 shadow-lg">
                  {sources.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => switchQuality(s)}
                      className={cn(
                        'block w-full px-3 py-1 text-left text-xs transition-colors',
                        s.label === currentSource.label
                          ? 'text-forge-orange'
                          : 'text-text-primary hover:bg-bg-surface',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" onClick={goFullscreen} className="text-white/90 hover:text-white">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
})

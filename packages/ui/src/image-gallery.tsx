'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from './utils'

export interface GalleryImage {
  src: string
  alt?: string
  /** Optional thumbnail (falls back to `src`). */
  thumbnail?: string
}

export interface ImageGalleryProps {
  images: GalleryImage[]
  /** Number of columns in the grid. */
  columns?: 2 | 3 | 4
  /** Aspect ratio for thumbnails. */
  aspect?: 'square' | '4/3' | '16/9'
  className?: string
}

/**
 * ImageGallery — responsive grid with lightbox overlay and thumbnail
 * strip navigation. Keyboard-accessible (Esc/arrows).
 */
export const ImageGallery = React.forwardRef<HTMLDivElement, ImageGalleryProps>(
  function ImageGallery({ images, columns = 3, aspect = '4/3', className }, ref) {
    const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null)

    const open = (idx: number) => setLightboxIdx(idx)
    const close = () => setLightboxIdx(null)
    const prev = () =>
      setLightboxIdx((i) => (i !== null ? (i - 1 + images.length) % images.length : null))
    const next = () => setLightboxIdx((i) => (i !== null ? (i + 1) % images.length : null))

    React.useEffect(() => {
      if (lightboxIdx === null) return
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close()
        else if (e.key === 'ArrowLeft') prev()
        else if (e.key === 'ArrowRight') next()
      }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    })

    const colsClass = {
      2: 'grid-cols-2',
      3: 'grid-cols-2 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    }[columns]

    const aspectClass = {
      square: 'aspect-square',
      '4/3': 'aspect-[4/3]',
      '16/9': 'aspect-video',
    }[aspect]

    return (
      <>
        {/* Grid */}
        <div ref={ref} className={cn('grid gap-2', colsClass, className)}>
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => open(i)}
              className={cn(
                'border-border-strong group relative overflow-hidden rounded-lg border',
                aspectClass,
              )}
            >
              <img
                src={img.thumbnail ?? img.src}
                alt={img.alt ?? ''}
                className="duration-medium ease-emphasized h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIdx !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90"
              onClick={close}
            >
              {/* Controls */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  close()
                }}
                className="absolute right-4 top-4 text-white/70 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <ChevronRight className="h-8 w-8" />
              </button>

              {/* Main image */}
              <motion.img
                key={lightboxIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                src={images[lightboxIdx]?.src}
                alt={images[lightboxIdx]?.alt ?? ''}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[75vh] max-w-[90vw] rounded-lg object-contain"
              />

              {/* Thumbnail strip */}
              <div
                className="mt-4 flex gap-2 overflow-x-auto px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setLightboxIdx(i)}
                    className={cn(
                      'h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all',
                      i === lightboxIdx
                        ? 'border-forge-orange scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100',
                    )}
                  >
                    <img
                      src={img.thumbnail ?? img.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  },
)

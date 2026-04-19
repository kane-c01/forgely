'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from './cn'

export interface SideDrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  width?: 'sm' | 'md' | 'lg'
  footer?: ReactNode
}

const WIDTH: Record<NonNullable<SideDrawerProps['width']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * Plain-React right-side drawer (no headless-ui yet). Esc + backdrop close.
 * Locks body scroll while open.
 */
export function SideDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-opacity duration-200',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-bg-void/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'absolute right-0 top-0 flex h-full w-full flex-col border-l border-border-subtle bg-bg-deep shadow-2xl',
          WIDTH[width],
          'transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-start justify-between border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            {title && (
              <div className="font-mono text-caption uppercase tracking-[0.18em] text-text-secondary">
                {title}
              </div>
            )}
            {description && (
              <div className="mt-1 text-small text-text-muted">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-border-subtle px-5 py-3">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  )
}

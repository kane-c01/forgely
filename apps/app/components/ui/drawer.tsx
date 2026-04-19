'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  side?: 'right' | 'left'
  width?: string
  children: ReactNode
  ariaLabel?: string
}

export function Drawer({
  open,
  onClose,
  side = 'right',
  width = '420px',
  children,
  ariaLabel,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null
  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex"
    >
      <button
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-bg-void/70 backdrop-blur-sm transition-opacity duration-300"
      />
      <aside
        style={{ width }}
        className={cn(
          'relative ml-auto h-full overflow-y-auto border-border-subtle bg-bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_24px_48px_rgba(0,0,0,0.7)]',
          side === 'right' ? 'border-l animate-[slide-in-right_280ms_ease-out]' : 'mr-auto ml-0 border-r animate-[slide-in-left_280ms_ease-out]',
        )}
      >
        {children}
      </aside>
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(16px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-16px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </div>,
    document.body,
  )
}

export function DrawerHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface/95 px-5 py-4 backdrop-blur',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>
}

export function DrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-0 flex items-center justify-end gap-2 border-t border-border-subtle bg-bg-surface/95 px-5 py-3 backdrop-blur',
        className,
      )}
    >
      {children}
    </div>
  )
}

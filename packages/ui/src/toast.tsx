'use client'

import * as React from 'react'
import { Toaster as SonnerToaster, toast } from 'sonner'

/**
 * Toaster — Sonner-based toast surface themed for the Cinematic Industrial
 * dark palette. Mount once near the app root.
 */
export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast border border-border-strong bg-bg-elevated text-text-primary shadow-overlay',
          description: 'text-text-secondary',
          actionButton:
            'bg-forge-orange text-bg-void rounded-md px-2 py-1 text-caption font-medium',
          cancelButton: 'bg-bg-surface text-text-secondary rounded-md px-2 py-1 text-caption',
        },
      }}
      {...props}
    />
  )
}

export { toast }

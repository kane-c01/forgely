'use client'

import { useState } from 'react'

import { cn } from '@/lib/cn'

interface SwatchProps {
  label: string
  color: string
  large?: boolean
}

export function Swatch({ label, color, large }: SwatchProps) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(color)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard blocked — silently ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        'group flex flex-col gap-1.5 rounded-md border border-border-subtle bg-bg-deep p-2 text-left transition-colors hover:border-border-strong',
        large && 'col-span-2 sm:col-span-1',
      )}
    >
      <span
        className={cn(
          'rounded-md border border-bg-void/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
          large ? 'h-20' : 'h-12',
        )}
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="flex flex-col">
        <span className="text-small font-medium text-text-primary">{label}</span>
        <span className="font-mono text-caption uppercase tracking-[0.08em] text-text-muted">
          {copied ? 'copied!' : color}
        </span>
      </span>
    </button>
  )
}

'use client'

import { useState } from 'react'

import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'

interface SwatchProps {
  label: string
  color: string
  large?: boolean
}

export function Swatch({ label, color, large }: SwatchProps) {
  const t = useT()
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
        'border-border-subtle bg-bg-deep hover:border-border-strong group flex flex-col gap-1.5 rounded-md border p-2 text-left transition-colors',
        large && 'col-span-2 sm:col-span-1',
      )}
    >
      <span
        className={cn(
          'border-bg-void/40 rounded-md border shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
          large ? 'h-20' : 'h-12',
        )}
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="flex flex-col">
        <span className="text-small text-text-primary font-medium">{label}</span>
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.08em]">
          {copied ? t.swatch.copied : color}
        </span>
      </span>
    </button>
  )
}

'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'

import { cn } from './utils'

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string
  language?: string
  filename?: string
  copyable?: boolean
}

/**
 * CodeBlock — read-only, copy-friendly code surface.
 * Used for AI prompts, JSON previews, generated SiteDSL, and CLI snippets.
 */
export function CodeBlock({
  code,
  language,
  filename,
  copyable = true,
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const onCopy = React.useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [code])

  return (
    <div
      className={cn(
        'border-border-subtle bg-bg-deep group relative overflow-hidden rounded-lg border',
        className,
      )}
      {...props}
    >
      {(filename || language) && (
        <header className="border-border-subtle bg-bg-elevated flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-caption text-text-secondary font-mono">{filename}</span>
            )}
            {language && (
              <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
                {language}
              </span>
            )}
          </div>
          {copyable && (
            <button
              type="button"
              onClick={onCopy}
              aria-label={copied ? 'Copied' : 'Copy code'}
              className="text-text-muted focus:ring-forge-orange rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2"
            >
              {copied ? (
                <Check className="text-success h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </header>
      )}
      <pre className="text-small text-text-primary overflow-x-auto p-4 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

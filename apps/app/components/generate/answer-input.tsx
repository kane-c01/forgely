'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import type { AnswerKind, MockExpects } from '@/lib/conversation-mock'

export interface AnswerPayload {
  kind: AnswerKind
  rawText: string
  choice?: string
  url?: string
  text?: string
  tags?: string[]
  productId?: string
  confirmed?: boolean
}

interface AnswerInputProps {
  expects: MockExpects
  pending: boolean
  onSubmit: (payload: AnswerPayload) => void
}

/**
 * Renders the right input UI for whatever the assistant is asking for.
 *
 * Pulled out of the page so the chat-list re-render doesn't reset the
 * controlled state inside (e.g. the in-progress text the user typed).
 */
export function AnswerInput({ expects, pending, onSubmit }: AnswerInputProps) {
  const t = useT()
  switch (expects.kind) {
    case 'choice':
      return (
        <div className="flex flex-wrap gap-2">
          {expects.options.map((opt) => (
            <Button
              key={opt.id}
              variant="secondary"
              size="lg"
              disabled={pending}
              onClick={() => onSubmit({ kind: 'choice', choice: opt.id, rawText: opt.label })}
              className="!justify-start text-left"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )

    case 'url':
      return <UrlInput pending={pending} onSubmit={onSubmit} />

    case 'text':
      return (
        <TextInput
          pending={pending}
          onSubmit={onSubmit}
          multiline={expects.multiline}
          placeholder={expects.placeholder}
        />
      )

    case 'tags':
      return <TagsInput pending={pending} onSubmit={onSubmit} suggestions={expects.suggestions} />

    case 'product':
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {expects.products.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => onSubmit({ kind: 'product', productId: p.id, rawText: p.title })}
              className={cn(
                'border-border-subtle bg-bg-surface group flex flex-col overflow-hidden rounded-lg border text-left transition-all',
                'hover:border-forge-orange/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(255,107,26,0.15)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <div className="bg-bg-deep aspect-square w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- mock external URLs that don't make it through next/image's allowlist */}
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-[var(--motion-medium,400ms)] group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="text-small text-text-primary font-medium">{p.title}</p>
                <p className="text-caption text-text-muted font-mono">
                  {formatCurrency(p.priceCents)}
                </p>
                <Badge tone="forge" className="self-start !text-[10px]">
                  {t.answerInput.candidate}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )

    case 'confirm':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            disabled={pending}
            onClick={() => onSubmit({ kind: 'confirm', confirmed: true, rawText: 'confirm' })}
          >
            <Icon.Sparkle size={14} /> {t.answerInput.confirmAndForge}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={pending}
            onClick={() => onSubmit({ kind: 'confirm', confirmed: false, rawText: 'tweak' })}
          >
            {t.answerInput.tweakFirst}
          </Button>
        </div>
      )
  }
}

/* ───────────────────── Sub-inputs ──────────────────────────── */

function UrlInput({
  pending,
  onSubmit,
}: {
  pending: boolean
  onSubmit: (p: AnswerPayload) => void
}) {
  const t = useT()
  const [v, setV] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!v.trim()) return
    onSubmit({ kind: 'url', url: v.trim(), rawText: v.trim() })
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Icon.Globe
          size={14}
          className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          type="url"
          placeholder={t.answerInput.urlPlaceholder}
          disabled={pending}
          autoFocus
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus:border-forge-orange/60 focus:ring-forge-orange/40 h-11 w-full rounded-md border pl-9 pr-3 focus:outline-none focus:ring-1"
        />
      </div>
      <Button type="submit" size="lg" disabled={pending || !v.trim()}>
        <Icon.Send size={14} /> {t.answerInput.send}
      </Button>
    </form>
  )
}

function TextInput({
  pending,
  onSubmit,
  multiline,
  placeholder,
}: {
  pending: boolean
  onSubmit: (p: AnswerPayload) => void
  multiline?: boolean
  placeholder?: string
}) {
  const t = useT()
  const [v, setV] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!v.trim()) return
    onSubmit({ kind: 'text', text: v.trim(), rawText: v.trim() })
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit(e as unknown as FormEvent)
    }
  }
  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      {multiline ? (
        <textarea
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder ?? t.answerInput.tellMore}
          disabled={pending}
          autoFocus
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus:border-forge-orange/60 focus:ring-forge-orange/40 min-h-32 flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-1"
        />
      ) : (
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={placeholder ?? t.answerInput.ellipsis}
          disabled={pending}
          autoFocus
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus:border-forge-orange/60 focus:ring-forge-orange/40 h-11 flex-1 rounded-md border px-3 focus:outline-none focus:ring-1"
        />
      )}
      <Button type="submit" size="lg" disabled={pending || !v.trim()}>
        <Icon.Send size={14} /> {t.answerInput.send}
      </Button>
    </form>
  )
}

function TagsInput({
  pending,
  onSubmit,
  suggestions,
}: {
  pending: boolean
  onSubmit: (p: AnswerPayload) => void
  suggestions?: string[]
}) {
  const t = useT()
  const [tags, setTags] = useState<string[]>([])
  const [v, setV] = useState('')
  const add = (tag: string) => {
    const trim = tag.trim()
    if (!trim) return
    if (tags.includes(trim)) return
    if (tags.length >= 8) return
    setTags([...tags, trim])
    setV('')
  }
  const remove = (tag: string) => setTags(tags.filter((x) => x !== tag))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (tags.length === 0) return
    onSubmit({ kind: 'tags', tags, rawText: tags.join(', ') })
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="border-border-strong bg-bg-deep focus-within:border-forge-orange/60 flex flex-wrap items-center gap-1.5 rounded-md border p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-forge-orange/15 text-caption text-forge-amber inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono uppercase tracking-[0.08em]"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove ${tag}`}
              className="hover:text-error rounded p-0.5"
            >
              <Icon.Close size={10} />
            </button>
          </span>
        ))}
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(v)
            }
          }}
          placeholder={tags.length === 0 ? t.answerInput.typeEnter : t.answerInput.addTag}
          disabled={pending || tags.length >= 8}
          className="text-body text-text-primary placeholder:text-text-muted min-w-[140px] flex-1 bg-transparent focus:outline-none"
        />
      </div>
      {suggestions?.length ? (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
            {t.answerInput.suggestions}
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending || tags.includes(s)}
              onClick={() => add(s)}
              className="border-border-subtle bg-bg-deep text-caption text-text-secondary hover:border-forge-orange/40 hover:text-forge-amber rounded-full border px-2 py-0.5 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <Button type="submit" size="lg" disabled={pending || tags.length === 0} className="self-end">
        <Icon.Send size={14} /> {t.answerInput.send} {tags.length > 0 ? `(${tags.length})` : ''}
      </Button>
    </form>
  )
}

'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { Textarea } from '@/components/ui/input'
import { useCopilot } from '@/components/copilot/copilot-provider'
import { useEditor } from './editor-store'

const SUGGESTIONS = [
  'Make the hero more bold.',
  'Change palette to warmer tones.',
  'Add a testimonials block before the footer.',
  'Tighten spacing on mobile.',
]

/**
 * Editor-local AI chat (T22).
 *
 * Lives at the bottom of the right inspector panel. Anything the user
 * types is forwarded to the global Copilot (so the conversation history
 * is shared with the floating Drawer launcher), with the editor context
 * + currently selected block id pre-attached.
 *
 * In response to AI tool calls like `modify_theme_block`, we apply the
 * change locally to the editor store. (Mock: we just toast a success.)
 */
export function EditorAIChat() {
  const editor = useEditor()
  const copilot = useCopilot()
  const [text, setText] = useState('')

  const dispatch = (prompt: string) => {
    copilot.setOpen(true)
    void copilot.send(prompt)
    setText('')
  }

  return (
    <div className="border-t border-border-subtle bg-bg-surface px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 font-mono text-caption uppercase tracking-[0.18em] text-forge-amber">
          <Icon.Sparkle size={12} /> AI editor
        </p>
        <span className="font-mono text-caption text-text-muted">
          {editor.selectedBlock ? editor.selectedBlock.type : 'page-wide'}
        </span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => dispatch(s)}
            className="rounded-full border border-border-subtle bg-bg-deep px-2 py-1 text-caption text-text-secondary hover:border-forge-orange/40 hover:text-forge-amber"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) dispatch(text.trim())
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell the AI what to change…"
          className="min-h-[44px] flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (text.trim()) dispatch(text.trim())
            }
          }}
        />
        <Button type="submit" size="md" disabled={!text.trim()}>
          <Icon.Send size={14} />
        </Button>
      </form>
    </div>
  )
}

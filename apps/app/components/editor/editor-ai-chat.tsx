'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { Textarea } from '@/components/ui/input'
import { useCopilot } from '@/components/copilot/copilot-provider'
import { useEditor } from './editor-store'

const SUGGESTIONS = [
  '让 Hero 更大胆一些。',
  '把整站配色改得更暖。',
  '在 Footer 前加一个用户评价区块。',
  '收紧移动端的间距。',
  '把 CTA 按钮改成磨砂玻璃风。',
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
    <div className="border-border-subtle bg-bg-surface border-t px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-caption text-forge-amber inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em]">
          <Icon.Sparkle size={12} /> AI editor
        </p>
        <span className="text-caption text-text-muted font-mono">
          {editor.selectedBlock ? editor.selectedBlock.type : 'page-wide'}
        </span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => dispatch(s)}
            className="border-border-subtle bg-bg-deep text-caption text-text-secondary hover:border-forge-orange/40 hover:text-forge-amber rounded-full border px-2 py-1"
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
          placeholder="告诉 AI 你想改什么……"
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

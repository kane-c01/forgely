'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

import type { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

interface RichEditorProps {
  /** Initial HTML — `defaultValue` semantics; reactive when the id changes. */
  value: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  /** Disable all input — used while saving or for read-only previews. */
  readOnly?: boolean
}

/**
 * Cinematic-Industrial styled Tiptap editor, used by the CMS Pages
 * surface. Intentionally tiny — paragraphs, headings, bold / italic /
 * code, lists. The full power-editor (tables / image upload / AI
 * rewrite) lands in a follow-up sprint.
 */
export function RichEditor({ value, onChange, placeholder, className, readOnly }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'forgely-code-block' } },
      }),
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[280px] max-w-none px-5 py-4 outline-none prose prose-invert prose-sm font-body text-text-primary [&_h1]:font-display [&_h2]:font-heading [&_h3]:font-heading [&_a]:text-forge-amber [&_code]:text-forge-amber [&_blockquote]:border-l-forge-orange [&_p]:text-text-secondary',
        'data-placeholder': placeholder ?? 'Start writing…',
      },
    },
    onUpdate({ editor: ed }) {
      onChange?.(ed.getHTML())
    },
  })

  // External value reset (e.g. switching pages in the same component)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === value) return
    editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  if (!editor) {
    return (
      <div
        className={cn(
          'border-border-subtle bg-bg-deep text-small text-text-muted min-h-[320px] rounded-md border px-5 py-4',
          className,
        )}
      >
        Loading editor…
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-border-subtle bg-bg-surface overflow-hidden rounded-md border',
        className,
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null
  const items: Array<{
    label: string
    icon: keyof typeof Icon | string
    onClick: () => void
    isActive: boolean
  }> = [
    {
      label: 'H1',
      icon: 'H1',
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      label: 'H2',
      icon: 'H2',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'H3',
      icon: 'H3',
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
    },
    {
      label: 'B',
      icon: 'B',
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      label: 'I',
      icon: 'I',
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      label: 'S',
      icon: 'S',
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
    },
    {
      label: 'Code',
      icon: '</>',
      onClick: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
    },
    {
      label: 'List',
      icon: '•',
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      label: 'Ordered',
      icon: '1.',
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      label: 'Quote',
      icon: '“”',
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
    {
      label: 'HR',
      icon: '—',
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: false,
    },
  ]

  return (
    <div className="border-border-subtle bg-bg-deep flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          aria-label={it.label}
          aria-pressed={it.isActive}
          onClick={it.onClick}
          className={cn(
            'text-caption inline-flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 font-mono transition-colors',
            it.isActive
              ? 'bg-bg-elevated text-forge-amber shadow-[0_0_0_1px_rgba(255,107,26,0.4)_inset]'
              : 'text-text-secondary hover:bg-bg-elevated/60 hover:text-text-primary',
          )}
        >
          {String(it.icon)}
        </button>
      ))}
      <span className="text-caption text-text-muted ml-auto font-mono">
        {editor.storage.characterCount?.characters?.() ?? editor.getText().length} chars
      </span>
    </div>
  )
}

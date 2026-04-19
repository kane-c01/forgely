'use client'

import * as React from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  ImageIcon,
  Code2,
  Undo,
  Redo,
} from 'lucide-react'

import { cn } from './utils'

export interface RichTextEditorProps {
  /** Initial HTML content. */
  content?: string
  /** Callback on every content change (debounced internally). */
  onChange?: (html: string) => void
  /** Placeholder text. */
  placeholder?: string
  /** Make editor read-only. */
  editable?: boolean
  className?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-forge-orange/20 text-forge-orange'
          : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const addLink = () => {
    const url = window.prompt('URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="border-border-strong flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <div className="bg-border-strong mx-1 h-5 w-px" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <div className="bg-border-strong mx-1 h-5 w-px" />

      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Link">
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image">
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>

      <div className="bg-border-strong mx-1 h-5 w-px" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}

/**
 * RichTextEditor — Tiptap-based WYSIWYG editor with a compact toolbar
 * supporting bold, italic, link, list, heading, image, and code-block.
 */
export const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    { content = '', onChange, placeholder = 'Start writing…', editable = true, className },
    ref,
  ) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'not-prose' } } }),
        Link.configure({ openOnClick: false }),
        Image.configure({ allowBase64: true }),
      ],
      content,
      editable,
      editorProps: {
        attributes: {
          class:
            'prose prose-invert prose-sm max-w-none px-4 py-3 min-h-[160px] focus:outline-none text-text-primary',
        },
      },
      onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
    })

    return (
      <div
        ref={ref}
        className={cn(
          'border-border-strong bg-bg-elevated overflow-hidden rounded-xl border',
          'focus-within:ring-forge-orange focus-within:ring-offset-bg-void focus-within:ring-2 focus-within:ring-offset-2',
          className,
        )}
      >
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
        {editor && editor.isEmpty && (
          <p className="text-text-secondary pointer-events-none absolute px-4 py-3 text-sm">
            {placeholder}
          </p>
        )}
      </div>
    )
  },
)
